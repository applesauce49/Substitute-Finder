import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_USERS } from "../../../../utils/graphql/users/queries.js";
import { AddUserForm, EditUserForm } from "./UserForms.js";
import { createColumnHelper } from "@tanstack/react-table";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { GenericReportTable } from "../../../../components/reporting/GenericReportTable/GenericReportTable.js";

export function UserSettings() {
  const { data, loading, error, refetch } = useQuery(GET_USERS);

  const [editingUser, setEditingUser] = useState(null);

  const users = React.useMemo(() => {
    return data?.users?.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.admin ? "Admin" : "Peer Parent",
      admin: user.admin,
    })) || [];
  }, [data]);

  const columnHelper = React.useMemo(() => createColumnHelper(), []);

  const columns = React.useMemo(() => [
    columnHelper.accessor("username", { header: "Name" }),
    columnHelper.accessor("email", { header: "Email" }),
    columnHelper.accessor("role", { header: "Role" }),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <button
            className="btn btn-primary me-2"
            onClick={() => handleEdit(user)}
          >
            Edit
          </button>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    }

  ], [columnHelper]);

  const handleEdit = (user) => {
    setEditingUser(user);
  };

  const [showForm, setShowForm] = React.useState(false);

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>Error loading users: {error.message}</p>;

  return (
    <div className="users-report">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Users</h2>
      </div>

      <GenericReportTable
        data={users}
        columns={columns}
        onRowClick={(user) => setEditingUser(user)}
        toolbarRight={

          <button className="btn btn-success" onClick={() => setShowForm((p) => !p)}>
            "Add User"
          </button>
        }
      />

      {showForm && (
        <AddUserForm
          onSuccess={() => {
            refetch();
            setShowForm(false);
          }}
          onClose={() => setShowForm(false)}
        />
      )}

      {editingUser && (
        <EditUserForm
          userData={editingUser}
          onSuccess={() => {
            refetch();
            setEditingUser(null);
          }}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}