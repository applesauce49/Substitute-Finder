import React, { useMemo } from "react";
import ModalForm from "../../../../components/Modal/ModalForm";

/**
 * Expects:
 * - constraints: [{ _id, name, fieldKey, operator, value }]
 * - newRulesGroup: { name: string, constraintIds: string[] }
 */
export function ConstraintGroupCreator({
  title,
  onClose,
  onSubmit,
  constraints,
  newRulesGroup,
  setNewRulesGroup,
  mode = "create",
}) {
  const sortedConstraints = useMemo(() => {
    if (!constraints?.length) return [];
    return [...constraints].sort((a, b) => a.name.localeCompare(b.name));
  }, [constraints]);

  const handleToggleConstraint = (id) => {
    setNewRulesGroup((prev) => {
      const exists = prev.constraintIds.includes(id);
      const constraintIds = exists
        ? prev.constraintIds.filter((cid) => cid !== id)
        : [...prev.constraintIds, id];

      return {
        ...prev,
        constraintIds,
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <ModalForm
      title={title}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            {mode === "edit" ? "Save Changes" : "Save"}
          </button>
        </>
      }
    >
      <form className="mb-2" onSubmit={handleSubmit}>
        {/* NAME */}
        <div className="col-12 mt-2">
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            value={newRulesGroup.name ?? ""}
            onChange={(e) =>
              setNewRulesGroup((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            placeholder="Descriptive name for this group"
          />
        </div>

        {/* CONSTRAINT SELECTION */}
        <div className="col-12 mt-3">
          <label className="form-label">Constraints to include</label>
          {sortedConstraints.length === 0 ? (
            <div className="text-muted">No constraints available yet.</div>
          ) : (
            <div className="border rounded p-2" style={{ maxHeight: 260, overflowY: "auto" }}>
              {sortedConstraints.map((constraint) => (
                <div className="form-check" key={constraint._id}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`constraint-${constraint._id}`}
                    checked={newRulesGroup.constraintIds.includes(constraint._id)}
                    onChange={() => handleToggleConstraint(constraint._id)}
                  />
                  <label className="form-check-label" htmlFor={`constraint-${constraint._id}`}>
                    <strong>{constraint.name}</strong>{" "}
                    <span className="text-muted">
                      ({constraint.fieldKey} {(constraint.operator || "").toLowerCase()} {constraint.value})
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </ModalForm>
  );
}
