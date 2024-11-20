import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export function hashPassword(password: string): Promise<string> {
  const saltRounds: number = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hash(password, salt);
}

export function generateToken(data: TokenData): string {
  const expireTime: string = '15m';
  const token: string = jwt.sign(data, process.env.PRIVATE_KEY, { expiresIn: expireTime });

  return token;
}

export function isValidToken(token: string): boolean {
  try {
    jwt.verify(token, process.env.PRIVATE_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

// NOTE(roman): assuming that `isValidToken` will be called before
export function extraDataFromToken(token: string): TokenData {
  const decodedToken = jwt.verify(token, process.env.PRIVATE_KEY, { complete: true });
  return decodedToken.payload as TokenData;
}
export interface TokenData {
  id: number;
}
