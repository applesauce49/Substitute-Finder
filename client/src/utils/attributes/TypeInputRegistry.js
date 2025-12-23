import React from "react";

export const TypeInputRegistry = {

    STRING: ({ value, setValue }) => (
        <input
            type="text"
            className="form-control"
            value={value ?? ""}
            onChange={e => setValue(e.target.value)}
        />
    ),

    NUMBER: ({ value, setValue }) => (
        <input
            type="number"
            className="form-control"
            value={value ?? ""}
            onChange={e => setValue(e.target.value)}
        />
    ),

    DATE: ({ value, setValue }) => (
        <input
            type="date"
            className="form-control"
            value={value ?? ""}
            onChange={e => setValue(e.target.value)}
        />
    ),

    TIME: ({ value, setValue }) => (
        <input
            type="time"
            className="form-control"
            value={value ?? ""}
            onChange={e => setValue(e.target.value)}
        />
    ),

    BOOLEAN: ({ value, setValue, mode = "user", id }) => {
        const checked = value === true || value === "true";

        if (mode === "user") {
            return (
                <div className="form-check form-switch m-0">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id={id}
                        role="switch"
                        checked={checked}
                        onChange={e => setValue(e.target.checked)}
                        style={{ cursor: "pointer" }}
                    />
                </div>
            );
        }

        // default admin/editor version:
        return (
            <select
                className="form-select"
                value={checked ? "true" : "false"}
                onChange={e => setValue(e.target.value === "true")}
            >
                <option value="true">True</option>
                <option value="false">False</option>
            </select>
        );
    },

    ENUM: ({ value, setValue, attribute }) => (
        <select
            className="form-select"
            value={value ?? ""}
            onChange={e => setValue(e.target.value || null)}
        >
            {/* Add placeholder / empty value */}
            <option value="">—</option>

            {attribute?.options?.map(opt => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </select>
    ),

    /* --- Multi-value inputs --- */

    MULTI_ENUM: ({ value = [], setValue, attribute }) => (
        <select
            multiple
            className="form-select"
            value={value}
            onChange={(e) =>
                setValue(Array.from(e.target.selectedOptions, o => o.value))
            }
        >
            {attribute?.options?.map(opt => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </select>
    ),

    MULTI_STRING: ({ value = [], setValue }) => (
        <input
            className="form-control"
            placeholder="comma separated"
            value={value.join(", ")}
            onChange={(e) =>
                setValue(
                    e.target.value
                        .split(",")
                        .map(v => v.trim())
                        .filter(Boolean)
                )
            }
        />
    ),

    RANGE_NUMBER: ({ value = ["", ""], setValue }) => {
        const [min, max] = value;
        return (
            <div className="d-flex gap-2">
                <input type="number" className="form-control"
                    value={min}
                    onChange={e => setValue([e.target.value, max])} />
                <input type="number" className="form-control"
                    value={max}
                    onChange={e => setValue([min, e.target.value])} />
            </div>
        );
    },

    RANGE_DATE: ({ value = ["", ""], setValue }) => {
        const [from, to] = value;
        return (
            <div className="d-flex gap-2">
                <input type="date" className="form-control"
                    value={from}
                    onChange={e => setValue([e.target.value, to])} />
                <input type="date" className="form-control"
                    value={to}
                    onChange={e => setValue([from, e.target.value])} />
            </div>
        );
    },

    RANGE_TIME: ({ value = ["", ""], setValue }) => {
        const [start, end] = value;
        return (
            <div className="d-flex gap-2">
                <input type="time" className="form-control"
                    value={start}
                    onChange={e => setValue([e.target.value, end])} />
                <input type="time" className="form-control"
                    value={end}
                    onChange={e => setValue([start, e.target.value])} />
            </div>
        );
    }
};