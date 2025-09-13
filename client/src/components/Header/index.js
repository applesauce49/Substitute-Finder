import React from "react";
import { Link } from "react-router-dom";

import Auth from "../../utils/auth";
import "bootstrap/dist/css/bootstrap.min.css";
// import { FaReact } from "react-icons/fa";
import { Animated } from "react-animated-css";

import logo from "./logo.svg";
import "./App.css";
import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../../utils/queries";

const Header = () => {
  const logout = (event) => {
    event.preventDefault();
    Auth.logout();
  };

  const { data } = useQuery(QUERY_ME, {
    skip: !Auth.loggedIn(),
  });

  const me = data?.me;
  const isAdmin = me?.admin === true;

  return (
    <header className="bg-dark mb-4 flex-row align-center text-white">
      <div className="container flex-row justify-space-between-lg justify-center align-center main-logo">
        <Link className="main-logo" to="/">
          <Animated
            animationIn="bounceInLeft"
            animationOut="fadeOut"
            isVisible={true}
          >
            {/* <h1 className='mb-1 mt-1 main-logo'>Sub At<span className='icon'><FaReact/></span>mic</h1> */}
            <h1 className="mb-1 mt-0 main-logo">
              Sub At
              <span>
                {" "}
                <img src={logo} className="App-logo" alt="logo" />
              </span>
              mic
            </h1>
            <p className="sub-title">An app for finding Substitute Peer Parents</p>
          </Animated>
        </Link>

        <nav className="text-center">
          {Auth.loggedIn() ? (
            <>
              <Link className="nav-bar-links" to="/">
                Jobs
              </Link>

              <Link className="nav-bar-links" to="/my-calendar">
                Calendar
              </Link>

              <Link className="nav-bar-links" to="/profile">
                Profile
              </Link>

              <a className="nav-bar-links" href="/" onClick={logout}>
                Logout
              </a>
            </>
          ) : (
            <>
              <a
                className="nav-bar-links" href="http://127.0.0.1:3001/auth/google"
              >
                Login
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
