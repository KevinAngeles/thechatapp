import { IUser, Types } from '../models/User';

declare global {
  namespace Express {
    // Make Express.User equivalent to IUser
    interface User extends IUser {
      _id: Types.ObjectId;
    }
  }
}
export {}; // This file needs to be a module