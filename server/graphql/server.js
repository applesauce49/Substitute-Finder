import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { typeDefs, resolvers } from '../schemas/index.js';

export async function createApolloServer(httpServer, serverCleanup) {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        }
      },
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
  });

  await server.start();
  return server;
}