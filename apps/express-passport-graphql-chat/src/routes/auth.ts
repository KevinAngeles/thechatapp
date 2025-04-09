import passport from 'passport';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import express, { Request, Response, NextFunction } from 'express';
import { AuthenticatedUser, AuthInfo } from './auth.d';
import { IErrorData } from './auth.d';
import { createTokenCookies } from '../utils';
import { authentication } from '../utils/constants';
import 'express-session';

const router = express.Router();
router.use(cookieParser());

router.post('/login', (req: Request, res: Response, next: NextFunction) => {
    const errorData: IErrorData = {
        message: authentication.login.errorMessages.general.credentials,
        status: 400,
        fields: {
            userId: [] as string[],
            password: [] as string[]
        }
    };
    try {
        const { keepLogged }: { keepLogged: boolean } = req.body;
        passport.authenticate('login', { session: !keepLogged }, (err: Error | null | IErrorData, user: AuthenticatedUser | null, info: AuthInfo | null) => {
            if (err || !user) {
                errorData.message = info ? info.message : authentication.login.errorMessages.general.credentials;
                // check if the error is of interface IErrorData
                if ((err as IErrorData).fields) {
                    errorData.fields = (err as IErrorData).fields;
                }
                errorData.status = 400;
                return res.status(errorData.status).json(errorData);
            }
            const userResponse: AuthenticatedUser = {
                id: user.id,
                nickname: user.nickname
            }
            if (keepLogged) {
                // Generate JWT tokens
                const payload: { id: string; nickname: string } = { id: user.id, nickname: user.nickname };
                createTokenCookies(jwt, payload, res);
                return res.json({ message: authentication.login.successMessages.login, user: userResponse });
            }
            // If not keepLogged, just return user data
            req.login(user, (loginErr)=> {
                if (loginErr) {
                    errorData.message = authentication.login.errorMessages.general.internal;
                    errorData.status = 500;
                    return next(res.status(errorData.status).json(errorData));
                }
                return res.json({ message: authentication.login.successMessages.login, user: userResponse });
            });
        })(req, res, next);
    } catch (error) {
        errorData.message = authentication.login.errorMessages.general.internal;
        errorData.status = 500;
        return next(res.status(errorData.status).json(errorData));
    }
});

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    const errorData: IErrorData = {
        message: authentication.registration.errorMessages.general.invalid,
        status: 400,
        user: null,
        fields: {
            userId: [] as string[],
            password: [] as string[],
            nickname: [] as string[],
        }
    };
    try {
        passport.authenticate('register', { session: false }, (err: Error | null | IErrorData, user: AuthenticatedUser | null, info: AuthInfo | null) => {
            if (err || !user) {
                errorData.message = info ? info.message : authentication.registration.errorMessages.general.invalid;
                // check if the error is of interface IErrorData
                if ((err as IErrorData).fields) {
                    errorData.fields = (err as IErrorData).fields;
                }
                errorData.status = 400;
                return res.status(errorData.status).json(errorData);
            }
            // At this point, the user has been created successfully
            // Generate JWT tokens
            const payload: { id: string; nickname: string } = { id: user.id, nickname: user.nickname };
            createTokenCookies(jwt, payload, res);
            const userResponse: AuthenticatedUser = {
                id: user.id,
                nickname: user.nickname
            }
            return res.json({ message: authentication.registration.successMessages.register, user: userResponse });
        })(req, res, next);
    } catch (error) {
        errorData.message = authentication.registration.errorMessages.general.internal;
        errorData.status = 500;
        return next(res.status(errorData.status).json(errorData));
    }
});

router.post('/access-token', passport.authenticate('accessToken', { session: false }), (req: Request, res: Response) => {
    const errorData: IErrorData = {
        message: '',
        user: null,
        status: 400
    };
    try {
        res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_BASE_URL as string);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        const userResponse: AuthenticatedUser = {
            id: (req.user as AuthenticatedUser).id,
            nickname: (req.user as AuthenticatedUser).nickname
        }
        res.json({ message: 'User verified', user: userResponse });
    } catch (error) {
        errorData.message = authentication.accessToken.errorMessages.internal;
        errorData.status = 500;
        res.status(errorData.status).json(errorData);
    }
});

router.post('/refresh-token', (req: Request, res: Response) => {
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
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string, (err: any, user: any) => {
        if (err) {
            errorData.message = authentication.refreshToken.errorMessages.invalid;
            errorData.status = 401;
            return res.status(errorData.status).json(errorData);
        }
        const payload: { id: string; nickname: string } = { id: user.id, nickname: user.nickname };
        // Generate new access token and refresh token
        const { newAccessToken } = createTokenCookies(jwt, payload, res);
        req.cookies.accessToken = newAccessToken;
        passport.authenticate('accessToken', { session: false }, (err: Error | null, user: AuthenticatedUser | null, info: AuthInfo | null) => {
            if (err || !user || !user.nickname) {
                errorData.message = info ? info.message : 'Token refresh failed';
                errorData.status = 400;
                return res.status(errorData.status).json(errorData);
            }
            const userResponse: AuthenticatedUser = {
                id: user.id,
                nickname: user.nickname
            }
            return res.json({ message: 'Token refreshed', user: userResponse });
        })(req, res);
    });
});

router.post('/logout', (req: Request, res: Response) => {
    const errorData: IErrorData = {
        message: '',
        status: 500,
        user: null
    };
    try {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.clearCookie('accessTokenData');
        res.clearCookie('refreshTokenData');
        req.logout((err) => {
            if (err) {
                errorData.message = authentication.logout.errorMessages.internal;
                errorData.status = 500;
                return res.status(errorData.status).json(errorData);
            }
            return res.json({ message: 'Logout successful', user: null });
        });
        return res.json({ message: 'Logout successful', user: null });
    } catch (error) {
        errorData.message = authentication.logout.errorMessages.internal;
        errorData.status = 500;
        return res.status(errorData.status).json(errorData);
    }
});

router.get('/check-session', (req: Request, res: Response) => {
    // check if passport session is valid
    if (req.isAuthenticated() && req.user) {
        const authenticatedUser = req.user as AuthenticatedUser;
        return res.json({ loggedIn: true, user: authenticatedUser });
    }
    return res.json({ loggedIn: false });
});

export default router;
