// Navigation.jsx
import React from "react";
import { Link } from "react-router-dom";
import HamburgerMenu from "../HamburgerMenu";
import Auth from "../../utils/auth";
import { URLS } from "../../config/urls";
import "./App.css";

// TODO: Re-implement if needed later
// const NavLinks = ({ routes }) => {
//   return (
//     <div className="right">
//       {routes.map((route) => {
//         // Link route
//         if (route.path) {
//           return (
//             <Link
//               key={route.label}
//               className="nav-bar-links"
//               to={route.path}
//             >
//               {route.label}
//             </Link>
//           );
//         }

//         // Action route (like Logout)
//         return (
//           <button
//             key={route.label}
//             className="nav-bar-links"
//             onClick={route.onClick}
//             style={{
//               background: "none",
//               border: "none",
//               padding: 0,
//               cursor: "pointer",
//             }}
//           >
//             {route.label}
//           </button>
//         );
//       })}
//     </div>
//   );
// };

const Navigation = ({ me, loggedIn }) => {
  const logout = () => Auth.logout();
  const isAdmin = me?.admin === true;

  const LOGIN_URL = URLS.googleAuth;

  const routes = React.useMemo(() => {
    if (!loggedIn) return [];

    const base = [
      { path: "/my-calendar", label: "Calendar" },
      { path: "/profile", label: "Profile" },
    ];

    if (isAdmin) {
      base.push({ path: "/admin", label: "Admin" });
    }

    base.push({ label: "Logout", onClick: logout });

    return base;
  }, [loggedIn, isAdmin]);

  return (
    <nav className="right nav-bar-links-container">
      {loggedIn ? (
        <>
          <Link className="nav-bar-links" to="/">
            Jobs
          </Link>

          <Link className="nav-bar-links" to="/job-report">
            Master Sub List
          </Link>

          <HamburgerMenu routes={routes} />
        </>
      ) : (
        <Link className="nav-bar-links" to={LOGIN_URL} target="_self">
          Login
        </Link>
      )}
    </nav>
  );
};

export default React.memo(Navigation);