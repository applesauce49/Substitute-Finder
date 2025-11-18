import React from 'react';
import './filterpill.css';

export default function FilterPill({ onClick }) {
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