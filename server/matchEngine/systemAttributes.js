/**
 * System Attributes Module
 * Handles system-defined attribute getters and calculations
 */

export const SYSTEM_ATTRIBUTE_GETTERS = {
    lastSubbedAt: (user) => {
        const mostRecent = (user?.assignedJobs || [])
            .map(a => a?.assignedAt ? new Date(a.assignedAt).getTime() : null)
            .filter(Boolean)
            .sort((a, b) => b - a)[0];
        return mostRecent ? new Date(mostRecent) : null;
    },
    
    assignedJobCount: (user) => Array.isArray(user?.assignedJobs) ? user.assignedJobs.length : 0,
    
    hasSubbedInLast7Days: (user) => {
        const last = SYSTEM_ATTRIBUTE_GETTERS.lastSubbedAt(user);
        if (!last) return false;
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        return Date.now() - last.getTime() <= SEVEN_DAYS;
    },
    
    totalMeetingsHosted: (user) => {
        // If the user already has the pre-calculated field, use it
        if (typeof user?.totalMeetingsHosted === 'number') {
            return user.totalMeetingsHosted;
        }
        // If not available, return 0 - we'll calculate it separately for dry runs
        return 0;
    },
};

/**
 * Resolve an attribute value from user data or meeting context
 * @param {string} fieldSource - Source of the field ("user" or "meeting")
 * @param {string} fieldKey - The attribute key to retrieve
 * @param {Object} user - The user object
 * @param {Object} meetingContext - The meeting context object
 * @returns {*} The resolved attribute value
 */
export function resolveAttributeValue(fieldSource, fieldKey, user, meetingContext) {
    if (fieldSource === "meeting") {
        return meetingContext?.[fieldKey];
    }

    if (SYSTEM_ATTRIBUTE_GETTERS[fieldKey]) {
        return SYSTEM_ATTRIBUTE_GETTERS[fieldKey](user);
    }

    return user?.attributes?.find(attr => attr.key === fieldKey)?.value;
}
