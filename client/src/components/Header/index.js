import React from "react";
import Branding from "./Branding";
import MaintenanceHeader from "./Maintenance";
import Navigation from "./Navigation";

const Header = ({ maintenance = false, me = {}, loggedIn = false }) => {
  return (
    <header className="navbar navbar-expand-lg theme-header-navigation-container mb-4">
      <div className="container d-flex justify-content-between align-items-center">
        <Branding />

        { maintenance ? (
          <MaintenanceHeader />
        ) : (
          <Navigation me={me} loggedIn={loggedIn} />
        )}

      </div>
    </header>
  );
};

export default Header;
