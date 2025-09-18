import bcrypt from 'bcryptjs';
import { Request } from 'express';
import { PassportStatic } from 'passport';
import { IVerifyOptions, Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt';
import { cookieExtractor, validateLoginInputs, validateRegisterInputs } from '@utils/index';
import { IJwtPayload } from './passport-config.d';
import { User } from '@models/User';
import { authentication } from '@utils/constants';
import { IErrorData } from '@routes/auth.d';
import { Types } from 'mongoose';

const passportConfig = (passport: PassportStatic) => {
  // Local strategy for email/password authentication
  passport.use(
    'login',
    new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password',
    },
    async (username: string, password: string, done: (error: unknown, user?: Express.User | false, options?: IVerifyOptions) => void) => {
      const errorObject = {
        message: authentication.login.errorMessages.general.credentials,
        status: 400,
        fields: {
          username: [] as string[],
          password: [] as string[]
        }
      };
      try {
        const {usernameMessageValidation, passwordMessageValidation} = validateLoginInputs(username, password);
        let isValid = true;
        if (usernameMessageValidation.length > 0) {
          errorObject.fields.username.push(usernameMessageValidation);
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
        // If no user found with that username
        const user = await User.findOne({ username });
        if (!user) {
          return done(errorData, false, { message: authentication.login.errorMessages.general.credentials });
        }
        // If there is a user found with that username, check if the password is correct
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
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true
    },
    async (req: Request, username: string, password: string, done: (error: unknown, user?: Express.User | false, options?: IVerifyOptions) => void) => {
      const { nickname } = req.body;
      const errorObject = {
        message: authentication.registration.errorMessages.general.invalid,
        status: 400,
        fields: {
          username: [] as string[],
          password: [] as string[],
          nickname: [] as string[],
        }
      }
      try {
        const {usernameMessageValidation, passwordMessageValidation, nicknameMessageValidation} = validateRegisterInputs(username, password, nickname);
        let isValid = true;
        if (usernameMessageValidation.length > 0) {
          errorObject.fields.username.push(usernameMessageValidation);
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
        const userIdxists = await User.findOne({ username });
        const nicknameExists = await User.findOne({ nickname });
        const uniqueDataAlreadyExist = userIdxists || nicknameExists;
        if (userIdxists) {
          errorObject.fields.username.push(authentication.registration.errorMessages.username.exist);
        }
        if (nicknameExists) {
          errorObject.fields.nickname.push(authentication.registration.errorMessages.nickname.exist);
        }
        errorData = errorObject;
        if (uniqueDataAlreadyExist) {
          errorData.status = 400;
          return done(errorData);
        }
        // neither username nor nickname exist, so create a new user
        const user = await User.create({ username, password, nickname });
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
        secretOrKey: process.env.JWT_SECRET as string,
        ignoreExpiration: false
      },
      async (jwt_payload: IJwtPayload, done: VerifiedCallback) => {
        try {
          // Basic claim validation
            if (jwt_payload.iss !== (process.env.JWT_ISSUER || 'thechatapp') || jwt_payload.aud !== (process.env.JWT_AUDIENCE || 'thechatapp')) {
              return done(null, false);
            }
          // Find user by publicId (subject)
          const user = await User.findOne({ publicId: jwt_payload.sub });
          if (!user) {
            return done(null, false);
          }
          // Token version match
          if (user.tokenVersion !== jwt_payload.ver) {
            return done(null, false);
          }
          return done(null, user);
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
        secretOrKey: process.env.JWT_REFRESH_SECRET as string,
        ignoreExpiration: false
      },
      async (jwt_payload: IJwtPayload, done: VerifiedCallback) => {
        try {
          if (jwt_payload.iss !== (process.env.JWT_ISSUER || 'thechatapp') || jwt_payload.aud !== (process.env.JWT_AUDIENCE || 'thechatapp')) {
            return done(null, false);
          }
          const user = await User.findOne({ publicId: jwt_payload.sub });
          if (!user) return done(null, false);
          if (user.tokenVersion !== jwt_payload.ver) return done(null, false);
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  // Serialize user to store in session
  passport.serializeUser<Types.ObjectId>((user: Express.User, done: (err: unknown, id?: Types.ObjectId) => void) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser<Types.ObjectId>(async (id: Types.ObjectId, done: (err: unknown, user?: Express.User | false | null) => void) => {
    try {
      const user = await User.findById(id);
      if (!user || !user.nickname || !user.username) {
        throw new Error('User not found');
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};

export default passportConfig;
