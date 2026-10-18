from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jwt.exceptions import InvalidTokenError
from pydantic import BaseModel, EmailStr, Field, field_validator
from pwdlib import PasswordHash
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db


app = FastAPI(title="BloodBridge API")

@app.get("/")
def root():
    return {
        "message": "BloodBridge API is running",
        "docs": "/docs",
        "health": "/api/health",
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

password_hasher = PasswordHash.recommended()
dummy_hash = password_hasher.hash("dummy-password-not-a-real-account")

COOKIE_NAME = "bloodbridge_session"
SESSION_SECONDS = 60 * 60
MAX_ATTEMPTS = 3
LOCK_DURATION = timedelta(hours=72)

Database = Annotated[Session, Depends(get_db)]


@app.middleware("http")
async def check_write_origin(request: Request, call_next):
    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        # Allow the frontend and the API's own Swagger interface.
        allowed_origins = {
            settings.frontend_origin.rstrip("/"),
            str(request.base_url).rstrip("/"),
        }

        if request.headers.get("origin") not in allowed_origins:
            return JSONResponse(
                status_code=403,
                content={"message": "Request origin is not allowed."},
            )

    return await call_next(request)


class SignupInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name is required.")
        return value


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


def lock_response(locked_until: datetime):
    return JSONResponse(
        status_code=423,
        content={
            "message": (
                "Too many failed login attempts. "
                "Try again after 72 hours."
            ),
            "attempts_remaining": 0,
            "locked_until": locked_until.isoformat(),
        },
    )


@app.get("/api/health")
def health(db: Database):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}


@app.post("/api/auth/signup", status_code=201)
def signup(payload: SignupInput, db: Database):
    email = str(payload.email).lower()
    hashed_password = password_hasher.hash(payload.password)

    try:
        db.execute(
            text("""
                INSERT INTO users (
                    full_name,
                    email,
                    password_hash
                )
                VALUES (
                    :full_name,
                    :email,
                    :password_hash
                )
            """),
            {
                "full_name": payload.name,
                "email": email,
                "password_hash": hashed_password,
            },
        )
        db.commit()

    except IntegrityError:
        db.rollback()
        return JSONResponse(
            status_code=409,
            content={"message": "Unable to register with that email."},
        )

    return {"message": "Account created. You can now log in."}


@app.post("/api/auth/login")
def login(
    payload: LoginInput,
    response: Response,
    db: Database,
):
    email = str(payload.email).lower()

    user = db.execute(
        text("""
            SELECT
                id,
                password_hash,
                is_active,
                failed_login_attempts,
                locked_until
            FROM users
            WHERE LOWER(email) = :email
            FOR UPDATE
        """),
        {"email": email},
    ).mappings().first()

    if user is None:
        password_hasher.verify(payload.password, dummy_hash)
        db.rollback()
        return JSONResponse(
            status_code=401,
            content={"message": "Invalid email or password."},
        )

    now = datetime.now(timezone.utc)

    if not user["is_active"]:
        db.rollback()
        return JSONResponse(
            status_code=401,
            content={"message": "Invalid email or password."},
        )

    locked_until = user["locked_until"]

    if locked_until is not None and locked_until > now:
        db.rollback()
        return lock_response(locked_until)

    # Begin a fresh attempt cycle after an expired lock.
    previous_attempts = (
        0 if locked_until is not None
        else user["failed_login_attempts"]
    )

    if not password_hasher.verify(
        payload.password,
        user["password_hash"],
    ):
        attempts = previous_attempts + 1

        new_lock = (
            now + LOCK_DURATION
            if attempts >= MAX_ATTEMPTS
            else None
        )

        db.execute(
            text("""
                UPDATE users
                SET failed_login_attempts = :attempts,
                    locked_until = :locked_until
                WHERE id = :user_id
            """),
            {
                "attempts": attempts,
                "locked_until": new_lock,
                "user_id": user["id"],
            },
        )
        db.commit()

        if new_lock is not None:
            return lock_response(new_lock)

        return JSONResponse(
            status_code=401,
            content={
                "message": "Invalid email or password.",
                "attempts_remaining": MAX_ATTEMPTS - attempts,
            },
        )

    db.execute(
        text("""
            UPDATE users
            SET failed_login_attempts = 0,
                locked_until = NULL
            WHERE id = :user_id
        """),
        {"user_id": user["id"]},
    )
    db.commit()

    token = jwt.encode(
        {
            "sub": str(user["id"]),
            "iat": now,
            "exp": now + timedelta(seconds=SESSION_SECONDS),
        },
        settings.jwt_secret,
        algorithm="HS256",
    )

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=SESSION_SECONDS,
        path="/",
    )

    return {"message": "Logged in successfully."}


def get_current_user(request: Request, db: Database):
    token = request.cookies.get(COOKIE_NAME)

    if not token:
        raise HTTPException(status_code=401, detail="Login required.")

    try:
        claims = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],
            options={"require": ["sub", "iat", "exp"]},
        )
        user_id = int(claims["sub"])

    except (InvalidTokenError, ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session.",
        )

    user = db.execute(
        text("""
            SELECT id, full_name, email, is_active
            FROM users
            WHERE id = :user_id
        """),
        {"user_id": user_id},
    ).mappings().first()

    if user is None or not user["is_active"]:
        raise HTTPException(
            status_code=401,
            detail="Account unavailable.",
        )

    return dict(user)


@app.get("/api/auth/me")
def me(user: Annotated[dict, Depends(get_current_user)]):
    return user


@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        secure=settings.cookie_secure,
        httponly=True,
        samesite="lax",
    )
    return {"message": "Logged out successfully."}