import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { LOGIN_USER } from "../utils/mutations";
import { useNavigate } from "react-router-dom";
import Auth from "../utils/auth";

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
      // Support both "#/login?token=..." and "#token=..." formats
      const afterHash = hash.startsWith("#") ? hash.slice(1) : hash;
      const queryPart = afterHash.includes("?") ? afterHash.split("?")[1] : afterHash;
      const params = new URLSearchParams(queryPart);
      token = params.get("token");
    } else if (search.includes("token=")) {
      const params = new URLSearchParams(search);
      token = params.get("token");
    }

    if (token) {
      Auth.login(token);   // 👈 stores under "id_token"
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
      Auth.login(data.login.token);   // same storage step
      navigate("/");
    } catch (e) {
      console.error(e);
    }

    setFormState({ email: "", password: "" });
  };
  return (
    <main className="flex-row justify-center mb-4">
      <div className="col-12 col-md-6">
        <div style={{ textAlign: "center", marginTop: "4rem" }}>
          <h2>Welcome to Substitute Finder</h2>
          <p>Please sign in:</p>
          <a
            href="http://127.0.0.1:3001/auth/google"
            style={{
              display: "inline-block",
              background: "#fff",
              border: "1px solid #ccc",
              padding: "8px 16px",
              borderRadius: "4px",
              textDecoration: "none",
              color: "#555",
            }}
          >
            <img
              src="/google-icon.svg"
              alt="Google logo"
              style={{ width: "20px", marginRight: "8px", verticalAlign: "middle" }}
            />
            Sign in with Google
          </a>
        </div>

        {/* If you want to keep email/password login uncomment this */}
        {/* <div className="card">
          <h4 className="card-header">Login</h4>
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
                Submit
              </button>
            </form>
            {error && <div>Login failed</div>}
          </div>
        </div> */}
      </div>
    </main>
  );
};

export default Login;
