import * as argon2 from 'argon2';
import crypto from 'crypto';

export const hashPassword = async (password: string): Promise<string> => {
    return await argon2.hash(password);
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    return await argon2.verify(hash, password)
}

