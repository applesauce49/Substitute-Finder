import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_USERS } from "./../../utils/queries";
import {
  useReactTable,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function UsersReport() {
  const { data, loading, error } = useQuery(GET_USERS);
  // const [updateUser] = useMutation(UPDATE_USER);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);

  const users = React.useMemo(() => {
    return data?.users?.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role || "user",
      active: user.active || false,
    })) || [];
  }, [data]);

  const columnHelper = React.useMemo(() => createColumnHelper(), []);

  const columns = React.useMemo(() => [
    columnHelper.accessor("username", { header: "Name" }),
    columnHelper.accessor("email", { header: "Email" }),
    columnHelper.accessor("role", { header: "Role" }),
    columnHelper.accessor("active", {
      header: "Active",
      cell: info => (info.getValue() ? "Active" : "Inactive"),
    }),
  ], [columnHelper]);

  // const [sorting, setSorting] = React.useState([]);

  const handleEdit = (user) => {
    setSelected(user._id);
    setForm({ ...user });
  };

  const handleSave = async () => {
    // await updateUser({ variables: form });
    setSelected(null);
  };

  const table = useReactTable({
    data: users,
    columns,
    // onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>Error loading users: {error.message}</p>;

  return (
    <div className="users-report">
      <h2>Users Report</h2>
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
    const isEditing = selected === user._id;

    return (
      <tr key={user._id} style={{ verticalAlign: "middle" }}>
        {isEditing ? (
          <>
            <td>
              <input
                className="form-control"
                value={form.username}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, username: e.target.value }))
                }
              />
            </td>
            <td>
              <input
                className="form-control"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </td>
            <td>
              <select
                className="form-select"
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, role: e.target.value }))
                }
              >
                <option value="admin">Admin</option>
                <option value="host">Peer Parent</option>
              </select>
            </td>
            <td>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, active: e.target.checked }))
                }
              />
            </td>
            <td>
              <button className="btn btn-primary me-2" onClick={handleSave}>
                Save
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>
            </td>
          </>
        ) : (
          <>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
            <td>
              <button
                className="btn btn-primary"
                onClick={() => handleEdit(user)}
              >
                Edit
              </button>
            </td>
          </>
        )}
      </tr>
    );
  })}
</tbody>
      </table>
    </div>
  );
}