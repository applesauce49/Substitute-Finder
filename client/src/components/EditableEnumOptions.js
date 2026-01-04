
// EditableEnumOptions.js
import React from "react";

export function EditableEnumOptions({ options, setOptions }) {
    console.log("Rendering EditableEnumOptions with options:", options);
    const [editingIndex, setEditingIndex] = React.useState(null);

    const handleAdd = () => {
        setOptions((prev) => [...prev, ""]);
        setEditingIndex(options.length); // immediately start editing
    };

    const handleUpdate = (index, value) => {
        setOptions((prev) =>
            prev.map((opt, i) => (i === index ? value : opt))
        );
    };

    const handleRemove = (index) => {
        setOptions((prev) => prev.filter((_, i) => i !== index));
        if (editingIndex === index) {
            setEditingIndex(null);
        }
    };

    return (
        <div className="mt-2">

            {/* Render each existing enum option */}
            {options.map((opt, index) => (
                <div
                    key={index}
                    className="d-inline-flex align-items-center me-2 mb-2"
                >
                    {editingIndex === index ? (
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            style={{ width: "140px" }}
                            value={opt}
                            autoFocus
                            onChange={(e) =>
                                handleUpdate(index, e.target.value)
                            }
                            onBlur={() => setEditingIndex(null)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") setEditingIndex(null);
                            }}
                        />
                    ) : (
                        <span
                            className="badge bg-primary"
                            style={{ cursor: "pointer", userSelect: "none" }}
                            onClick={() => setEditingIndex(index)}
                        >
                            {opt || <em>Empty</em>}
                            <span
                                className="ms-2"
                                style={{ cursor: "pointer" }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(index);
                                }}
                            >
                                ×
                            </span>
                        </span>
                    )}
                </div>
            ))}

            {/* Add-new badge */}
            <span
                className="badge bg-secondary"
                style={{ cursor: "pointer", userSelect: "none" }}
                onClick={handleAdd}
            >
                + Add Option
            </span>
        </div>
    );
}