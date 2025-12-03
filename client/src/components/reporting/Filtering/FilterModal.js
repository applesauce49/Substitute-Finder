import React, { useState } from "react";
import "./FilterModal.css";

export function FilterModal({
    open,
    onClose,
    onApply,
    columns,
    getUniqueValues,
}) {
    const [filter, setFilter] = useState({
        id: "",
        operator: "equals",
        value: "",
    });

    const [uniqueOptions, setUniqueOptions] = useState([]);

    if (!open) return null;
    const isDateColumn = (() => {
        const col = columns.find(c => c.id === filter.id);
        return col?.columnDef?.meta?.type === "date";
    })();

    // When column changes: fetch unique values
    const handleColumnChange = (e) => {
        const columnId = e.target.value;

        setFilter((prev) => ({
            ...prev,
            id: columnId,
            value: "", // reset value
        }));

        if (columnId) {
            const options = getUniqueValues(columnId);
            setUniqueOptions(options);
        } else {
            setUniqueOptions([]);
        }
    };

    const handleOperatorChange = (e) => {
        const operator = e.target.value;

        setFilter((prev) => ({
            ...prev,
            operator,
        }));
    };

    const handleValueChange = (e) => {
        const value = e.target.value;

        setFilter((prev) => ({
            ...prev,
            value,
        }));
    };

    const handleApplyClick = () => {
        onApply(filter);
        onClose();
    };

    return (
        <div className="filter-modal-backdrop">
            <div className="filter-modal">
                <h3>Apply Filter</h3>

                {/* Column Select */}
                <label className="form-label mt-2">Column</label>
                <select
                    className="form-select"
                    value={filter.id}
                    onChange={handleColumnChange}
                >
                    <option value="">-- Select a column --</option>
                    {columns
                        .filter((c) => !c.columnDef?.disableFilters)
                        .map((col) => (
                            <option key={col.id} value={col.id}>
                                {col.columnDef.header}
                            </option>
                        ))}
                </select>

                {/* Operator */}
                <label className="form-label mt-3">Operator</label>
                <select
                    className="form-select"
                    value={filter.operator}
                    onChange={handleOperatorChange}
                >
                    {isDateColumn ? (
                        <>
                            <option value="equals">Equals</option>
                            <option value="before">Before</option>
                            <option value="after">After</option>
                            <option value="between">Between</option>
                        </>
                    ) : (
                        <>
                            {/* <option value="equals">Equals</option> */}
                            <option value="contains" defaultValue>Contains</option>
                        </>
                    )}
                </select>

                <label className="form-label mt-3">Value</label>

                {isDateColumn ? (
                    filter.operator === "between" ? (
                        // BETWEEN → Two date inputs
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input
                                type="date"
                                className="form-control"
                                value={filter.value?.start || ""}
                                onChange={(e) =>
                                    setFilter((prev) => ({
                                        ...prev,
                                        value: { ...prev.value, start: e.target.value }
                                    }))
                                }
                            />

                            <input
                                type="date"
                                className="form-control"
                                value={filter.value?.end || ""}
                                onChange={(e) =>
                                    setFilter((prev) => ({
                                        ...prev,
                                        value: { ...prev.value, end: e.target.value }
                                    }))
                                }
                            />
                        </div>
                    ) : (
                        // NOT BETWEEN → One date input
                        <input
                            type="date"
                            className="form-control"
                            value={filter.value || ""}
                            onChange={(e) =>
                                setFilter((prev) => ({
                                    ...prev,
                                    value: e.target.value
                                }))
                            }
                        />
                    )
                ) : (
                    // NON-DATE COLUMN
                    uniqueOptions.length > 0 ? (
                        <select
                            className="form-select"
                            value={filter.value}
                            onChange={handleValueChange}
                        >
                            <option value="">-- Select value --</option>
                            {uniqueOptions.map((v) => (
                                <option key={v} value={v}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            className="form-control"
                            value={filter.value}
                            onChange={handleValueChange}
                        />
                    )
                )}
                {/* Footer buttons */}
                <div className="filter-modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleApplyClick}
                        disabled={!filter.id || !filter.value}
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}