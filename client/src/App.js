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
import { Maintenance, MyPacman, MyTetris } from "./components/maintenance/index";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/home";
import Login from "./pages/Login";
import NoMatch from "./pages/NoMatch";
import Profile from "./pages/profile";
import JobReport from "./pages/JobReport";
import JobPage from "./pages/JobPage";
import AdminPage from "./pages/admin";

import Auth from "./utils/auth";

import Calendar from "./components/Calendar";

import { useSubscription } from "@apollo/client";

import { JOB_UPDATED_SUB } from "./utils/queries";

const API_BASE = process.env.REACT_APP_API_URL || "";
const MAINTENANCE_MODE = process.env.REACT_APP_MAINTENANCE_MODE === "true";
const loggedIn = Auth.loggedIn();


console.log("API_BASE is set to:", API_BASE);
console.log("MAINTENANCE_MODE is set to:", MAINTENANCE_MODE);
console.log("User logged in status:", loggedIn);

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
    connectionParams: () => {
      const token = localStorage.getItem("id_token");
      console.log("[WS] Using Token for WS Connection:", token);
      return {
        authorization: token ? `Bearer ${token}` : "",
        Authorization: token ? `Bearer ${token}` : "",
      };
    },
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


function JobWatcher({ enabled }) {
  // Don’t start the subscription unless enabled
  const { data } = useSubscription(JOB_UPDATED_SUB, {
    skip: !enabled,
  });


  React.useEffect(() => {
    if (!enabled) return;
    if (data) {
      console.log("Job updated:", data.jobUpdated);
    } else {
      console.log("No job update data received.");
    }
  }, [enabled, data]);

  return null;
}

function App() {

  return (
    <ApolloProvider client={client}>
      <JobWatcher />
      <Router future={{ 
        v7_startTransition: true ,
        v7_relativeSplatPath: true
      }}>
        <div className="flex-column justify-flex-start min-100-vh">
          <Header maintenance={MAINTENANCE_MODE} />
          <div className="container">
            { MAINTENANCE_MODE ? (
              <Maintenance />
            ) : (
              <>
              { loggedIn && <JobWatcher />}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile">
                <Route path=":username" element={<Profile />} />
                <Route path="" element={<Profile />} />
              </Route>
              <Route path="/my-calendar" element={<Calendar />} />
              <Route path="/job-report" element={<JobReport />} />
              <Route path="/jobs/:jobId" element={<JobPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/tetris" element={<MyTetris />} />
              <Route path="/pacman" element={<MyPacman />} />
              <Route path="*" element={<NoMatch />} />
            </Routes>
              </>
            )}
          </div>
          <Footer />
        </div>
      </Router>
    </ApolloProvider>
  );
}

export default App;
