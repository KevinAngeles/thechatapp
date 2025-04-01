import { Request } from 'express';
// Custom function to extract JWT from cookies
import { JwtType } from '../routes/auth.d';
import { authentication } from './constants';

export const createTokenCookies = (jwt: JwtType, payload: { id: string, nickname: string }, res: any) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_BASE_URL as string);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  const accessToken: string = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '15m' });
  const refreshToken: string = jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d' });
  const accessTokenLimitDate = new Date();
  accessTokenLimitDate.setMinutes(accessTokenLimitDate.getMinutes() + 15);
  const refreshTokenLimitDate = new Date();
  refreshTokenLimitDate.setDate(refreshTokenLimitDate.getDate() + 7);
  const accessTokenData: string = JSON.stringify({"validUntil": accessTokenLimitDate});
  const refreshTokenData: string = JSON.stringify({"validUntil": refreshTokenLimitDate});
  // Set HTTP-only cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  res.cookie('accessTokenData', accessTokenData, {
    maxAge: 15 * 60 * 1000 // 15 minutes
  });
  res.cookie('refreshTokenData', refreshTokenData, {
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  return { newAccessToken: accessToken, newRefreshToken: refreshToken, newAccessTokenData: accessTokenData, newRefreshTokenData: refreshTokenData };
}

export const cookieExtractor = (req: Request, tokenName: string) => {
  // req.cookies: { accessToken: string, refreshToken: string, accessTokenData: string, refreshTokenData: string }
  let token = null;
  if (req && req.cookies) {
    token = req.cookies[tokenName];
  }
  return token;
};

export const validateLoginInputs = (userId: string, password: string): { userIdMessageValidation: string, passwordMessageValidation: string } => {
  const userIdRegEx = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  const passwordRegEx = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
  let userIdMessageValidation = "";
  let passwordMessageValidation = "";
  if (!userIdRegEx.test(userId)) {
    userIdMessageValidation = authentication.login.errorMessages.userId.invalid;
  }
  if (!passwordRegEx.test(password)) {
    passwordMessageValidation = authentication.login.errorMessages.password.invalid;
  }
  return { userIdMessageValidation, passwordMessageValidation };
}

export const validateRegisterInputs = (userId: string, password: string, nickname: string): { userIdMessageValidation: string, passwordMessageValidation: string, nicknameMessageValidation: string } => {
  const userIdRegEx = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  const passwordRegEx = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
  const nicknameRegEx = /^[a-zA-Z0-9]{3,}$/
  let userIdMessageValidation = "";
  let passwordMessageValidation = "";
  let nicknameMessageValidation = "";
  if (!userIdRegEx.test(userId)) {
    userIdMessageValidation = authentication.registration.errorMessages.userId.invalid;
  }
  if (!passwordRegEx.test(password)) {
    passwordMessageValidation = authentication.registration.errorMessages.password.invalid;
  }
  if (!nicknameRegEx.test(nickname)) {
    nicknameMessageValidation = authentication.registration.errorMessages.nickname.invalid;
  }
  return { userIdMessageValidation, passwordMessageValidation, nicknameMessageValidation };
}
