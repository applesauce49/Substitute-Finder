/**
 * Constraints Module
 * Handles constraint evaluation, parsing, and comparison logic
 */

/**
 * Parse a list value from various input formats
 * @param {*} raw - Raw input value
 * @returns {Array} Parsed array of values
 */
export function parseListValue(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        } catch (_) { /* no-op */ }
        return raw
            .split(",")
            .map(v => v.trim())
            .filter(Boolean);
    }
    return [];
}

/**
 * Parse a range value (min, max) from various input formats
 * @param {*} raw - Raw input value
 * @returns {Array} Array with [min, max] values
 */
export function parseRangeValue(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        } catch (_) { /* no-op */ }
        const parts = raw.split(",").map(v => v.trim());
        if (parts.length >= 2) return [parts[0], parts[1]];
    }
    return [];
}

/**
 * Coerce a value to the specified type
 * @param {*} value - The value to coerce
 * @param {string} type - Target type (number, boolean, date, time, string)
 * @returns {*} Coerced value or null if invalid
 */
export function coerceValueByType(value, type) {
    if (value === undefined || value === null) return null;

    if (Array.isArray(value)) {
        return value
            .map(v => coerceValueByType(v, type))
            .filter(v => v !== null);
    }

    switch (type) {
        case "number": {
            const num = Number(value);
            return Number.isNaN(num) ? null : num;
        }
        case "boolean":
            return value === true || value === "true" || value === "1";
        case "date": {
            const d = new Date(value);
            return Number.isNaN(d.getTime()) ? null : d.getTime();
        }
        case "time": {
            if (typeof value !== "string") return null;
            const [hours, minutes] = value.split(":").map(Number);
            if (
                Number.isNaN(hours) ||
                Number.isNaN(minutes) ||
                hours < 0 ||
                hours > 23 ||
                minutes < 0 ||
                minutes > 59
            ) {
                return null;
            }
            return hours * 60 + minutes;
        }
        default:
            return String(value).toLowerCase();
    }
}

/**
 * Normalize constraint value based on operator and attribute type
 * @param {Object} constraint - The constraint object
 * @param {string} attrType - The attribute type
 * @returns {*} Normalized constraint value
 */
export function normalizeConstraintValue(constraint, attrType) {
    const operator = constraint?.operator || "";
    if (["in", "notIn"].includes(operator)) {
        return coerceValueByType(parseListValue(constraint.value), attrType);
    }
    if (operator === "between") {
        const [min, max] = parseRangeValue(constraint.value);
        return [coerceValueByType(min, attrType), coerceValueByType(max, attrType)];
    }
    return coerceValueByType(constraint?.value, attrType);
}

/**
 * Check equality between two values considering type
 * @param {*} a - First value
 * @param {*} b - Second value
 * @param {string} type - Value type
 * @returns {boolean} True if values are equal
 */
export function isEqual(a, b, type) {
    if (Array.isArray(a) || Array.isArray(b)) return false;
    if (type === "number" || type === "date" || type === "time") {
        return a === b;
    }
    return String(a).toLowerCase() === String(b).toLowerCase();
}

/**
 * Evaluate a constraint against a user value
 * @param {Object} constraint - The constraint object with operator and value
 * @param {*} userValue - The user's attribute value
 * @param {string} attrType - The attribute type
 * @returns {boolean} True if constraint is satisfied
 */
export function evaluateConstraint(constraint, userValue, attrType) {
    const operator = constraint?.operator || "";
    const targetValue = normalizeConstraintValue(constraint, attrType);

    const lhs = coerceValueByType(userValue, attrType);

    if (lhs === null || lhs === undefined) return false;

    switch (operator) {
        case "equals":
            return isEqual(lhs, targetValue, attrType);
        case "notEquals":
            return !isEqual(lhs, targetValue, attrType);
        case "gt":
            return lhs > targetValue;
        case "lt":
            return lhs < targetValue;
        case "gte":
            return lhs >= targetValue;
        case "lte":
            return lhs <= targetValue;
        case "contains":
            return String(lhs).toLowerCase().includes(String(targetValue ?? "").toLowerCase());
        case "notContains":
            return !String(lhs).toLowerCase().includes(String(targetValue ?? "").toLowerCase());
        case "in": {
            const list = Array.isArray(targetValue) ? targetValue : [targetValue];
            return list.some(v => isEqual(lhs, v, attrType));
        }
        case "notIn": {
            const list = Array.isArray(targetValue) ? targetValue : [targetValue];
            return !list.some(v => isEqual(lhs, v, attrType));
        }
        case "between": {
            const [min, max] = targetValue || [];
            if (min === null || max === null) return false;
            return lhs >= min && lhs <= max;
        }
        default:
            return false;
    }
}
