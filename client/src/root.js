import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
  split
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

import { URLS } from "./config/urls";
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
// 2. HTTP LINK
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
// 5. CREATE APOLLO CLIENT
// ----------------------------------
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

// ----------------------------------
// 6. PROVIDER WRAPPER
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