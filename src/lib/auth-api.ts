export type AuthResponse = {
  message?: string;
  attempts_remaining?: number;
  locked_until?: string;
};

export class AuthApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data: AuthResponse,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

export async function submitAuth(
  mode: "login" | "signup",
  values: {
    email: string;
    password: string;
    name?: string;
  },
): Promise<AuthResponse> {
  const response = await fetch(
    `http://localhost:8000/api/auth/${mode}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });

  const data: AuthResponse = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new AuthApiError(
      data.message || "Unable to complete your request.",
      response.status,
      data,
    );
  }

  return data;
}