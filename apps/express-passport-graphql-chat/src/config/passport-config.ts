import bcrypt from 'bcryptjs';
import { Request } from 'express';
import { PassportStatic } from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt';
import { cookieExtractor, validateLoginInputs, validateRegisterInputs } from '../utils/index';
import { IJwtPayload } from './passport-config.d';
import { User } from '../models/User';
import { authentication } from '../utils/constants';
import { AuthenticatedUser, IErrorData } from '../routes/auth.d';

const passportConfig = (passport: PassportStatic) => {
  // Local strategy for email/password authentication
  passport.use(
    'login',
    new LocalStrategy({
      usernameField: 'userId',
      passwordField: 'password',
    },
    async (userId, password, done) => {
      const errorObject = {
        message: authentication.login.errorMessages.general.credentials,
        status: 400,
        fields: {
          userId: [] as string[],
          password: [] as string[]
        }
      };
      try {
        const {userIdMessageValidation, passwordMessageValidation} = validateLoginInputs(userId, password);
        let isValid = true;
        if (userIdMessageValidation.length > 0) {
          errorObject.fields.userId.push(userIdMessageValidation);
          isValid = false;
        }
        if (passwordMessageValidation.length > 0) {
          errorObject.fields.password.push(passwordMessageValidation);
          isValid = false;
        }
        const errorData: IErrorData = errorObject;
        if (!isValid) {
          return done(errorData, false, { message: authentication.login.errorMessages.general.credentials });
        }
        // If no user found with that id
        const user = await User.findOne({ userId });
        if (!user) {
          return done(errorData, false, { message: authentication.login.errorMessages.general.credentials });
        }
        // If there is a user found with that id, check if the password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          return done(null, user);
        } else {
          return done(errorData, false, { message: authentication.login.errorMessages.general.credentials });
        }
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.use(
    'register',
    new LocalStrategy({
      usernameField: 'userId',
      passwordField: 'password',
      passReqToCallback: true
    },
    async (req, userId, password, done) => {
      const { nickname } = req.body;
      const errorObject = {
        message: authentication.registration.errorMessages.general.invalid,
        status: 400,
        fields: {
          userId: [] as string[],
          password: [] as string[],
          nickname: [] as string[],
        }
      }
      try {
        const {userIdMessageValidation, passwordMessageValidation, nicknameMessageValidation} = validateRegisterInputs(userId, password, nickname);
        let isValid = true;
        if (userIdMessageValidation.length > 0) {
          errorObject.fields.userId.push(userIdMessageValidation);
          isValid = false;
        }
        if (passwordMessageValidation.length > 0) {
          errorObject.fields.password.push(passwordMessageValidation);
          isValid = false;
        }
        if (nicknameMessageValidation.length > 0) {
          errorObject.fields.nickname.push(nicknameMessageValidation);
          isValid = false;
        }
        let errorData: IErrorData = errorObject;
        if (!isValid) {
          return done(errorData, false, { message: authentication.registration.errorMessages.general.invalid });
        }
        // Verify that the user id or nickname do not already exist
        const userIdxists = await User.findOne({ userId });
        const nicknameExists = await User.findOne({ nickname });
        const uniqueDataAlreadyExist = userIdxists || nicknameExists;
        if (userIdxists) {
          errorObject.fields.userId.push(authentication.registration.errorMessages.userId.exist);
        }
        if (nicknameExists) {
          errorObject.fields.nickname.push(authentication.registration.errorMessages.nickname.exist);
        }
        errorData = errorObject;
        if (uniqueDataAlreadyExist) {
          errorData.status = 400;
          return done(errorData);
        }
        // neither user id or nickname exist, so create a new user
        const user = await User.create({ userId, password, nickname });
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.use(
    'accessToken',
    new JwtStrategy(
      {
        jwtFromRequest: (req: Request) => cookieExtractor(req, 'accessToken'),
        secretOrKey: process.env.JWT_SECRET as string
      },
      async (jwt_payload: IJwtPayload, done: VerifiedCallback) => {
        try {
          const user = await User.findById(jwt_payload.id);
          if (user) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  passport.use(
    'refreshToken',
    new JwtStrategy(
      {
        jwtFromRequest:  (req: Request) => cookieExtractor(req, 'refreshToken'),
        secretOrKey: process.env.JWT_SECRET as string
      },
      async (jwt_payload: IJwtPayload, done: VerifiedCallback) => {
        try {
          const user = await User.findById(jwt_payload.id);
          if (user) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  // Serialize user to store in session
  passport.serializeUser((user: any, done: any) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: any, done: any) => {
    try {
      const user = await User.findById(id);
      if (!user || !user.nickname || !user.userId) {
        throw new Error('User not found');
      }
      const authenticatedUser: AuthenticatedUser = {
        id: user.userId,
        nickname: user.nickname,
      }
      done(null, authenticatedUser);
    } catch (err) {
      done(err);
    }
  });
};

export default passportConfig;
