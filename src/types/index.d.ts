import { IUser } from '../../types';

declare module 'express-serve-static-core' {
  interface Request {
    currentUser?: IUser;
  }
}
