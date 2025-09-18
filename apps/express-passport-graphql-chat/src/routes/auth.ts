import passport from 'passport';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import express, { Request, Response, NextFunction, Router } from 'express';
import { AuthenticatedUser, AuthInfo, IErrorData } from './auth.d';
import { createTokenCookies, setResponseCorsOrigin } from '@utils/index';
// isAuthenticatedUser no longer needed with full JWT claims usage
import { authentication } from '@utils/constants';
import { User } from '../models/User.js';
import 'express-session';

const router: Router = express.Router();
router.use(cookieParser());

router.post('/login', (req: Request, res: Response, next: NextFunction) => {
    setResponseCorsOrigin(req, res);
    const errorData: IErrorData = {
        message: authentication.login.errorMessages.general.credentials,
        status: 400,
        fields: {
            username: [] as string[],
            password: [] as string[]
        }
    };
    try {
        const { keepLogged }: { keepLogged: boolean } = req.body;
        return passport.authenticate('login', { session: !keepLogged }, (err: Error | null | IErrorData, user: Express.User | null, info: AuthInfo | null) => {
            if (err || !user) {
                errorData.message = info ? info.message : authentication.login.errorMessages.general.credentials;
                // check if the error is of interface IErrorData
                if (err && 'fields' in err) {
                    errorData.fields = err.fields;
                }
                errorData.status = 400;
                return res.status(errorData.status).json(errorData);
            }

            const userResponse: AuthenticatedUser = {
                publicId: user.publicId,
                nickname: user.nickname
            };

            // Generate JWT tokens (subject = user.publicId)
            void createTokenCookies(jwt, { publicId: user.publicId, tokenVersion: user.tokenVersion }, res);
            return res.json({ message: authentication.login.successMessages.login, user: userResponse });
        })(req, res, next);
    } catch (error: unknown) {
        errorData.message = authentication.login.errorMessages.general.internal;
        errorData.status = 500;
        if (error instanceof Error) {
            console.error('Login error:', error.message);
        }
        return res.status(errorData.status).json(errorData);
    }
});

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    setResponseCorsOrigin(req, res);
    const errorData: IErrorData = {
        message: authentication.registration.errorMessages.general.invalid,
        status: 400,
        user: null,
        fields: {
            username: [] as string[],
            password: [] as string[],
            nickname: [] as string[],
        }
    };
    try {
        return passport.authenticate('register', { session: false }, (err: Error | null | IErrorData, user: Express.User | null, info: AuthInfo | null) => {
            if (err || !user) {
                errorData.message = info ? info.message : authentication.registration.errorMessages.general.invalid;
                // check if the error is of interface IErrorData
                if ((err as IErrorData)?.fields) {
                    errorData.fields = (err as IErrorData).fields;
                }
                errorData.status = 400;
                return res.status(errorData.status).json(errorData);
            }
            // At this point, the user has been created successfully
            // Generate JWT tokens (subject = user.publicId)
            void createTokenCookies(jwt, { publicId: user.publicId, tokenVersion: user.tokenVersion }, res);
            // This is the response sent back to the client after successful registration
            const userResponse: AuthenticatedUser = {
                publicId: user.publicId,
                nickname: user.nickname
            }
            return res.json({ message: authentication.registration.successMessages.register, user: userResponse });
        })(req, res, next);
    } catch (error: unknown) {
        errorData.message = authentication.registration.errorMessages.general.internal;
        errorData.status = 500;
        if (error instanceof Error) {
            console.error('Registration error:', error.message);
        }
        return res.status(errorData.status).json(errorData);
    }
});

router.post('/access-token', passport.authenticate('accessToken', { session: false }), (req: Request, res: Response) => {
    setResponseCorsOrigin(req, res);
    const errorData: IErrorData = {
        message: '',
        user: null,
        status: 400
    };
    try {
        const userResponse: AuthenticatedUser = {
            publicId: (req.user as Express.User).publicId,
            nickname: (req.user as Express.User).nickname
        }
        return res.json({ message: 'User verified', user: userResponse });
    } catch (error: unknown) {
        errorData.message = authentication.accessToken.errorMessages.internal;
        errorData.status = 500;
        if (error instanceof Error) {
            console.error('Access token error:', error.message);
        }
        return res.status(errorData.status).json(errorData);
    }
});

router.post('/refresh-token', (req: Request, res: Response) => {
    setResponseCorsOrigin(req, res);
    const errorData: IErrorData = {
        message: '',
        status: 400,
        user: null
    };
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        errorData.message = authentication.refreshToken.errorMessages.notoken;
        errorData.status = 401;
        return res.status(errorData.status).json(errorData);
    }
    
    interface DecodedRefreshToken { sub?: string; sid?: string; ver?: number; iss?: string; aud?: string; iat?: number; exp?: number }
    return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string, (err: jwt.VerifyErrors | null, decoded: unknown) => {
        const token = decoded as DecodedRefreshToken | undefined;
        if (err || !token || !token.sub) {
            errorData.message = authentication.refreshToken.errorMessages.invalid;
            errorData.status = 401;
            return res.status(errorData.status).json(errorData);
        }
        // Rotate tokens preserving session id (sid)
        const sessionId = token.sid;
        const publicSub = token.sub; // publicId stored as subject
        // We don't have nickname in token now; keep former behaviour by leaving route logic unchanged for DB lookup via passport strategy
        void createTokenCookies(jwt, { publicId: publicSub, tokenVersion: token.ver || 0 }, res, { sessionId });
        // Store the result of passport.authenticate and return it
        return passport.authenticate('accessToken', { session: false }, (err: Error | null, user: Express.User | null, info: AuthInfo | null) => {
            if (err || !user || !user.nickname) {
                errorData.message = info ? info.message : 'Token refresh failed';
                errorData.status = 400;
                return res.status(errorData.status).json(errorData);
            }
            const userResponse: AuthenticatedUser = {
                publicId: user.publicId,
                nickname: user.nickname
            };
            return res.json({ message: 'Token refreshed', user: userResponse });
        })(req, res);
    });
});

router.post('/logout', (req: Request, res: Response) => {
    setResponseCorsOrigin(req, res);
    const errorData: IErrorData = {
        message: '',
        status: 500,
        user: null
    };
    try {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return req.logout((err) => {
            if (err) {
                errorData.message = authentication.logout.errorMessages.internal;
                errorData.status = 500;
                return res.status(errorData.status).json(errorData);
            }
            return res.json({ message: 'Logout successful', user: null });
        });
    } catch (error: unknown) {
        errorData.message = authentication.logout.errorMessages.internal;
        errorData.status = 500;
        if (error instanceof Error) {
            console.error('Logout error:', error.message);
        }
        return res.status(errorData.status).json(errorData);
    }
});

router.get('/check-session', async (req: Request, res: Response) => {
    setResponseCorsOrigin(req, res); // ensure CORS headers on every path
    // Strategy:
    // 1. Try to read & verify accessToken cookie (short-lived JWT)
    // 2. If valid and user still matches token version, return loggedIn true
    // 3. Else, if a passport session exists (non keepLogged flow), use that
    // 4. Otherwise loggedIn: false
    const accessToken = req.cookies?.accessToken;
    interface DecodedAccessToken { sub?: string; ver?: number; iss?: string; aud?: string; iat?: number; exp?: number; sid?: string }
    try {
        if (!accessToken) {
            // No access token, so no JWT auth
            console.log("No access token present.");
        }
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET as string) as DecodedAccessToken;
        // Claim validations
        if (!decoded) {
            console.log("Access token verification failed.");
            return res.json({ loggedIn: false });
        }
        if (!decoded.sub) {
            console.log("Access token missing sub claim.");
            return res.json({ loggedIn: false });
        }
        if (!decoded.iss) {
            console.log("Access token missing issuer.");
            return res.json({ loggedIn: false });
        }
        if (decoded.iss !== (process.env.JWT_ISSUER || 'thechatapp')) {
            console.log("Access token issuer mismatch.");
            return res.json({ loggedIn: false });
        }
        if (!decoded.aud) {
            console.log("Access token missing audience.");
            return res.json({ loggedIn: false });
        }
        if (decoded.aud !== (process.env.JWT_AUDIENCE || 'thechatapp')) {
            console.log("Access token audience mismatch.");
            return res.json({ loggedIn: false });
        }
        // We still need the user to confirm tokenVersion hasn't been bumped.
        const user = await User.findOne({ publicId: decoded.sub });
        if (!user || user.tokenVersion !== decoded.ver) {
            console.log("Access token valid but user not found or token version mismatch.");
            return res.json({ loggedIn: false });
        }
        // get current time to compare with exp claim
        const currentTime = Math.floor(Date.now() / 1000);
        if (!decoded.exp) {
            console.log("Missing Access token expiration.");
            return res.json({ loggedIn: false });
        }
        // if token is not expired
        if (decoded.exp > currentTime) {
            const authenticatedUser: AuthenticatedUser = { publicId: user.publicId, nickname: user.nickname };
            return res.json({ loggedIn: true, user: authenticatedUser });
        }
        // if we reach here, the token is expired, so let's check the refresh token
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            console.log("Access token expired and no refresh token.");
            return res.json({ loggedIn: false });
        }
        // verify the refresh token
        interface DecodedRefreshToken { sub?: string; sid?: string; ver?: number; iss?: string; aud?: string; iat?: number; exp?: number }
        const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as DecodedRefreshToken;
        if (!decodedRefresh) {
            console.log("Refresh token verification failed.");
            return res.json({ loggedIn: false });
        }
        if (!decodedRefresh.sub) {
            console.log("Refresh token missing sub claim.");
            return res.json({ loggedIn: false });
        }
        if (!decodedRefresh.iss) {
            console.log("Refresh token missing issuer.");
            return res.json({ loggedIn: false });
        }
        if (decodedRefresh.iss !== (process.env.JWT_ISSUER || 'thechatapp')) {
            console.log("Refresh token issuer mismatch.");
            return res.json({ loggedIn: false });
        }
        if (!decodedRefresh.aud) {
            console.log("Refresh token missing audience.");
            return res.json({ loggedIn: false });
        }
        if (decodedRefresh.aud !== (process.env.JWT_AUDIENCE || 'thechatapp')) {
            console.log("Refresh token audience mismatch.");
            return res.json({ loggedIn: false });
        }
        // check tokenVersion again
        if (user.tokenVersion !== decodedRefresh.ver) {
            console.log("Refresh token valid but token version mismatch.");
            return res.json({ loggedIn: false });
        }
        if (!decodedRefresh.exp) {
            console.log("Missing Refresh token expiration.");
            return res.json({ loggedIn: false });
        }
        // if token is expired
        if (decodedRefresh.exp <= currentTime) {
            console.log("Refresh token expired.");
            return res.json({ loggedIn: false });
        }
        // Rotate tokens preserving session id (sid)
        const sessionId = decodedRefresh.sid;
        const publicSub = decodedRefresh.sub; // publicId stored as subject
        // Create a new access token and refresh token (new cookies)
        void createTokenCookies(jwt, { publicId: publicSub, tokenVersion: decodedRefresh.ver || 0 }, res, { sessionId });
        const authenticatedUser: AuthenticatedUser = { publicId: user.publicId, nickname: user.nickname };
        // Return the user
        return res.json({ loggedIn: true, user: authenticatedUser });
    } catch (error) {
        // Token invalid/expired – fall through to session or false
        console.log("Token verification error:", error);
    }
    return res.json({ loggedIn: false });
});

export default router;
