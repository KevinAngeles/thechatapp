import { AuthenticatedUser } from '@routes/auth.d';

export function isAuthenticatedUser(user: unknown): user is AuthenticatedUser {
    return user !== null && 
           typeof user === 'object' && 
           'id' in user && 
           'nickname' in user;
}
