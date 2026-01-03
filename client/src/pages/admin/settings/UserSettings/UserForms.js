import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { ADD_USER, UPDATE_USER } from "../../../../utils/graphql/users/mutations";
import { ModalForm } from "../../../../components/Modal/ModalForm";
import { UserAttributeEditor } from "../../../../components/user/UserAttributeEditor";

function UserForm({
  mutation,
  initialData = { _id: "", username: "", email: "", admin: false, attributes: [] },
  onSuccess,
  onClose,
  buttonLabel = "Submit",
}) {
  // BASIC USER FIELDS
  const [formData, setFormData] = useState({
    username: initialData.username ?? "",
    email: initialData.email ?? "",
    admin: initialData.admin ?? false,
  });

  // HYDRATE EXISTING ATTRIBUTE VALUES
  const [values, setValues] = useState(() => {
    const map = {};
    initialData.attributes?.forEach(attr => {
      map[attr.key] = attr.value;
    });
    return map;
  });

  // UNIFIED MUTATION
  const [mutateUser, { loading, error }] = useMutation(mutation, {
    onCompleted: () => {
      onSuccess?.();
      onClose?.();
    }
  });

  // UPDATE BASIC FIELDS
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // MAIN SUBMIT HANDLER
  const handleSubmit = async e => {
    e.preventDefault();

    console.log("Submitting form with data:", { initialData, formData, values });
    try {
      const attributePayload = Object.keys(values).map(key => ({
        key,
        value: values[key],
      }));

      console.log("Attribute Payload:", attributePayload);

      await mutateUser({
        variables: {
          _id: initialData._id,
          ...formData,
          attributes: attributePayload,
        }
      });

    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded bg-light">

      {/* BASIC FIELDS */}
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

      {/* DYNAMIC USER ATTRIBUTES */}
      <UserAttributeEditor
        initialValues={values}
        onChange={setValues}
        onlyEditable
      />

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Saving..." : buttonLabel}
      </button>

      {error && <div className="text-danger mt-2">{error.message}</div>}
    </form>
  );
}


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
  console.log("EditUserForm received userData:", userData);
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
