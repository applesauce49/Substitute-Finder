import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Auth from "../utils/auth";
import GoogleButton from "../components/GoogleButton/GoogleButton.js";

const Login = () => {
  const navigate = useNavigate();

  // ✅ Handle token returned from Google OAuth
  useEffect(() => {
    const hash = window.location.hash || "";
    const search = window.location.search || "";

    let token = null;
    if (hash.includes("token=")) {
      const afterHash = hash.startsWith("#") ? hash.slice(1) : hash;
      const queryPart = afterHash.includes("?")
        ? afterHash.split("?")[1]
        : afterHash;
      const params = new URLSearchParams(queryPart);
      token = params.get("token");
    } else if (search.includes("token=")) {
      const params = new URLSearchParams(search);
      token = params.get("token");
    }

    if (token) {
      Auth.login(token);
      navigate("/");
    }
  }, [navigate]);

  const API_BASE = process.env.REACT_APP_API_URL

  return (
    <main className="flex-row justify-center mb-4">
      <div className="col-12 col-md-6">
        <div style={{ textAlign: "center", marginTop: "4rem" }}>
          <h2>Welcome to Substitute Finder</h2>
          <p>Please sign in:</p>
          <GoogleButton onClick={() => window.location.href = `${API_BASE}/auth/google`} />
        </div>
      </div>
    </main>
  );
};

export default Login;