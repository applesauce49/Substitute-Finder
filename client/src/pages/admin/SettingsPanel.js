import React from "react";
import  MeetingsSettings from "./settings/MeetingSettings";
import { UserSettings } from "./settings/UserSettings";
import  { ConstraintsSettings } from "./settings/constraintSettings";
import { ConstraintGroupsSettings } from "./settings/ConstraintGroupSettings";
import { AttributesSettings } from "./settings/attributeSettings";
import { MatchEngineDryRun } from "./settings/MatchEngineDryRun";
import { MetricsPage } from "./settings/MetricsPage";
import { SystemSettings } from "./settings/SystemSettings";


// Placeholder pages (we’ll build them later)
function Dashboard() {
    return <div><h2>Dashboard</h2></div>;
}



export default function SettingsPanel({ section }) {
    switch (section) {
        case "dashboard":
            return <Dashboard />;
        case "metrics":
            return <MetricsPage />;
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
            return <ConstraintGroupsSettings />;
        case "constraints.dryrun":
            return <MatchEngineDryRun />;

        case "settings":
            return <SystemSettings />;
        default:
            return <div>Select a section from the sidebar.</div>;
    }
}
