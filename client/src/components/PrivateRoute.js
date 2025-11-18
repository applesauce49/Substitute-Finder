import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const PrivateRoute = ( { loggedIn } ) => {
  const location = useLocation();

  console.log("[PrivateRoute] loggedIn:", loggedIn);

  if (!loggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;