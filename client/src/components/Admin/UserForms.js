import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { ModalForm } from "../Modal/ModalForm.js";
import { ADD_USER, UPDATE_USER } from "../../utils/mutations.js";

function UserForm({
  mutation,
  initialData = {_id: "", username: "", email: "", admin: false },
  onSuccess,
  onClose,
  buttonLabel = "Submit",
}) {
  const [formData, setFormData] = useState(initialData);

  console.log("UserForm initialData:", initialData);

  const [mutate, { loading, error }] = useMutation(mutation, {
    onCompleted: () => {
      onSuccess?.();
      onClose?.();
    },
  })
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await mutate({ variables: { ...formData } });
    }
    catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded bg-light">
      <div className="mb-2">
        <label className="form-label">Name</label>
        <input
          className="form-control"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-2">
        <label className="form-label">Email</label>
        <input
          className="form-control"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-check mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          name="admin"
          checked={formData.admin}
          onChange={handleChange}
        />
        <label className="form-check-label">Admin?</label>
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Saving..." : buttonLabel}
      </button>
      {error && <div className="text-danger mt-2">{error.message}</div>}
    </form>
  );
};

function AddUserForm({ onSuccess, onClose }) {
  return (
    <ModalForm
      title="Add User"
      onClose={onClose}
    >
      <UserForm
        mutation={ADD_USER}
        onSuccess={onSuccess}
        buttonLabel="Add User"
      />
    </ModalForm>
  );
}

function EditUserForm({ userData, onSuccess, onClose }) {
  return (
    <ModalForm
      title="Edit User"
      onClose={onClose}
    >
      <UserForm
        mutation={UPDATE_USER}
        initialData={{ ...userData }}
        onSuccess={onSuccess}
        buttonLabel="Save Changes"
      />
    </ModalForm>
  );
}

export { AddUserForm, EditUserForm };