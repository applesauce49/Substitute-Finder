import React from "react";
import { SettingsRow } from "../settings/SettingsRow";
import { TypeInputRegistry } from "../../utils/attributes/TypeInputRegistry";

export function UserAttributeField({ attributeDef, value, setValue }) {
  const { type } = attributeDef;
  const Input = TypeInputRegistry[type];
  const inputId = `attr-${attributeDef.key}`;

  return (
    <SettingsRow
      label={attributeDef.label}
      description={attributeDef.description}
    >
      <Input
        id={inputId}
        value={value}
        setValue={setValue}
        attribute={attributeDef}
        mode="user"
      />
    </SettingsRow>
  );
}