import React from 'react';
import "bootstrap-icons/font/bootstrap-icons.css";

const NAV_ITEMS = [
    // { id: 'dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
    { id: 'metrics', icon: 'bi-graph-up', label: 'Metrics' },
    { id: 'users', icon: 'bi-people', label: 'Users' },
    // { id: "jobs", icon: "bi-briefcase", label: "Jobs" },
    { id: "meetings", icon: "bi-calendar-event", label: "Meetings" },
    {
        id: 'matchengine',
        icon: "bi-fire",
        label: "Match Engine",
        children: [
            { id: 'constraints.attributes', label: 'Attributes' },
            { id: 'constraints.rules', label: 'Rules' },
            { id: 'constraints.groups', label: 'Groups' },
            { id: 'constraints.dryrun', label: 'Dry Run' },
        ]
    },
    { id: 'settings', icon: 'bi-gear', label: 'Settings' },
]

export default function Sidebar({
    collapsed,
    setCollapsed,
    activeSection,
    setActiveSection,
}) {
    const [openItems, setOpenItems] = React.useState({});

    const toggleOpen = (id) => {
        setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div
            className="admin-sidebar d-flex flex-column flex-shrink-0 p-3 bg-body-tertiary border-end"
            style={{
                width: collapsed ? "80px" : "240px",
                transition: "width 0.25s ease",
            }}
        >
            {/* Collapse/Expand Button */}
            <button
                className="btn btn-light mb-3 align-self-end"
                onClick={() => setCollapsed(!collapsed)}
                style={{
                    width: "36px",
                    height: "36px",
                    padding: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <i className={`bi ${collapsed ? "bi-chevron-right" : "bi-chevron-left"}`} />
            </button>

            {/* Header */}
            {!collapsed && (
                <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-gear-fill fs-3 me-2"></i>
                    <span className="fs-5 fw-semibold">Admin</span>
                </div>
            )}

            {/* Navigation */}
            <ul className="nav nav-pills flex-column mb-auto">

                {NAV_ITEMS.map((item) => {
                    const isActive = activeSection === item.id;

                    const hasChildren = Array.isArray(item.children);

                    const isOpen = openItems[item.id];

                    return (
                        <li className="nav-item mb-1" key={item.id}>
                            <div
                                className={`nav-link d-flex align-items-center gap-2 ${
                                    isActive ? "active" : "link-dark"
                                }`}
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                    if (hasChildren) {
                                        toggleOpen(item.id);
                                    } else {
                                        setActiveSection(item.id);
                                    }
                                }}
                            >
                                <i className={`bi ${item.icon} fs-5`} />

                                {!collapsed && (
                                    <>
                                        <span>{item.label}</span>

                                        {hasChildren && (
                                            <i
                                                className={`bi ms-auto ${
                                                    isOpen ? "bi-chevron-down" : "bi-chevron-right"
                                                }`}
                                            />
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Render children */}
                            {!collapsed && hasChildren && isOpen && (
                                <ul className="nav flex-column ms-4 mt-1">
                                    {item.children.map((child) => (
                                        <li className="nav-item" key={child.id}>
                                            <div
                                                className={`nav-link ${
                                                    activeSection === child.id
                                                        ? "active"
                                                        : "link-dark"
                                                }`}
                                                style={{ cursor: "pointer" }}
                                                onClick={() => setActiveSection(child.id)}
                                            >
                                                {child.label}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    );
                })}

            </ul>
        </div>
    );
}
