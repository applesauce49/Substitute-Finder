/**
 * Data Loaders Module
 * Handles data fetching and resolution for the match engine
 */

import Meeting from "../models/Meeting.js";
import ConstraintGroup from "./Schemas/ConstraintGroup.js";
import Constraint from "./Schemas/Constraint.js";
import UserAttributeDefinition from "./Schemas/UserAttributeDefinition.js";
import { SYSTEM_ATTRIBUTES } from "../config/systemAttributes.js";

/**
 * Build a map of attribute definitions (system + custom)
 * @returns {Promise<Map>} Map of attribute key to definition
 */
export async function buildAttributeDefinitionMap() {
    const customDefs = await UserAttributeDefinition.find({}).lean();
    const allDefs = [
        ...SYSTEM_ATTRIBUTES.map(attr => ({
            ...attr,
            type: typeof attr.type === "string" ? attr.type.toLowerCase() : attr.type
        })),
        ...customDefs.map(def => ({
            ...def,
            type: typeof def.type === "string" ? def.type.toLowerCase() : def.type
        })),
    ];

    return new Map(allDefs.map(def => [def.key, def]));
}

/**
 * Get meeting and its constraints for a job
 * @param {Object} job - The job object
 * @returns {Promise<Object>} Object with meeting and constraints array
 */
export async function getMeetingConstraints(job) {
    const eventIds = [
        job?.meetingSnapshot?.gcalEventId,
        job?.meetingSnapshot?.gcalRecurringEventId,
        job?.meetingSnapshot?.eventId,
    ].filter(Boolean);

    if (!eventIds.length) {
        return { meeting: null, constraints: [] };
    }

    const meeting = await Meeting.findOne({
        $or: [
            { gcalEventId: { $in: eventIds } },
            { gcalRecurringEventId: { $in: eventIds } },
        ],
    }).lean();
    const groupIds = meeting?.constraintGroupIds || [];

    if (!groupIds.length) {
        return { meeting, constraints: [] };
    }

    const groups = await ConstraintGroup.find({ _id: { $in: groupIds } }).lean();
    const constraintIds = [...new Set(groups.flatMap(g => g.constraintIds || []))];

    if (!constraintIds.length) {
        return { meeting, constraints: [] };
    }

    const constraints = await Constraint.find({
        _id: { $in: constraintIds },
        active: { $ne: false },
    }).lean();

    return { meeting, constraints };
}

/**
 * Load constraints by constraint group IDs
 * @param {Array} groupIds - Array of constraint group IDs
 * @returns {Promise<Array>} Array of constraint objects
 */
export async function loadConstraintsByGroupIds(groupIds) {
    if (!Array.isArray(groupIds) || !groupIds.length) {
        return [];
    }

    const groups = await ConstraintGroup.find({ _id: { $in: groupIds } }).lean();
    const constraintIds = [...new Set(groups.flatMap(g => g.constraintIds || []))];

    if (!constraintIds.length) return [];

    return Constraint.find({
        _id: { $in: constraintIds },
        active: { $ne: false },
    }).lean();
}

/**
 * Build candidate applications list from job and users
 * @param {Object} job - The job object
 * @param {Array} users - Array of all users
 * @param {string} dryRunType - Type of dry run ("meeting" or "job")
 * @returns {Array} Array of candidate application objects
 */
export function buildCandidateApplications(job, users, dryRunType = "meeting") {
    const applicantMap = new Map();
    (job.applications || []).forEach(app => {
        const userId = String(app.user?._id || app.user);
        if (!applicantMap.has(userId)) {
            applicantMap.set(userId, app);
        }
    });

    // For job dry runs, only include actual applicants
    if (dryRunType === "job") {
        return users
            .filter(user => applicantMap.has(String(user._id)))
            .map(user => {
                const app = applicantMap.get(String(user._id));
                return {
                    application: { 
                        _id: app._id,
                        appliedAt: app.appliedAt,
                        user 
                    },
                    isApplicant: true,
                };
            });
    }

    // For meeting dry runs, include all users with applicant status
    return users.map(user => {
        const app = applicantMap.get(String(user._id)) || null;
        return {
            application: app
                ? { 
                    _id: app._id,
                    appliedAt: app.appliedAt,
                    user 
                }
                : { user, appliedAt: job.createdAt || new Date() },
            isApplicant: Boolean(app),
        };
    });
}
