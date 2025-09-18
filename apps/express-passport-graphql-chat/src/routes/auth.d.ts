import jwt from "jsonwebtoken";

export type JwtType = typeof jwt;

export interface AuthInfo {
    message: string;
}

export interface AuthenticatedUser {
    publicId: string;
    nickname: string;
}

export interface IErrorData {
    message: string;
    user?: null;
    status?: number; 
    fields?: {
        username: string[];
        password: string[];
        nickname?: string[];
    }
}
