import React from 'react';
import Sidebar from './Sidebar';
import SettingsPanel from './SettingsPanel';

export default function AdminLayout({ children }) {
    const [collapsed, setCollapsed] = React.useState(false);
    const [activeSection, setActiveSection] = React.useState('dashboard');
    return (
        <div className="d-flex flex-nowrap" >
            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
            />
            <main className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>
                <SettingsPanel section={activeSection} />
            </main>
        </div>
    )
}