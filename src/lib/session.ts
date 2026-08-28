import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET);

export const COOKIE_NAME = "session";
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 días

export async function createSessionToken(adminId: string) {
  return new SignJWT({ adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<{ adminId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.adminId !== "string") return null;
    return { adminId: payload.adminId };
  } catch {
    return null;
  }
}
