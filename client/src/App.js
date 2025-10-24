import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from 'graphql-ws';
import { split } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/home";
import Login from "./pages/Login";
import NoMatch from "./pages/NoMatch";
import SingleJob from "./pages/SingleJob";
import Profile from "./pages/profile";
import JobReport from "./pages/JobReport";

import Calendar from "./components/Calendar";

import { useSubscription } from "@apollo/client";

import { JOB_UPDATED_SUB } from "./utils/queries";

const API_BASE = process.env.REACT_APP_API_URL || "";

const httpLink = createHttpLink({
  uri: `${API_BASE}/graphql`,
});
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("id_token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: `${API_BASE.replace("http", "ws")}/graphql`.replace("https", "wss"),
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});


function JobWatcher() {
  const { data } = useSubscription(JOB_UPDATED_SUB);

  React.useEffect(() => {
    if (data) {
      console.log("Job updated:", data.jobUpdated);
    } else {
      console.log("No job update data received.");
    }
  }, [data]);

  return null;
}

function App() {
  return (
    <ApolloProvider client={client}>
      <JobWatcher />
      <Router>
        <div className="flex-column justify-flex-start min-100-vh">
          <Header />
          <div className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile">
                <Route path=":username" element={<Profile />} />
                <Route path="" element={<Profile />} />
              </Route>
              <Route path="/job/:id" element={<SingleJob />} />
              <Route path="/my-calendar" element={<Calendar />} />
              <Route path="/job-report" element={<JobReport />} />
              <Route path="*" element={<NoMatch />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </ApolloProvider>
  );
}

export default App;
