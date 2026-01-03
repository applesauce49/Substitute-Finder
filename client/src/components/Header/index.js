import React from "react";
import Branding from "./Branding";
import MaintenanceHeader from "./Maintenance";
import Navigation from "./Navigation";

const Header = ({ maintenance = false, me = {}, loggedIn = false }) => {
  return (
    <header className="bg-dark mb-4 flex-row align-center text-white">
      <div className="container flex-row justify-space-between-lg justify-center align-center main-logo">
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
