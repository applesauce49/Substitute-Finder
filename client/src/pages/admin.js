import React from "react";
import UsersTable from "../components/Admin/usersTable";

export default function AdminPage() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome to the admin area. Add stats, controls, or logs here.</p>
      {/* Add your admin components here */}
      <div style={{ padding: "2rem" }}>
        <UsersTable attributes={["name", "email", "role"]} />
      </div>
    </div>

  );
}