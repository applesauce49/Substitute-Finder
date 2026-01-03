import React from "react";
import { useQuery } from "@apollo/client";
import { QUERY_USER_ATTRIBUTE_DEFINITIONS } from "../../utils/graphql/constraints/queries.js";
import { UserAttributeField } from "./UserAttributeField";

/**
 * Generic dynamic user attribute editor.
 *
 * Props:
 * - initialValues: object map of { key: value } for existing attributes
 * - onChange: function(map) called when any value changes
 * - onlyEditable: if true, filters to userEditable attributes (default: true)
 * - title: optional heading text
 */
export function UserAttributeEditor({
  initialValues = {},
  onChange,
  onlyEditable = true,
  title = "Additional Attributes",
}) {
  const { data: attrDefData, loading, error } = useQuery(QUERY_USER_ATTRIBUTE_DEFINITIONS);

  const filteredAttributes = React.useMemo(() => {
    const attributeDefs = attrDefData?.userAttributeDefinitions ?? [];
    return onlyEditable ? attributeDefs.filter(def => def.userEditable) : attributeDefs;
  }, [attrDefData, onlyEditable]);

  const [values, setValues] = React.useState(initialValues);

  React.useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleValueChange = (key, value) => {
    setValues(prev => {
      const next = { ...prev, [key]: value };
      onChange?.(next);
      return next;
    });
  };

  if (loading) {
    return <div>Loading attributes…</div>;
  }

  if (error) {
    return <div className="text-danger">Failed to load attributes.</div>;
  }

  if (!filteredAttributes.length) {
    return <p className="text-muted">No additional user attributes to edit.</p>;
  }

  return (
    <div className="mb-3">
      {title && <h5>{title}</h5>}
      {filteredAttributes.map(def => (
        <UserAttributeField
          key={def.key}
          attributeDef={def}
          value={values[def.key]}
          setValue={v => handleValueChange(def.key, v)}
        />
      ))}
    </div>
  );
}
