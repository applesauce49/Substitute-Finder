import React from "react";
import ModalForm from "../../../../components/Modal/ModalForm";
import { AttributeTypes } from "../../../../utils/attributes/AttributeTypes";
import { OperatorRegistry } from "../../../../utils/attributes/operatorRegistry";

export function ConstraintCreator({
    title,
    onClose,
    onSubmit,
    attributes,
    newConstraint,
    setNewConstraint,
    mode = "create",
}) {

    console.log (attributes);
    // Selected attribute and type
    const selectedAttr = attributes.find(a => a.key === newConstraint.fieldKey);
    const selectedType = selectedAttr?.type;

    const availableOperators = selectedAttr
        ? AttributeTypes[selectedType].operators
        : [];

    // Normalize per operator + type
    const normalizeValueForOperator = (opKey, attrType, attribute) => {
        const opDef = OperatorRegistry[opKey];
        if (!opDef) return "";

        const normFn = opDef.normalize?.[attrType];

        if (typeof normFn === "function") {
            return normFn(attribute);   // Pass attribute with enum options
        }

        if (opDef.inputCount === 2) return ["", ""];
        if (opDef.inputCount === "multi") return [];

        return "";
    };

    return (
        <ModalForm
            title={title}
            onClose={onClose}
            onSubmit={onSubmit}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" onClick={onSubmit}>
                        {mode === "edit" ? "Save Changes" : "Save"}
                    </button>
                </>
            }
        >
            <form className="mb-2" onSubmit={onSubmit}>
                {/* NAME */}
                <div className="col-12 mt-2">
                    <label className="form-label">Name</label>
                    <input
                        type="text"
                        className="form-control"
                        value={newConstraint.name}
                        onChange={(e) =>
                            setNewConstraint(prev => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                        placeholder="Descriptive name of rule"
                    />
                </div>

                <div className="row g-2">

                    {/* ATTRIBUTE SELECT */}
                    <div className="col-4 d-flex flex-column">
                        <label className="form-label">Attribute</label>

                        <select
                            className="form-select"
                            value={newConstraint.fieldKey}
                            onChange={(e) => {
                                const fieldKey = e.target.value;
                                const attr = attributes.find(a => a.key === fieldKey);
                                const attrType = attr?.type;

                                const defaultOp = attr
                                    ? AttributeTypes[attrType].operators[0]
                                    : "";

                                setNewConstraint(prev => ({
                                    ...prev,
                                    fieldKey,
                                    operator: defaultOp,
                                    value: normalizeValueForOperator(defaultOp, attrType, attr),
                                }));
                            }}
                        >
                            <option value="">Select attribute…</option>

                            {/* System attributes first */}
                            {attributes.some(a => a.source === "SYSTEM") && (
                                <optgroup label="System Attributes">
                                    {attributes
                                        .filter(a => a.source === "SYSTEM")
                                        .map(attr => (
                                            <option key={attr._id} value={attr.key}>
                                                {attr.label} ({attr.key}) ⚙️
                                            </option>
                                        ))
                                    }
                                </optgroup>
                            )}

                            {/* Custom user-defined attributes */}
                            {attributes.some(a => a.source === "CUSTOM") && (
                                <optgroup label="Custom Attributes">
                                    {attributes
                                        .filter(a => a.source === "CUSTOM")
                                        .map(attr => (
                                            <option key={attr._id} value={attr.key}>
                                                {attr.label} ({attr.key})
                                            </option>
                                        ))
                                    }
                                </optgroup>
                            )}

                        </select>
                    </div>

                    {/* OPERATOR SELECT */}
                    <div className="col-4 d-flex flex-column">
                        <label className="form-label">Operator</label>
                        <select
                            className="form-select"
                            value={newConstraint.operator}
                            onChange={(e) => {
                                const opKey = e.target.value;

                                setNewConstraint(prev => ({
                                    ...prev,
                                    operator: opKey,
                                    value: normalizeValueForOperator(opKey, selectedType, selectedAttr),
                                }));
                            }}
                            disabled={!selectedAttr}
                        >
                            {availableOperators.map(opKey => (
                                <option key={opKey} value={opKey}>
                                    {OperatorRegistry[opKey].label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* VALUE INPUT (DYNAMIC) */}
                    <div className="col-4 d-flex flex-column">
                        <label className="form-label">Value</label>

                        {newConstraint.operator && selectedType ? (() => {
                            const opDef = OperatorRegistry[newConstraint.operator];
                            const Comp = opDef?.renderInput?.[selectedType];

                            if (!Comp) {
                                return (
                                    <input
                                        className="form-control"
                                        disabled
                                        placeholder="No valid input for this type/operator"
                                    />
                                );
                            }

                            return (
                                <Comp
                                    value={newConstraint.value}
                                    setValue={(val) =>
                                        setNewConstraint(prev => ({
                                            ...prev,
                                            value: val,
                                        }))
                                    }
                                    mode={mode}
                                    attribute={selectedAttr}
                                />
                            );
                        })() : (
                            <input
                                className="form-control"
                                disabled
                                placeholder="Select an operator first"
                            />
                        )}
                    </div>

                </div>
            </form>
        </ModalForm>
    );
}
