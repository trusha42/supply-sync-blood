from datetime import datetime, timedelta, timezone
from typing import Annotated, Literal

import jwt
import hashlib
import logging
import secrets

from fastapi import BackgroundTasks
from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Query,
    Request,
    Response,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jwt.exceptions import InvalidTokenError
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from pwdlib import PasswordHash
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db, SessionLocal

from app.ai.routes import create_agent_router

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
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Content-Type",
        "Authorization",
    ],
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

class DonorDirectoryProfile(BaseModel):
    user_id: int
    full_name: str
    mobile_number: str | None
    age: int | None
    gender: str | None
    blood_group: str
    city: str
    state: str | None
    is_available: bool


class DonorSearchResult(BaseModel):
    donors: list[DonorDirectoryProfile]
    limit: int
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
            locked_until,
            session_version
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
        "ver": user["session_version"],
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
        raise HTTPException(
            status_code=401,
            detail="Login required.",
        )

    try:
        claims = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],
            options={
                "require": ["sub", "ver", "iat", "exp"]
            },
        )

        user_id = int(claims["sub"])

        if type(claims["ver"]) is not int:
            raise ValueError("Invalid session version.")

    except (InvalidTokenError, ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session.",
        )

    user = db.execute(
        text("""
            SELECT
                id,
                full_name,
                email,
                is_active,
                session_version
            FROM users
            WHERE id = :user_id
        """),
        {"user_id": user_id},
    ).mappings().first()

    if (
        user is None
        or not user["is_active"]
        or user["session_version"] != claims["ver"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Session expired. Please log in again.",
        )

    return {
        "id": user["id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "is_active": user["is_active"],
    }

app.include_router(
    create_agent_router(get_current_user)
)

class DonorProfileInput(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=10, max_length=20)
    age: int = Field(ge=18, le=100)
    gender: Literal[
        "male",
        "female",
        "other",
        "prefer_not_to_say",
    ]
    blood_group: Literal[
        "A+", "A-",
        "B+", "B-",
        "AB+", "AB-",
        "O+", "O-",
    ]
    city: str = Field(min_length=1, max_length=100)
    is_available: bool
    notification_consent: bool


@app.put("/api/donors/me")
def save_my_donor_profile(
    payload: DonorProfileInput,
    db: Database,
    user: Annotated[dict, Depends(get_current_user)],
):
    try:
       profile = db.execute(
    text("""
        INSERT INTO donor_profiles (
            user_id,
            full_name,
            phone,
            age,
            gender,
            blood_group,
            city,
            is_available,
            notification_consent,
            consent_updated_at
        )
        VALUES (
            :user_id,
            :full_name,
            :phone,
            :age,
            :gender,
            :blood_group,
            :city,
            :is_available,
            :notification_consent,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            age = EXCLUDED.age,
            gender = EXCLUDED.gender,
            blood_group = EXCLUDED.blood_group,
            city = EXCLUDED.city,
            is_available = EXCLUDED.is_available,
            notification_consent =
                EXCLUDED.notification_consent,
            consent_updated_at = CURRENT_TIMESTAMP
        RETURNING
            user_id,
            full_name,
            phone,
            age,
            gender,
            blood_group,
            city,
            state,
            is_available,
            notification_consent,
            consent_updated_at,
            created_at
    """),
    {
        "user_id": user["id"],
        "full_name": payload.full_name,
        "phone": payload.phone,
        "age": payload.age,
        "gender": payload.gender,
        "blood_group": payload.blood_group,
        "city": payload.city,
        "is_available": payload.is_available,
        "notification_consent":
            payload.notification_consent,
    },
).mappings().one()
       saved_profile = dict(profile)
       db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Donor profile saved successfully.",
        "profile": saved_profile,
    }


@app.get("/api/donors/me")
def get_my_donor_profile(
    db: Database,
    user: Annotated[dict, Depends(get_current_user)],
):
    profile = db.execute(
        text("""
            SELECT
                user_id,
                blood_group,
                city,
                state,
                is_available,
                notification_consent,
                consent_updated_at,
                created_at
            FROM donor_profiles
            WHERE user_id = :user_id
        """),
        {"user_id": user["id"]},
    ).mappings().first()

    return {
        "profile": dict(profile) if profile is not None else None,
    }

@app.get("/api/donors/search")
def search_donor_profiles(
    db: Database,
    user: Annotated[dict, Depends(get_current_user)],
    query: Annotated[
        str,
        Query(
            alias="q",
            min_length=3,
            max_length=100,
        ),
    ],
):
    search_value = query.strip()

    if not search_value:
        raise HTTPException(
            status_code=422,
            detail="Enter a name or mobile number.",
        )

    rows = db.execute(
        text("""
            SELECT
                u.id AS user_id,
                dp.full_name,
                dp.phone,
                dp.age,
                dp.gender,
                dp.blood_group,
                dp.city,
                dp.state,
                dp.is_available
            FROM users AS u
            INNER JOIN donor_profiles AS dp
              ON dp.user_id = u.id
            WHERE u.is_active = TRUE
              AND dp.is_available = TRUE
              AND (
                    dp.full_name ILIKE :name_query
                 OR dp.phone = :phone_query
              )
            ORDER BY dp.full_name ASC
            LIMIT 20
        """),
        {
            "name_query": f"%{search_value}%",
            "phone_query": search_value,
        },
    ).mappings().all()

    return {
        "donors": [dict(row) for row in rows],
        "limit": 20,
    }

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

logger = logging.getLogger(__name__)

RESET_TOKEN_MINUTES = 15

class OrganizationCreateInput(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    name: str = Field(min_length=1, max_length=100)
    organization_type: Literal["hospital", "blood_bank"]
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)


class InventoryCreateInput(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    batch_reference: str = Field(min_length=1, max_length=100)

    blood_group: Literal[
        "A+", "A-",
        "B+", "B-",
        "AB+", "AB-",
        "O+", "O-",
    ]

    component: Literal[
        "whole_blood",
        "red_cells",
        "platelets",
        "plasma",
        "cryoprecipitate",
    ]

    quantity_on_hand: int = Field(
        ge=1,
        le=10000,
        strict=True,
    )

    expires_at: datetime

    @field_validator("expires_at")
    @classmethod
    def validate_expiry(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError(
                "Expiry must include a time-zone offset."
            )

        if value <= datetime.now(timezone.utc):
            raise ValueError("Expiry must be in the future.")

        return value


def get_workspace_organization(db: Session, user_id: int):
    organizations = db.execute(
        text("""
            SELECT
                o.id,
                o.name,
                o.organization_type,
                o.city,
                o.state,
                o.verification_status,
                m.member_role
            FROM organizations AS o
            JOIN organization_members AS m
              ON m.organization_id = o.id
            WHERE m.user_id = :user_id
              AND m.is_active = TRUE
            ORDER BY o.id
            LIMIT 2
        """),
        {"user_id": user_id},
    ).mappings().all()

    if not organizations:
        return None

    if len(organizations) > 1:
        raise HTTPException(
            status_code=409,
            detail=(
                "Your account belongs to multiple organizations. "
                "An organization selector must be implemented."
            ),
        )

    return dict(organizations[0])

@app.post("/api/organizations", status_code=201)
def create_organization(
    payload: OrganizationCreateInput,
    db: Database,
    user: Annotated[dict, Depends(get_current_user)],
):
    try:
        # Serialize organization creation for this user.
        db.execute(
            text("""
                SELECT id
                FROM users
                WHERE id = :user_id
                FOR UPDATE
            """),
            {"user_id": user["id"]},
        )

        existing_membership = db.execute(
            text("""
                SELECT organization_id
                FROM organization_members
                WHERE user_id = :user_id
                  AND is_active = TRUE
                LIMIT 1
            """),
            {"user_id": user["id"]},
        ).first()

        if existing_membership is not None:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Your account already belongs to an organization."
                ),
            )

        organization = db.execute(
            text("""
                INSERT INTO organizations (
                    name,
                    organization_type,
                    city,
                    state,
                    verification_status
                )
                VALUES (
                    :name,
                    :organization_type,
                    :city,
                    :state,
                    'pending'
                )
                RETURNING
                    id,
                    name,
                    organization_type,
                    city,
                    state,
                    verification_status
            """),
            {
                "name": payload.name,
                "organization_type": payload.organization_type,
                "city": payload.city,
                "state": payload.state,
            },
        ).mappings().one()

        db.execute(
            text("""
                INSERT INTO organization_members (
                    organization_id,
                    user_id,
                    member_role,
                    is_active
                )
                VALUES (
                    :organization_id,
                    :user_id,
                    'admin',
                    TRUE
                )
            """),
            {
                "organization_id": organization["id"],
                "user_id": user["id"],
            },
        )

        saved_organization = dict(organization)

        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Organization registration conflicted with existing data.",
        ) from None

    except Exception:
        db.rollback()
        raise

    return {"organization": saved_organization}

@app.get("/api/organizations/me/inventory")
def get_workspace_inventory(
    db: Database,
    user: Annotated[dict, Depends(get_current_user)],
):
    organization = get_workspace_organization(
        db,
        user["id"],
    )

    if organization is None:
        return {
            "organization": None,
            "inventory": [],
        }

    inventory = db.execute(
        text("""
            SELECT
                id,
                batch_reference,
                blood_group,
                component,
                quantity_on_hand,
                quantity_reserved,
                expires_at,
                stock_status,
                updated_at
            FROM blood_inventory
            WHERE organization_id = :organization_id
            ORDER BY updated_at DESC, id DESC
        """),
        {"organization_id": organization["id"]},
    ).mappings().all()

    return {
        "organization": organization,
        "inventory": [dict(row) for row in inventory],
    }

@app.post(
    "/api/organizations/me/inventory",
    status_code=201,
)
def create_workspace_inventory(
    payload: InventoryCreateInput,
    db: Database,
    user: Annotated[dict, Depends(get_current_user)],
):
    organization = get_workspace_organization(
        db,
        user["id"],
    )

    if organization is None:
        raise HTTPException(
            status_code=409,
            detail="Register an organization before adding inventory.",
        )

    if organization["member_role"] not in {
        "admin",
        "inventory_manager",
    }:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to add inventory.",
        )

    if organization["verification_status"] in {
        "rejected",
        "suspended",
    }:
        raise HTTPException(
            status_code=403,
            detail="This organization cannot add inventory.",
        )

    try:
        inventory = db.execute(
            text("""
                INSERT INTO blood_inventory (
                    organization_id,
                    batch_reference,
                    blood_group,
                    component,
                    quantity_on_hand,
                    quantity_reserved,
                    expires_at,
                    stock_status,
                    updated_by
                )
                VALUES (
                    :organization_id,
                    :batch_reference,
                    :blood_group,
                    :component,
                    :quantity_on_hand,
                    0,
                    :expires_at,
                    'available',
                    :updated_by
                )
                RETURNING
                    id,
                    batch_reference,
                    blood_group,
                    component,
                    quantity_on_hand,
                    quantity_reserved,
                    expires_at,
                    stock_status,
                    updated_at
            """),
            {
                "organization_id": organization["id"],
                "batch_reference": payload.batch_reference,
                "blood_group": payload.blood_group,
                "component": payload.component,
                "quantity_on_hand": payload.quantity_on_hand,
                "expires_at": payload.expires_at,
                "updated_by": user["id"],
            },
        ).mappings().one()

        saved_inventory = dict(inventory)

        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "The inventory entry conflicts with existing data. "
                "Check whether this batch, blood group, and component "
                "already exist for the organization."
            ),
        ) from None

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Inventory saved with available status.",
        "inventory": saved_inventory,
    }

@app.get("/api/inventory/search")
def search_inventory_for_receiver(
    db: Database,
    user: Annotated[dict, Depends(get_current_user)],
    city: Annotated[str, Query(min_length=1, max_length=100)],
    blood_group: Literal[
        "A+", "A-",
        "B+", "B-",
        "AB+", "AB-",
        "O+", "O-",
    ],
    component: Literal[
        "whole_blood",
        "red_cells",
        "platelets",
        "plasma",
    ],
    quantity: Annotated[int, Query(ge=1, le=100)] = 1,
):
    city = city.strip()

    if not city:
        raise HTTPException(
            status_code=422,
            detail="City is required.",
        )

    rows = db.execute(
        text("""
            SELECT
                i.id AS inventory_id,
                o.id AS organization_id,
                o.name AS organization_name,
                o.city,
                o.state,
                o.address,
                o.phone,
                o.verification_status,
                o.latitude,
                o.longitude,
                i.blood_group,
                i.component,
                i.quantity_on_hand - i.quantity_reserved
                    AS available_quantity,
                i.updated_at,
                i.expires_at
            FROM blood_inventory AS i
            JOIN organizations AS o
              ON o.id = i.organization_id
            WHERE LOWER(o.city) = LOWER(:city)
              AND o.verification_status = 'verified'
              AND i.blood_group = :blood_group
              AND i.component = :component
              AND i.stock_status = 'available'
              AND i.expires_at > CURRENT_TIMESTAMP
              AND (
                  i.quantity_on_hand - i.quantity_reserved
              ) >= :quantity
            ORDER BY i.updated_at DESC, i.expires_at ASC
            LIMIT 50
        """),
        {
            "city": city,
            "blood_group": blood_group,
            "component": component,
            "quantity": quantity,
        },
    ).mappings().all()

    return {
        "listings": [dict(row) for row in rows],
        "limit": 50,
    }