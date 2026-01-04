import React from "react";

import { ConstraintGroupsView } from "./ConstraintGroupView";

function ConstraintGroupsSettings() {

    return (
        <div className="container-fluid">
            <div className="mb-4">
                <ConstraintGroupsView />
            </div>
        </div>
    );
}

export { ConstraintGroupsSettings };