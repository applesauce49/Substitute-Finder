import {AuthenticationError } from "apollo-server-express";

export function requireAuth(user) {
    if (!user) {
        throw new AuthenticationError("You must be logged in.");
    }
    return user;
}