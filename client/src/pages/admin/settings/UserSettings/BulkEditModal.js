import React, { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { UPDATE_USERS_IN_BULK } from "../../../../utils/graphql/users/mutations.js";
import { QUERY_USER_ATTRIBUTE_DEFINITIONS } from "../../../../utils/graphql/constraints/queries.js";
import { ModalForm } from "../../../../components/Modal/ModalForm.js";

export function BulkEditModal({ selectedUsers, onClose, onSuccess }) {
  const [bulkUpdate] = useMutation(UPDATE_USERS_IN_BULK);
  const { data: attributeData } = useQuery(QUERY_USER_ATTRIBUTE_DEFINITIONS);

  const [updateType, setUpdateType] = useState("admin"); // "admin", "addAttributes", "removeAttributes"
  const [adminValue, setAdminValue] = useState("");
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [removeKeys, setRemoveKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const availableAttributes = attributeData?.userAttributeDefinitions?.filter(attr => attr.userEditable) || [];

  const handleAddAttribute = () => {
    const newAttr = { key: "", value: "" };
    setSelectedAttributes([...selectedAttributes, newAttr]);
  };

  const handleAttributeChange = (index, field, value) => {
    const updated = [...selectedAttributes];
    updated[index][field] = value;
    setSelectedAttributes(updated);
  };

  const handleRemoveAttribute = (index) => {
    const updated = selectedAttributes.filter((_, i) => i !== index);
    setSelectedAttributes(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userIds = selectedUsers.map(user => user._id);
      const updates = {};

      if (updateType === "admin" && adminValue !== "") {
        updates.admin = adminValue === "true";
      }

      if (updateType === "addAttributes" && selectedAttributes.length > 0) {
        const validAttributes = selectedAttributes
          .filter(attr => attr.key && attr.value !== undefined && attr.value !== "")
          .map(attr => ({
            key: attr.key,
            value: attr.value
          }));
        
        if (validAttributes.length > 0) {
          updates.addAttributes = validAttributes;
        }
      }

      if (updateType === "removeAttributes" && removeKeys.length > 0) {
        updates.removeAttributeKeys = removeKeys;
      }

      if (Object.keys(updates).length === 0) {
        setError("No updates specified");
        return;
      }

      const result = await bulkUpdate({
        variables: { userIds, updates }
      });

      if (result.data?.updateUsersInBulk?.success) {
        onSuccess?.(result.data.updateUsersInBulk);
        onClose?.();
      } else {
        setError(result.data?.updateUsersInBulk?.message || "Update failed");
      }
    } catch (err) {
      console.error("Bulk update error:", err);
      setError(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalForm title={`Bulk Edit ${selectedUsers.length} Users`} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Update Type</label>
          <select 
            className="form-select" 
            value={updateType} 
            onChange={(e) => setUpdateType(e.target.value)}
          >
            <option value="admin">Admin Status</option>
            <option value="addAttributes">Add/Update Attributes</option>
            <option value="removeAttributes">Remove Attributes</option>
          </select>
        </div>

        {updateType === "admin" && (
          <div className="mb-3">
            <label className="form-label">Admin Status</label>
            <select 
              className="form-select" 
              value={adminValue} 
              onChange={(e) => setAdminValue(e.target.value)}
              required
            >
              <option value="">Select...</option>
              <option value="true">Make Admin</option>
              <option value="false">Remove Admin</option>
            </select>
          </div>
        )}

        {updateType === "addAttributes" && (
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label">Attributes to Add/Update</label>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-primary"
                onClick={handleAddAttribute}
              >
                Add Attribute
              </button>
            </div>
            
            {selectedAttributes.map((attr, index) => (
              <div key={index} className="row mb-2 align-items-center">
                <div className="col-4">
                  <select
                    className="form-select"
                    value={attr.key}
                    onChange={(e) => handleAttributeChange(index, "key", e.target.value)}
                    required
                  >
                    <option value="">Select attribute...</option>
                    {availableAttributes.map(attrDef => (
                      <option key={attrDef.key} value={attrDef.key}>
                        {attrDef.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Value"
                    value={attr.value}
                    onChange={(e) => handleAttributeChange(index, "value", e.target.value)}
                    required
                  />
                </div>
                <div className="col-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleRemoveAttribute(index)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            
            {selectedAttributes.length === 0 && (
              <p className="text-muted">No attributes selected. Click "Add Attribute" to start.</p>
            )}
          </div>
        )}

        {updateType === "removeAttributes" && (
          <div className="mb-3">
            <label className="form-label">Attributes to Remove</label>
            <div className="row">
              {availableAttributes.map(attrDef => (
                <div key={attrDef.key} className="col-md-6">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`remove-${attrDef.key}`}
                      checked={removeKeys.includes(attrDef.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRemoveKeys([...removeKeys, attrDef.key]);
                        } else {
                          setRemoveKeys(removeKeys.filter(key => key !== attrDef.key));
                        }
                      }}
                    />
                    <label className="form-check-label" htmlFor={`remove-${attrDef.key}`}>
                      {attrDef.label}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedUsers.length > 0 && (
          <div className="mb-3">
            <h6>Selected Users ({selectedUsers.length})</h6>
            <div className="selected-users-list">
              {selectedUsers.slice(0, 10).map(user => (
                <span key={user._id} className="badge bg-secondary me-1 mb-1">
                  {user.username || user.email}
                </span>
              ))}
              {selectedUsers.length > 10 && (
                <span className="text-muted">...and {selectedUsers.length - 10} more</span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Updating..." : `Update ${selectedUsers.length} Users`}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </ModalForm>
  );
}