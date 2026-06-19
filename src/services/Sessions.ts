import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = import.meta.env.JWT_SECRET || "secret-key";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export type SessionPayload = {
  uid: string;
  email: string;
  role?: string;
};

export const Sessions = () => {

  const createToken = async (payload: SessionPayload) => {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("aves-system")
      .setAudience("aves-client")
      .setExpirationTime("7d")
      .sign(secret);
  };

  const verifyToken = async (token: string) => {
    try {
      const { payload } = await jwtVerify(
        token,
        secret,
        {
          issuer: "aves-system",
          audience: "aves-client",
        }
      );

      return { success: true, user: payload as unknown as SessionPayload };
    } catch {
      return { success: false };
    }
  };

  return { createToken, verifyToken };
};
