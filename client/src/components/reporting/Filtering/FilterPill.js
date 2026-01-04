import React from 'react';
import './FilterPill.css';

export function FilterPill({ onClick }) {
    return (
        <button
            type="button"
            className="google-filter-pill"
            onClick={onClick}
        >
            <span className="google-filter-pill-icon">+</span>
            Add a filter
        </button>
    )
}