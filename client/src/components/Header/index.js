import React from "react";
import { Link } from "react-router-dom";

import Auth from "../../utils/auth";
import { motion } from "framer-motion";

import logo from "./logo.svg";
import "./App.css";
import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../../utils/queries";
import HamburgerMenu from "../HamburgerMenu";

const Header = ( { maintenance = false }) => {
  const logout = () => {
    Auth.logout();
  };

  const { data } = useQuery(QUERY_ME, {
    skip: !Auth.loggedIn(),
  });

  const me = data?.me;
  const isAdmin = me?.admin === true;
  const API_BASE = process.env.REACT_APP_API_URL

  const routes = [
    { label: "Calendar", path: "/my-calendar" },
    { label: "Profile", path: "/profile" },
    ...(isAdmin ? [{ path: "/admin", label: "Admin" }] : []),
    { label: "Logout", onClick: logout },
  ];

  return (
    <header className="bg-dark mb-4 flex-row align-center text-white">
      <div className="container flex-row justify-space-between-lg justify-center align-center main-logo">
        <Link className="main-logo" to="/">
          <motion.div
            initial={{ x: -100, opacity: 0 }}   // off-screen to the left, invisible
            animate={{
              x: 0,
              opacity: 1,
              transition: {
                type: "spring",   // natural bounce
                stiffness: 120,
                damping: 12,
                duration: 0.8,
              },
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.4 },
            }}
          >
            <h1 className="mb-1 mt-0 main-logo">
              Sub At
              <span>
                {" "}
                <img src={logo} className="App-logo" alt="logo" />
              </span>
              mic
            </h1>
            <p className="sub-title">An app for finding Substitute Peer Parents</p>
          </motion.div>
        </Link>

        {maintenance ? (
          <h3 style={{ color: "red", fontWeight: "bold" }}> Maintenance Mode</h3>
        ) : (
          <nav className="text-center">
          {Auth.loggedIn() ? (
            <>
              <div className="right">
                <Link className="nav-bar-links" to="/">
                  Jobs
                </Link>
              <Link className="nav-bar-links" to="/job-report">
                Master Sub List
              </Link>
              <HamburgerMenu routes={routes} />
              </div>
            </>
          ) : (
            <>
              <Link
                className="nav-bar-links"
                to={`${API_BASE}/auth/google`}
                target="_self"
              >
                Login
              </Link>
            </>
          )}
        </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
