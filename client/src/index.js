import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import Root from "./root";   // <-- import the new wrapper
import reportWebVitals from "./reportWebVitals";

// Create a root with the new API
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

// Performance logging (optional)
reportWebVitals();