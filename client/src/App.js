import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
  split,
  useSubscription,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

import MaintenanceTetris from "./components/maintenance";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/home";
import Login from "./pages/Login";
import NoMatch from "./pages/NoMatch";
import Profile from "./pages/profile";
import JobReport from "./pages/JobReport";
import JobPage from "./pages/JobPage";
import AdminPage from "./pages/admin";
import PrivateRoute from "./components/PrivateRoute";
import Calendar from "./components/Calendar";

import Auth from "./utils/auth";
import { JOB_UPDATED_SUB } from "./utils/queries";

const API_BASE = process.env.REACT_APP_API_URL || "";
const MAINTENANCE_MODE = process.env.REACT_APP_MAINTENANCE_MODE === "true";

console.log("API_BASE:", API_BASE);
console.log("MAINTENANCE_MODE:", MAINTENANCE_MODE);

const httpLink = createHttpLink({ uri: `${API_BASE}/graphql` });

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
      return {
        authorization: token ? `Bearer ${token}` : "",
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
  const { data } = useSubscription(JOB_UPDATED_SUB, { skip: !enabled });

  useEffect(() => {
    if (!enabled) return;
    if (data) {
      console.log("Job updated:", data.jobUpdated);
    }
  }, [enabled, data]);

  return null;
}

function App() {
  console.log("Rendering App component");
  const [loggedIn, setLoggedIn] = useState(Auth.loggedIn());

  useEffect(() => {
    // Listen for token changes (for example, login/logout)
    const interval = setInterval(() => {
      const isLoggedIn = Auth.loggedIn();
      setLoggedIn(isLoggedIn);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (MAINTENANCE_MODE) {
    return (
      <div className="flex-column justify-flex-start min-100-vh">
        <Header maintenance />
        <div className="container">
          <MaintenanceTetris />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <ApolloProvider client={client}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="flex-column justify-flex-start min-100-vh">
          <Header maintenance={false} />
          <div className="container">
            <JobWatcher enabled={loggedIn} />

            <Routes>
              {/* Public */}
              <Route
                path="/login"
                element={
                  loggedIn ? <Home /> : <Login />
                }
              />

              {/* Protected */}
              <Route element={<PrivateRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/profile">
                  <Route path=":username" element={<Profile />} />
                  <Route path="" element={<Profile />} />
                </Route>
                <Route path="/my-calendar" element={<Calendar />} />
                <Route path="/job-report" element={<JobReport />} />
                <Route path="/jobs/:jobId" element={<JobPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<NoMatch />} />
              </Route>
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </ApolloProvider>
  );
}

export default App;