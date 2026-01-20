import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
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
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      console.log(`GraphQL error: ${message}`);
      
      // Check for authentication errors
      if (extensions?.code === 'UNAUTHENTICATED' || message.includes('Not logged in')) {
        console.log('Token expired, attempting refresh...');
        
        // Try to refresh token
        if (Auth.shouldRefreshToken()) {
          return Auth.refreshToken().then((newToken) => {
            if (newToken) {
              console.log('Token refreshed successfully');
              // Retry the original operation with new token
              const oldHeaders = operation.getContext().headers;
              operation.setContext({
                headers: {
                  ...oldHeaders,
                  authorization: `Bearer ${newToken}`,
                },
              });
              return forward(operation);
            } else {
              // Refresh failed, redirect to login
              console.log('Token refresh failed, redirecting to login');
              Auth.logout();
            }
          }).catch((error) => {
            console.error('Token refresh error:', error);
            Auth.logout();
          });
        } else {
          // No refresh token available, redirect to login
          Auth.logout();
        }
      }
    });
  }
  
  if (networkError) {
    console.log(`Network error: ${networkError}`);
    // Handle network errors that might indicate auth issues
    if (networkError.statusCode === 401) {
      console.log('401 Unauthorized, checking token...');
      if (Auth.shouldRefreshToken()) {
        return Auth.refreshToken();
      } else {
        Auth.logout();
      }
    }
  }
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