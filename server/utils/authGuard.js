import { AuthenticationError } from '@apollo/server/errors';

export function requireAuth(user) {
    if (!user) {
        throw new AuthenticationError("You must be logged in.");
    }
    return user;
}