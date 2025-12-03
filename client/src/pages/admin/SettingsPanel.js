import React from "react";
import  MeetingsSettings from "./settings/MeetingSettings";
import { UserSettings } from "./settings/UserSettings";
import  { ConstraintsSettings } from "./settings/constraintSettings";
import { AttributesSettings } from "./settings/attributeSettings";


// Placeholder pages (we’ll build them later)
function Dashboard() {
    return <div><h2>Dashboard</h2></div>;
}

function Settings() {
    return <div><h2>Settings</h2></div>;
}

export default function SettingsPanel({ section }) {
    switch (section) {
        case "dashboard":
            return <Dashboard />;
        case "users":
            return <UserSettings />;
        case "meetings":
            return <MeetingsSettings />;
        case "matchengine":
            return <ConstraintsSettings />;
        case "constraints.attributes":
            return <AttributesSettings />;
        case "constraints.rules":
            return <ConstraintsSettings />;
        case "constraints.groups":
            return <ConstraintsSettings />;

        case "settings":
            return <Settings />;
        default:
            return <div>Select a section from the sidebar.</div>;
    }
}