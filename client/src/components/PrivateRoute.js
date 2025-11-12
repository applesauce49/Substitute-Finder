import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Auth from "../utils/auth";

const PrivateRoute = () => {
  const location = useLocation();
  const loggedIn = Auth.loggedIn();

  console.log("[PrivateRoute] loggedIn:", loggedIn);

  if (!loggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;