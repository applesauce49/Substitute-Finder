import { ApolloServer } from '@apollo/server';
import { typeDefs, resolvers } from '../schemas/index.js';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

export async function createApolloServer(httpServer) {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();
  return server;
}