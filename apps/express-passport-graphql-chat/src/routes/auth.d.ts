import jwt from "jsonwebtoken";

export type JwtType = typeof jwt;

export interface AuthInfo {
    message: string;
}

export interface AuthenticatedUser {
    id: string;
    nickname: string;
}

export interface IErrorData {
    message: string;
    user?: null;
    status?: number; 
    fields?: {
        userId: string[];
        password: string[];
        nickname?: string[];
    }
}
