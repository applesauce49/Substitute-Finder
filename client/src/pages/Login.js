import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { LOGIN_USER } from "../utils/mutations";
import { useNavigate } from "react-router-dom";
import Auth from "../utils/auth";
import GoogleButton from "../components/GoogleButton/GoogleButton.js";

const Login = () => {
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [login, { error }] = useMutation(LOGIN_USER);
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

  // Update form state
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState({
      ...formState,
      [name]: value,
    });
  };

  // Handle form submit (email/password login)
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await login({
        variables: { ...formState },
      });
      Auth.login(data.login.token); // same storage step as Google
      navigate("/");
    } catch (e) {
      console.error(e);
    }

    setFormState({ email: "", password: "" });
  };

  const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:3001"

  return (
    <main className="flex-row justify-center mb-4">
      <div className="col-12 col-md-6">
        <div style={{ textAlign: "center", marginTop: "4rem" }}>
          <h2>Welcome to Substitute Finder</h2>
          <p>Please sign in:</p>
          <GoogleButton onClick={() => window.location.href = `${API_BASE}/auth/google`} />
        </div>

        {/* Local email/password login */}
        <div className="card">
          <h4 className="card-header">Login with Email</h4>
          <div className="card-body">
            <form className="login-form" onSubmit={handleFormSubmit}>
              <input
                className="form-input"
                placeholder="Your email"
                name="email"
                type="email"
                id="email"
                value={formState.email}
                onChange={handleChange}
              />
              <input
                className="form-input"
                placeholder="******"
                name="password"
                type="password"
                id="password"
                value={formState.password}
                onChange={handleChange}
              />
              <button
                className="btn d-block w-100 no-border-btn btn-primary"
                type="submit"
              >
                Login
              </button>
            </form>
            {error && <div>Login failed</div>}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;