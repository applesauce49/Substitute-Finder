// AttributeTypes.js
// Central type registry for dynamic constraint UI + backend validation

/**
 * Shared helper for consistent camelCase conversion
 * Could be used elsewhere if needed.
 */
export function labelToKey(label) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/\s+/g, "");
}

/**
 * Registry of all Attribute Types.
 * Each entry defines:
 *  - operators: allowable constraint operators
 *  - renderInput: how to render the value input UI
 *  - parseValue: optional normalization/parsing hook
 *
 * renderInput receives:
 *  - value: current constraint value
 *  - setValue: updater function
 *  - attribute: full attribute definition object (needed for ENUM options)
 */

export const AttributeTypes = {
  STRING: {
    operators: ["EQUALS", "NOT_EQUALS", "CONTAINS", "NOT_CONTAINS"],
  },

  NUMBER: {
    operators: ["EQUALS", "NOT_EQUALS", "GT", "LT", "GTE", "LTE", "BETWEEN"],
  },

  BOOLEAN: {
    operators: ["EQUALS", "NOT_EQUALS"],
  },

  DATE: {
    operators: ["BEFORE", "AFTER", "BETWEEN"],
  },

  DURATION: {
    operators: ["EQUALS", "NOT_EQUALS", "GT", "LT", "GTE", "LTE", "BETWEEN"],
    parseValue: (value) => {
      // Convert minutes → seconds before saving
      const minutes = Number(value);
      return minutes * 60;
    }
  },

  ENUM: {
    operators: ["EQUALS", "NOT_EQUALS"],
  },
};