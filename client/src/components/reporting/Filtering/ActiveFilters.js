import React from 'react';
import "./activeFilters.css";

export function ActiveFilters({ filters, columns, onRemove }) {
    if (!filters.length) return null;

    const getLabel = (id) => {
        const col = columns.find(c => c.id === id);
        return col ? (col.columnDef.header ?? id) : id;
    };

    const formatValue = (filter) => {
        const v = filter.value;

        // Simple string filter
        if (typeof v === "string") {
            return v;
        }

        // Date filter functions live inside v.fn
        const fn = v.fn;
        const val = v.value;

        const fmt = (d) =>
            new Date(d).toLocaleDateString([], {
                year: "numeric",
                month: "short",
                day: "numeric",
            });

        if (fn === "equalsDate") {
            return fmt(val);
        }

        if (fn === "beforeDate") {
            return `Before ${fmt(val)}`;
        }

        if (fn === "afterDate") {
            return `After ${fmt(val)}`;
        }

        if (fn === "betweenDate") {
            return `${fmt(val.start)} → ${fmt(val.end)}`;
        }

        return JSON.stringify(v); // fallback
    };

    return (
        <>
            {filters.map((f) => (
                <div key={f.id} className="active-filter-chip">
                    <span className="chip-label">
                        {getLabel(f.id)}: <strong>{formatValue(f)}</strong>
                    </span>
                    <button
                        type="button"
                        className="chip-remove-btn"
                        onClick={() => onRemove(f.id)}
                    >x</button>
                </div>
            ))}
        </>
    );
}