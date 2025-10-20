import { ApolloServer } from "apollo-server-express";
import { typeDefs, resolvers } from "../schemas/index.js";
import { getUserFromReq } from "../auth/middleware.js";

export async function createApolloServer() {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => ({
            user: req.user || getUserFromReq(req),
        }),
        introspection: true,
        playground: true,
    });

    await server.start();
    return server;
}