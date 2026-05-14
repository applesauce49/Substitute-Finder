import React from "react";
import ModalForm from "../../../../components/Modal/ModalForm";
import { AttributeTypes } from "../../../../utils/attributes/AttributeTypes";
import { OperatorRegistry } from "../../../../utils/attributes/operatorRegistry";

const ICON_OPTIONS = [
    { value: "👥", label: "Group" },
    { value: "🧠", label: "Clinical" },
    { value: "🗣️", label: "Language" },
    { value: "📍", label: "Location" },
    { value: "🕒", label: "Time" },
    { value: "📅", label: "Schedule" },
    { value: "✅", label: "Required" },
    { value: "⚖️", label: "Balance" },
    { value: "🧩", label: "Specialty" },
    { value: "🎯", label: "Priority" },
    { value: "🏠", label: "Home" },
    { value: "💬", label: "Communication" },
];

const ICON_ALIASES = {
    woman: "👩",
    female: "♀️",
    man: "👨",
    male: "♂️",
    group: "👥",
    people: "👥",
    language: "🗣️",
    location: "📍",
    time: "🕒",
    schedule: "📅",
    required: "✅",
    priority: "🎯",
    balance: "⚖️",
    specialty: "🧩",
    home: "🏠",
    communication: "💬",
};

function normalizeIconInput(rawValue) {
    const value = (rawValue || "").trim();
    if (!value) return "";

    const aliasKey = value
        .toLowerCase()
        .replace(/^[:\[]+|[:\]]+$/g, "")
        .replace(/\s+/g, "")
        .replace(/_/g, "");

    return ICON_ALIASES[aliasKey] || value;
}

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

    const availableOperators = React.useMemo(() => {
        return selectedAttr
            ? AttributeTypes[selectedType].operators
            : [];
    }, [selectedAttr, selectedType]);

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

    // Ensure operator stays in sync with selected attribute/type
    React.useEffect(() => {
        if (!selectedAttr) return;

        const firstAllowed = availableOperators[0] || "";
        const current = newConstraint.operator;

        // If the current operator is missing or not allowed for this type, reset to the first allowed operator
        if (!current || !availableOperators.includes(current)) {
            setNewConstraint(prev => ({
                ...prev,
                operator: firstAllowed,
                value: normalizeValueForOperator(firstAllowed, selectedType, selectedAttr),
            }));
        }
    }, [selectedAttr, selectedType, availableOperators, newConstraint.operator, setNewConstraint]);

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

                <div className="col-12 mt-2">
                    <label className="form-label">Icon (optional)</label>
                    <div className="input-group mb-2">
                        <span className="input-group-text" title="Preview">
                            {newConstraint.icon || "∅"}
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            value={newConstraint.icon || ""}
                            onChange={(e) =>
                                setNewConstraint(prev => ({
                                    ...prev,
                                    icon: e.target.value,
                                }))
                            }
                            onBlur={(e) => {
                                const normalized = normalizeIconInput(e.target.value);
                                if (normalized !== (newConstraint.icon || "")) {
                                    setNewConstraint(prev => ({
                                        ...prev,
                                        icon: normalized,
                                    }));
                                }
                            }}
                            maxLength={8}
                            placeholder="Optional badge icon (e.g. woman -> 👩)"
                        />
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() =>
                                setNewConstraint(prev => ({
                                    ...prev,
                                    icon: "",
                                }))
                            }
                        >
                            Clear
                        </button>
                    </div>
                    <div className="d-flex flex-wrap gap-2 mb-1">
                        {ICON_OPTIONS.map((iconOption) => {
                            const isSelected = (newConstraint.icon || "") === iconOption.value;
                            return (
                                <button
                                    key={iconOption.value}
                                    type="button"
                                    className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-outline-secondary"}`}
                                    title={iconOption.label}
                                    aria-label={`Use ${iconOption.label} icon`}
                                    onClick={() =>
                                        setNewConstraint(prev => ({
                                            ...prev,
                                            icon: iconOption.value,
                                        }))
                                    }
                                >
                                    {iconOption.value}
                                </button>
                            );
                        })}
                    </div>
                    <div className="form-text">
                        Pick an icon or type your own. Common words auto-convert (example: woman -> 👩).
                    </div>
                </div>

                {/* REQUIRED TOGGLE */}
                <div className="col-12 mt-3">
                    <div className="form-check">
                        <input
                            id="requiredRule"
                            className="form-check-input"
                            type="checkbox"
                            checked={Boolean(newConstraint.required)}
                            onChange={(e) =>
                                setNewConstraint(prev => ({
                                    ...prev,
                                    required: e.target.checked,
                                }))
                            }
                        />
                        <label className="form-check-label" htmlFor="requiredRule">
                            Required rule
                        </label>
                    </div>
                    <div className="form-text">
                        Applicants must satisfy required rules to remain eligible.
                    </div>
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
                            {availableOperators
                                .filter(opKey => OperatorRegistry[opKey])
                                .map(opKey => (
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
