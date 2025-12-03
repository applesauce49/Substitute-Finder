import React from "react";
import { TypeInputRegistry } from "../../utils/attributes/TypeInputRegistry";

export function UserAttributeField({ attributeDef, value, setValue }) {
    const { type } = attributeDef;

    // Pick the correct input component
    const Input = TypeInputRegistry[type];

    if (!Input) {
        return (
            <input
                className="form-control"
                disabled
                placeholder={`No renderer for type ${type}`}
            />
        );
    }

    return (
        <div className="mb-3">
            <label className="form-label">{attributeDef.label}</label>

            <Input
                value={value}
                setValue={setValue}
                attribute={attributeDef} // needed for ENUM
            />

            {attributeDef.description && (
                <div className="form-text">{attributeDef.description}</div>
            )}
        </div>
    );
}