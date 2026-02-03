import React, { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { GET_USERS } from "../../../../utils/graphql/users/queries.js";
import { AddUserForm, EditUserForm } from "./UserForms.js";
import ImportUsersCSV from "./ImportUsersCSV.js";
import { BulkEditModal } from "./BulkEditModal.js";
import { createColumnHelper } from "@tanstack/react-table";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { GenericReportTable } from "../../../../components/reporting/GenericReportTable/GenericReportTable.js";
import { ADD_USER } from "../../../../utils/graphql/users/mutations.js";

export function UserSettings() {
  const { data, loading, error, refetch } = useQuery(GET_USERS);
  const [importUsers] = useMutation(ADD_USER);

  const [editingUser, setEditingUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  const users = React.useMemo(() => {
    return data?.users?.map((user) => ({
      ...user,
      role: user.admin ? "Admin" : "Peer Parent",
    })) ?? [];
  }, [data]);

  const columnHelper = React.useMemo(() => createColumnHelper(), []);

  const handleUserSelect = React.useCallback((user, isSelected) => {
    if (isSelected) {
      setSelectedUsers(prev => [...prev, user]);
    } else {
      setSelectedUsers(prev => prev.filter(u => u._id !== user._id));
    }
  }, []);

  const handleSelectAll = React.useCallback(() => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers([...users]);
    }
  }, [selectedUsers.length, users]);

  const columns = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={selectedUsers.length === users.length && users.length > 0}
          onChange={handleSelectAll}
          className="form-check-input"
        />
      ),
      cell: ({ row }) => {
        const user = users[row.index];
        const isSelected = selectedUsers.some(u => u._id === user._id);
        return (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => handleUserSelect(user, e.target.checked)}
            className="form-check-input"
          />
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
      size: 40,
    },
    columnHelper.accessor("username", { header: "Name" }),
    columnHelper.accessor("email", { header: "Email" }),
    columnHelper.accessor("role", { header: "Role" }),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <button
            className="btn btn-primary me-2"
            onClick={() => handleEdit(users[row.index])}
          >
            Edit
          </button>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    }

  ], [columnHelper, users, selectedUsers, handleSelectAll, handleUserSelect]);

  const handleEdit = (user) => {
    setEditingUser(user);
  };

  const handleBulkEditSuccess = (result) => {
    setSelectedUsers([]);
    refetch();
    alert(`${result.message}`);
  };

  const [showForm, setShowForm] = React.useState(false);
  const [showImport, setShowImport] = React.useState(false);
  const [showCSVImport, setShowCSVImport] = React.useState(false);
  const [importText, setImportText] = React.useState("");
  const [importStatus, setImportStatus] = React.useState("");

  const handleImport = async () => {
    setImportStatus("");
    let parsed;
    try {
      parsed = JSON.parse(importText || "[]");
    } catch (err) {
      setImportStatus("Invalid JSON.");
      return;
    }

    const usersToImport = Array.isArray(parsed) ? parsed : [parsed];
    let success = 0;
    let failed = 0;
    const failures = [];

    for (const u of usersToImport) {
      const username = (u.username || "").trim();
      const email = (u.email || "").trim();

      if (!username || !email) {
        failed++;
        failures.push(email || username || "unknown");
        continue;
      }

      const attributes = Array.isArray(u.attributes)
        ? u.attributes
            .filter(a => a?.key)
            .map(a => ({ key: a.key, value: a.value }))
        : [];

      try {
        await importUsers({
          variables: {
            username,
            email,
            admin: Boolean(u.admin),
            phone: u.phone || "",
            about: u.about || "",
            attributes,
          }
        });
        success++;
      } catch (err) {
        console.error("Failed to import user", u.email || u.username, err);
        failed++;
        failures.push(email);
      }
    }

    const failureMsg = failed ? ` ${failed} failed${failures.length ? `: ${failures.join(", ")}` : ""}.` : "";
    setImportStatus(`Imported ${success} user(s).${failureMsg}`);
    await refetch();
  };

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
        toolbarRight={
          <div className="d-flex gap-2 align-items-center">
            {selectedUsers.length > 0 && (
              <>
                <span className="text-muted">
                  {selectedUsers.length} selected
                </span>
                <button 
                  className="btn btn-warning"
                  onClick={() => setShowBulkEdit(true)}
                >
                  Bulk Edit
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => setSelectedUsers([])}
                >
                  Clear Selection
                </button>
              </>
            )}
            <button className="btn btn-outline-secondary" onClick={() => setShowCSVImport(true)}>
              Import CSV
            </button>
            <button className="btn btn-outline-secondary" onClick={() => setShowImport(true)}>
              Import JSON
            </button>
            <button className="btn btn-success" onClick={() => setShowForm((p) => !p)}>
              Add User
            </button>
          </div>
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

      {showBulkEdit && selectedUsers.length > 0 && (
        <BulkEditModal
          selectedUsers={selectedUsers}
          onClose={() => setShowBulkEdit(false)}
          onSuccess={handleBulkEditSuccess}
        />
      )}

      {showCSVImport && (
        <ImportUsersCSV
          onClose={() => setShowCSVImport(false)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {showImport && (
        <div className="card mt-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Import Users (Mongo JSON)</h5>
              <button className="btn-close" onClick={() => setShowImport(false)} aria-label="Close" />
            </div>
            <p className="text-muted mb-2">
              Paste an array of user documents with keys: username, email, admin, phone, about, attributes.
            </p>
            <textarea
              className="form-control mb-2"
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='[{"username":"Jane","email":"jane@example.com","admin":false,"phone":"555","about":"Bio","attributes":[{"key":"city","value":"Seattle"}]}]'
            />
            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={handleImport}>
                Import
              </button>
              <button className="btn btn-secondary" onClick={() => setImportText("")}>
                Clear
              </button>
            </div>
            {importStatus && <div className="mt-2 text-muted">{importStatus}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
