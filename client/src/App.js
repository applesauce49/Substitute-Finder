import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import MaintenanceTetris from "./components/maintenance";
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
// import UserJobStatsReport from "./pages/UserJobStatsReport";

import Auth from "./utils/auth";
import { useQuery, useSubscription } from "@apollo/client";
import { QUERY_ME, JOB_UPDATED_SUB } from "./utils/queries";

const MAINTENANCE_MODE = process.env.REACT_APP_MAINTENANCE_MODE === "true";

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

export default function App() {
  console.log("Rendering App component");

  // Auth state
  const [loggedIn, setLoggedIn] = useState(Auth.loggedIn());

  const { data: meData } = useQuery(QUERY_ME, {
    skip: !loggedIn,
  });

  const me = meData?.me || null;

  // Poll login status so UI stays in sync
  useEffect(() => {
    const interval = setInterval(() => {
      setLoggedIn(Auth.loggedIn());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (MAINTENANCE_MODE) {
    return (
      <div className="flex-column justify-flex-start min-100-vh">
        <Header maintenance={true} />
        <MaintenanceTetris />
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex-column justify-flex-start min-100-vh">
      <Header maintenance={false} loggedIn={loggedIn} me={me} />
      <div className="container">
        <JobWatcher enabled={loggedIn} />

        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={loggedIn ? <Home /> : <Login />}
          />

          {/* Protected routes */}
          <Route element={<PrivateRoute loggedIn={loggedIn} />}>
            <Route path="/" element={<Home me={me}/>} />
            <Route path="/profile">
              <Route path=":username" element={<Profile me={me} />} />
              <Route path="" element={<Profile me={me} />} />
            </Route>
            <Route path="/my-calendar" element={<Calendar />} />
            <Route path="/job-report" element={<JobReport me={me} />} />
            <Route path="/jobs/:jobId" element={<JobPage />} />
            <Route path="/admin" element={<AdminPage />} />
            {/* <Route path="/user-job-stats-report" element={<UserJobStatsReport />} /> */}
            <Route path="*" element={<NoMatch />} />
          </Route>
        </Routes>
      </div>
      <Footer />
    </div>
  );
}