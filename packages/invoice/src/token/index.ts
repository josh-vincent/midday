import * as jose from "jose";

export async function verify(token: string, secret?: string) {
  const jwtSecret = secret || process.env.INVOICE_JWT_SECRET;
  const encodedSecret = new TextEncoder().encode(jwtSecret);
  const { payload } = await jose.jwtVerify(token, encodedSecret);

  return payload;
}

export async function generateToken(id: string, secret?: string) {
  const jwtSecret = secret || process.env.INVOICE_JWT_SECRET;
  const encodedSecret = new TextEncoder().encode(jwtSecret);
  const token = await new jose.SignJWT({ id })
    .setProtectedHeader({ alg: "HS256" })
    .sign(encodedSecret);

  return token;
}
