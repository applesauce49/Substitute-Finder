import decode from "jwt-decode";
import { URLS } from "../config/urls";

class AuthService {
  getProfile() {
    const token = this.getToken();
    if (!token) return null;

    try {
      return decode(token);
    } catch (err) {
      console.error("Invalid token", err);
      return null;
    }
  }

  loggedIn() {
    // Checks if there is a saved token and it's still valid
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token); // handwaiving here
  }

  isTokenExpired(token) {
    try {
      const decoded = decode(token);
      if (decoded.exp < Date.now() / 1000) {
        return true;
      } else return false;
    } catch (err) {
      return false;
    }
  }

  getToken() {
    // Retrieves the user token from localStorage
    return localStorage.getItem("id_token");
  }

  shouldRefreshToken() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = decode(token);
      const now = Date.now() / 1000;
      // Refresh if expired or within 5 minutes of expiry
      return !decoded.exp || decoded.exp <= now + 300;
    } catch (err) {
      return false;
    }
  }

  async refreshToken() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${URLS.apiBase}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data?.token) {
        localStorage.setItem("id_token", data.token);
        return data.token;
      }

      return null;
    } catch (err) {
      console.error("Token refresh request failed", err);
      return null;
    }
  }

  login(idToken) {
    // Saves user token to localStorage
    localStorage.setItem("id_token", idToken);

    window.location.assign("/");
  }

  logout() {
    // Clear user token and profile data from localStorage
    // axios.defaults.headers.common["Authorization"] = null;
    localStorage.removeItem("id_token");
    // this will reload the page and reset the state of the application
    window.location.assign("/");
  }
}

const authService = new AuthService();
export default authService;
