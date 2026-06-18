import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
  fromPromise,
  split,
  from
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

import { URLS } from "./config/urls";
import Auth from "./utils/auth";
import App from "./App";

// ----------------------------------
// 1. AUTH LINK
// ----------------------------------
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("id_token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// ----------------------------------
// 2. ERROR LINK (Handle token expiration)
// ----------------------------------
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  const hasGraphQLAuthError = graphQLErrors?.some(({ message, extensions }) => {
    console.log(`GraphQL error: ${message}`);
    return extensions?.code === "UNAUTHENTICATED" || message.includes("Not logged in");
  });

  if (networkError) {
    console.log(`Network error: ${networkError}`);
  }

  const hasNetworkAuthError = networkError?.statusCode === 401;

  if (!hasGraphQLAuthError && !hasNetworkAuthError) {
    return undefined;
  }

  if (!Auth.shouldRefreshToken()) {
    Auth.logout();
    return undefined;
  }

  return fromPromise(
    Auth.refreshToken().then((newToken) => {
      if (!newToken) {
        throw new Error("Token refresh failed");
      }

      return newToken;
    })
  ).flatMap((newToken) => {
    const oldHeaders = operation.getContext().headers || {};

    operation.setContext({
      headers: {
        ...oldHeaders,
        authorization: `Bearer ${newToken}`,
      },
    });

    return forward(operation);
  });
});

// ----------------------------------
// 3. HTTP LINK
// ----------------------------------
const httpUri = URLS.apiURL;
const httpLink = createHttpLink({ uri: httpUri });

// ----------------------------------
// 3. WS LINK
// ----------------------------------
const wsUri = httpUri.replace(/^http/, "ws");

const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUri,
    connectionParams: () => {
      const token = localStorage.getItem("id_token");
      return {
        authorization: token ? `Bearer ${token}` : "",
      };
    },
  })
);

// ----------------------------------
// 4. SPLIT LINK (subscriptions → WS)
// ----------------------------------
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,               // Subscriptions
  authLink.concat(httpLink) // Query & Mutation
);

// ----------------------------------
// 6. CREATE APOLLO CLIENT
// ----------------------------------
const client = new ApolloClient({
  link: from([
    errorLink,
    splitLink
  ]),
  cache: new InMemoryCache(),
});

// ----------------------------------
// 7. PROVIDER WRAPPER
// ----------------------------------
export default function Root() {
  return (
    <ApolloProvider client={client}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </Router>
    </ApolloProvider>
  );
}