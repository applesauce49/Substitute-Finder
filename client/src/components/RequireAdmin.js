import { Navigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";

export default function RequireAdmin({ children }) {
  // const user = Auth.getProfile();
  // if (!user?.data?.admin) {
  //   return <Navigate to="/" replace />;
  // }
  console.log( children );
  return children;
}
