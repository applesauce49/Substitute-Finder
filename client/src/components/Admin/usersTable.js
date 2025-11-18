import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_USERS } from "./../../utils/queries";
import { AddUserForm, EditUserForm } from "./UserForms.js";
import {
  useReactTable,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import 'bootstrap-icons/font/bootstrap-icons.css';
import FilterPill from "../FilterPill/index.js";
import '../../css/google-toolbar.css';

export default function UsersReport() {
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
  ], [columnHelper]);

  const handleEdit = (user) => {
    setEditingUser(user);
  };


  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const [showForm, setShowForm] = React.useState(false);

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>Error loading users: {error.message}</p>;

  return (
    <div className="users-report">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Users</h2>
        <button className="btn btn-success" onClick={() => setShowForm((p) => !p)}>
          {showForm ? "Close" : "Add User"}
        </button>
      </div>

      {showForm && (
        <AddUserForm
          onSuccess={() => {
            refetch();
            setShowForm(false);
          }}
          onClose={() => setShowForm(false)}
        />
      )}
      <div className="google-toolbar">
        <FilterPill onClick={() => alert("Filter functionality to be implemented")} />
      </div>

      <table className="table table-striped">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {header.column.getIsSorted() === "asc" && (
                    <i className="bi bi-caret-up-fill ms-2"></i>
                  )}

                  {header.column.getIsSorted() === "desc" && (
                    <i className="bi bi-caret-down-fill ms-2"></i>
                  )}

                  {!header.column.getIsSorted() &&
                    header.column.getCanSort() && (
                      <i className="bi bi-caret-expand ms-2 text-muted"></i>
                    )}
                </th>
              ))}
              <th>Actions</th>
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const user = row.original;

            return (
              <tr key={user._id} style={{ verticalAlign: "middle" }}>
                {/* Render table cells normally */}
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}

                {/* Action buttons */}
                <td>
                  <button
                    className="btn btn-primary me-2"
                    onClick={() => handleEdit(user)}  // opens modal
                  >
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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