import { connectDB } from "../config/db.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import resolvers from "../schemas/resolvers/index.js";
import { postJobToGoogleChat } from "../utils/chatJobNotifier.js";
import Meeting from "../models/Meeting.js";
import ConstraintGroup from "./Schemas/ConstraintGroup.js";
import Constraint from "./Schemas/Constraint.js";
import UserAttributeDefinition from "./Schemas/UserAttributeDefinition.js";
import { SYSTEM_ATTRIBUTES } from "../config/systemAttributes.js";
import { getDefaultWorkloadBalanceWindowDays } from "../services/systemSettingsService.js";


// import Meeting from "../models/Meeting.js";
// import User from "../models/User.js";

// --- Helpers for evaluating constraints ---

const SYSTEM_ATTRIBUTE_GETTERS = {
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

function parseListValue(raw) {
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

function parseRangeValue(raw) {
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
 * Calculate workload balance score for an applicant
 * Higher scores favor users with fewer meetings (better for workload distribution)
 * @param {Object} user - The user object
 * @returns {number} Score between 0 and 1, where 1 = lowest meeting count
 */
function calculateWorkloadScore(user) {
    const meetingCount = SYSTEM_ATTRIBUTE_GETTERS.totalMeetingsHosted(user);
    // Invert the count so people with fewer meetings get higher scores
    // Use a reasonable upper bound to prevent extreme outliers
    const maxMeetings = 50;
    const normalizedCount = Math.min(meetingCount, maxMeetings);
    return (maxMeetings - normalizedCount) / maxMeetings;
}

/**
 * Calculate recent substitute job score for time-based workload balancing
 * Higher scores favor users with fewer recent substitute assignments
 * @param {Object} user - The user object
 * @param {number} windowDays - Number of days to look back (null/undefined = no time-based balancing)
 * @returns {number} Score between 0 and 1, where 1 = fewest recent assignments
 */
function calculateRecentSubScore(user, windowDays) {
    if (!windowDays || windowDays <= 0) {
        return 0; // No time-based balancing requested
    }

    const cutoffDate = new Date(Date.now() - (windowDays * 24 * 60 * 60 * 1000));
    const recentJobs = (user?.assignedJobs || [])
        .filter(assignment => {
            const assignedAt = assignment?.assignedAt ? new Date(assignment.assignedAt) : null;
            return assignedAt && assignedAt >= cutoffDate;
        }).length;

    // Debug logging
    console.log(`[DEBUG] calculateRecentSubScore for user ${user?.username || user?._id}:`);
    console.log(`  - Window days: ${windowDays}`);
    console.log(`  - Cutoff date: ${cutoffDate}`);
    console.log(`  - Total assigned jobs: ${user?.assignedJobs?.length || 0}`);
    console.log(`  - Recent jobs count: ${recentJobs}`);
    if (user?.assignedJobs?.length > 0) {
        console.log(`  - Assignment dates:`, user.assignedJobs.map(a => ({assignedAt: a.assignedAt, job: a.job})));
    }

    // Invert the count so people with fewer recent jobs get higher scores
    // Use a reasonable upper bound to prevent extreme outliers
    const maxRecentJobs = Math.max(10, windowDays / 7); // Roughly 1-2 jobs per week as max
    const normalizedCount = Math.min(recentJobs, maxRecentJobs);
    return (maxRecentJobs - normalizedCount) / maxRecentJobs;
}

function coerceValueByType(value, type) {
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

function normalizeConstraintValue(constraint, attrType) {
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

function isEqual(a, b, type) {
    if (Array.isArray(a) || Array.isArray(b)) return false;
    if (type === "number" || type === "date" || type === "time") {
        return a === b;
    }
    return String(a).toLowerCase() === String(b).toLowerCase();
}

function evaluateConstraint(constraint, userValue, attrType) {
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

async function buildAttributeDefinitionMap() {
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

function resolveAttributeValue(fieldSource, fieldKey, user, meetingContext) {
    if (fieldSource === "meeting") {
        return meetingContext?.[fieldKey];
    }

    if (SYSTEM_ATTRIBUTE_GETTERS[fieldKey]) {
        return SYSTEM_ATTRIBUTE_GETTERS[fieldKey](user);
    }

    return user?.attributes?.find(attr => attr.key === fieldKey)?.value;
}

function scoreApplicant(application, constraints, attrDefMap, meetingContext) {
    if (!constraints.length) {
        return {
            application,
            score: 0,
            matched: 0,
            total: 0,
            matchedConstraints: [],
            disqualified: false,
        };
    }

    let matched = 0;
    const matchedConstraints = [];
    let failedRequired = false;

    for (const constraint of constraints) {
        const attrDef = attrDefMap.get(constraint.fieldKey);
        const attrType = attrDef?.type ?? "string";
        const userValue = resolveAttributeValue(
            constraint.fieldSource,
            constraint.fieldKey,
            application.user,
            meetingContext
        );

        const passes = evaluateConstraint(constraint, userValue, attrType);
        const isRequired = Boolean(constraint.required);

        if (passes) {
            matched++;
            matchedConstraints.push(constraint.name || constraint.fieldKey);
        } else if (isRequired) {
            failedRequired = true;
        }
    }

    const disqualified = failedRequired;

    return {
        application,
        matched,
        total: constraints.length,
        score: disqualified
            ? 0
            : constraints.length
                ? matched / constraints.length
                : 0,
        matchedConstraints,
        disqualified,
    };
}

async function getMeetingConstraints(job) {
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

async function loadConstraintsByGroupIds(groupIds) {
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

function buildCandidateApplications(job, users, dryRunType = "meeting") {
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
                    application: { ...app, user },
                    isApplicant: true,
                };
            });
    }

    // For meeting dry runs, include all users with applicant status
    return users.map(user => {
        const app = applicantMap.get(String(user._id)) || null;
        return {
            application: app
                ? { ...app, user }
                : { user, appliedAt: job.createdAt || new Date() },
            isApplicant: Boolean(app),
        };
    });
}

/**
 * Calculate a composite score that includes multiple factors
 * @param {Object} scored - The scored application object
 * @param {Object} meetingContext - Meeting context for workload balance
 * @returns {number} Composite score between 0 and 1
 */
function calculateCompositeScore(scored, meetingContext) {
    const user = scored.application?.user;
    if (!user) return 0;

    // 1. Constraint Score (0-1) - 40% weight
    const constraintScore = scored.score || 0;
    const constraintWeight = 0.40;

    // 2. Workload Balance Score (0-1) - 25% weight  
    const workloadScore = calculateWorkloadScore(user);
    const workloadWeight = 0.25;

    // 3. Recent Substitute Jobs Score (0-1) - 20% weight
    const workloadBalanceWindow = meetingContext?.workloadBalanceWindowDays;
    const recentSubScore = workloadBalanceWindow ? calculateRecentSubScore(user, workloadBalanceWindow) : 0;
    const recentSubWeight = 0.20;

    // 4. Application Date Score (0-1) - 15% weight
    // Earlier applications get higher scores
    let applicationDateScore = 0;
    if (scored.application?.appliedAt) {
        const appliedAt = new Date(scored.application.appliedAt);
        const now = new Date();
        const daysSinceApplied = (now - appliedAt) / (1000 * 60 * 60 * 24);
        // Score decreases over 30 days, with applications in first 7 days getting full score
        applicationDateScore = daysSinceApplied <= 7 ? 1 : Math.max(0, (30 - daysSinceApplied) / 23);
    }
    const applicationDateWeight = 0.15;

    // Calculate weighted composite score
    const compositeScore = 
        (constraintScore * constraintWeight) +
        (workloadScore * workloadWeight) +
        (recentSubScore * recentSubWeight) +
        (applicationDateScore * applicationDateWeight);

    console.log(`[DEBUG] Composite score for ${user.username}:`, {
        constraintScore: (constraintScore * constraintWeight).toFixed(3),
        workloadScore: (workloadScore * workloadWeight).toFixed(3),
        recentSubScore: (recentSubScore * recentSubWeight).toFixed(3),
        applicationDateScore: (applicationDateScore * applicationDateWeight).toFixed(3),
        totalScore: compositeScore.toFixed(3)
    });

    return compositeScore;
}

function rankApplications(candidates, constraints, attrDefMap, meetingContext) {
    const hasConstraints = Array.isArray(constraints) && constraints.length > 0;
    const workloadBalanceWindow = meetingContext?.workloadBalanceWindowDays;

    const ranked = (candidates || [])
        .map(candidate => {
            const scored = hasConstraints
                ? scoreApplicant(candidate.application, constraints, attrDefMap, meetingContext)
                : {
                    application: candidate.application,
                    score: 0,
                    matched: 0,
                    total: 0,
                    matchedConstraints: [],
                    disqualified: false,
                };

            // Calculate composite score that includes all factors
            const compositeScore = calculateCompositeScore(scored, meetingContext);

            return {
                ...scored,
                score: compositeScore, // Replace simple constraint score with composite score
                constraintScore: scored.score, // Keep original constraint score for reference
                isApplicant: candidate.isApplicant,
            };
        })
        .sort((a, b) => {
            // 1. Disqualified applicants go to bottom
            if (a.disqualified !== b.disqualified) {
                return a.disqualified ? 1 : -1;
            }
            
            // 2. PRIORITY: Actual applicants before non-applicants (ALWAYS)
            if (a.isApplicant !== b.isApplicant) {
                return b.isApplicant - a.isApplicant;
            }
            
            // 3. Higher constraint scores first
            if (b.score !== a.score) return b.score - a.score;
            
            // 4. Time-based workload balancing (favor users with fewer recent sub jobs)
            if (workloadBalanceWindow) {
                const aRecentScore = calculateRecentSubScore(a.application.user, workloadBalanceWindow);
                const bRecentScore = calculateRecentSubScore(b.application.user, workloadBalanceWindow);
                if (Math.abs(aRecentScore - bRecentScore) > 0.01) {
                    return bRecentScore - aRecentScore; // Higher score (fewer recent jobs) wins
                }
            }
            
            // 5. General workload balancing (favor users with fewer hosted meetings)
            const aWorkload = calculateWorkloadScore(a.application.user);
            const bWorkload = calculateWorkloadScore(b.application.user);
            if (Math.abs(aWorkload - bWorkload) > 0.01) {
                return bWorkload - aWorkload; // Higher workload score (fewer meetings) wins
            }
            
            // 6. Higher matched constraint count
            if (b.matched !== a.matched) return b.matched - a.matched;
            
            // 7. Earlier application time
            return new Date(a.application.appliedAt) - new Date(b.application.appliedAt);
        });

    return { ranked, hasConstraints };
}

export async function previewMatchEngineForMeeting(meetingId, userId = null, dryRunType = "meeting", jobId = null, virtualMeeting = null) {
    await connectDB();
    const attributeDefinitionMap = await buildAttributeDefinitionMap();
    const allUsers = await User.find({}).lean();

    console.log(`\n=== DEBUG: previewMatchEngineForMeeting ===`);
    console.log(`meetingId: ${meetingId}, dryRunType: ${dryRunType}, jobId: ${jobId}`);
    console.log(`virtualMeeting provided: ${!!virtualMeeting}`);

    // Use virtual meeting if provided, otherwise fetch from database
    const meeting = virtualMeeting || (meetingId ? await Meeting.findById(meetingId).lean() : null);
    
    if (!meeting) {
        throw new Error(`Meeting not found for ID: ${meetingId}`);
    }
    
    console.log(`Using meeting: ${meeting.summary || meeting.title || 'Unknown'}`);
    console.log(`Constraints: ${meeting.constraintGroupIds?.length || 0}`);
    console.log(`Meeting workload balance: ${meeting.workloadBalanceWindowDays} (type: ${typeof meeting.workloadBalanceWindowDays})`);
    console.log(`System default workload balance: ${await getDefaultWorkloadBalanceWindowDays()} days`);

    const eventIds = [
        meeting?.gcalEventId,
        meeting?.gcalRecurringEventId,
        meeting?.eventId
    ].filter(Boolean);

    let job = null;
    
    // If this is a job dry run, get the specific job
    if (dryRunType === "job" && jobId) {
        job = await Job.findById(jobId)
            .populate({
                path: "applications.user",
                populate: {
                    path: "assignedJobs.job",
                    model: "Job"
                }
            })
            .populate("createdBy")
            .lean();
    } else if (eventIds.length) {
        // For meeting dry runs, look for any active job for this meeting
        job = await Job.findOne({
            $or: [
                { "meetingSnapshot.gcalEventId": { $in: eventIds } },
                { "meetingSnapshot.gcalRecurringEventId": { $in: eventIds } },
                { "meetingSnapshot.eventId": { $in: eventIds } },
            ],
            active: true
        })
            .populate({
                path: "applications.user",
                populate: {
                    path: "assignedJobs.job",
                    model: "Job"
                }
            })
            .populate("createdBy")
            .lean();

        if (!job) {
            job = await Job.findOne({
                $or: [
                    { "meetingSnapshot.gcalEventId": { $in: eventIds } },
                    { "meetingSnapshot.gcalRecurringEventId": { $in: eventIds } },
                    { "meetingSnapshot.eventId": { $in: eventIds } },
                ],
            })
                .populate({
                    path: "applications.user",
                    populate: {
                        path: "assignedJobs.job",
                        model: "Job"
                    }
                })
                .populate("createdBy")
                .lean();
        }
    }

    if (!job && !meeting) {
        return {
            meetingId: meetingId ?? null,
            jobId: null,
            meetingTitle: "",
            constraintCount: 0,
            constraints: [],
            applicants: [],
            message: "No job or meeting found for this request.",
        };
    }

    // If no job exists, create a temporary shell for scoring purposes
    if (!job) {
        job = {
            _id: null,
            meetingSnapshot: {
                eventId: meeting?.gcalEventId || meeting?.gcalRecurringEventId,
                gcalEventId: meeting?.gcalEventId,
                gcalRecurringEventId: meeting?.gcalRecurringEventId,
                calendarId: meeting?.calendarId,
                title: meeting?.summary || "(Untitled)",
                description: meeting?.description || "",
                startDateTime: meeting?.start || null,
                endDateTime: meeting?.end || null,
            },
            applications: [],
            createdAt: meeting?.createdAt || new Date(),
        };
    }

    let constraintMeeting = null;
    let constraints = [];

    if (job?._id) {
        const result = await getMeetingConstraints(job);
        constraintMeeting = result.meeting;
        constraints = result.constraints;
    } else if (meeting) {
        constraintMeeting = meeting;
        constraints = await loadConstraintsByGroupIds(meeting.constraintGroupIds);
    }

    console.log(`Constraint meeting workload balance: ${constraintMeeting?.workloadBalanceWindowDays} (type: ${typeof constraintMeeting?.workloadBalanceWindowDays})`);

    // Calculate workload balance window before ranking (needed by rankApplications)
    const workloadBalanceWindow = await (async () => {
        // First check if constraintMeeting has a workload balance setting
        if (constraintMeeting?.workloadBalanceWindowDays !== null && constraintMeeting?.workloadBalanceWindowDays !== undefined) {
            return constraintMeeting.workloadBalanceWindowDays;
        }
        
        // Then check the meeting itself
        if (meeting?.workloadBalanceWindowDays !== null && meeting?.workloadBalanceWindowDays !== undefined) {
            return meeting.workloadBalanceWindowDays;
        }
        
        // Finally fall back to system default
        return await getDefaultWorkloadBalanceWindowDays();
    })();

    console.log(`Final workload balance window: ${workloadBalanceWindow} days`);

    const meetingContext = constraintMeeting || meeting || job.meetingSnapshot || {};

    // Ensure workload balance is available in meetingContext for rankApplications
    const contextWithWorkload = {
        ...meetingContext,
        workloadBalanceWindowDays: workloadBalanceWindow
    };

    const candidates = buildCandidateApplications(job, allUsers);

    // Pre-calculate meetings hosted for all users to avoid async issues in ranking
    const userIds = candidates.map(c => c.application?.user?._id).filter(Boolean);
    
    if (userIds.length > 0) {
        console.log(`[DEBUG] Calculating meetings hosted for ${userIds.length} users`);
        console.log(`[DEBUG] User IDs:`, userIds.map(id => id.toString()));
        
        // Get counts for hosts and coHosts separately, then merge
        const hostCounts = await Meeting.aggregate([
            { $match: { host: { $in: userIds } } },
            { $group: { _id: "$host", count: { $sum: 1 } } }
        ]);
        
        const coHostCounts = await Meeting.aggregate([
            { $match: { coHost: { $in: userIds } } },
            { $group: { _id: "$coHost", count: { $sum: 1 } } }
        ]);
        
        console.log(`[DEBUG] Host counts:`, hostCounts);
        console.log(`[DEBUG] CoHost counts:`, coHostCounts);

        // Create a lookup map combining both host and coHost counts
        const meetingsCountMap = {};
        
        // Add host counts
        hostCounts.forEach(result => {
            if (result._id) {
                const userId = result._id.toString();
                meetingsCountMap[userId] = (meetingsCountMap[userId] || 0) + result.count;
            }
        });
        
        // Add coHost counts
        coHostCounts.forEach(result => {
            if (result._id) {
                const userId = result._id.toString();
                meetingsCountMap[userId] = (meetingsCountMap[userId] || 0) + result.count;
            }
        });
        
        console.log(`[DEBUG] Final meetings count map:`, meetingsCountMap);
        
        // Add the counts to user objects
        candidates.forEach(candidate => {
            if (candidate.application?.user?._id) {
                const userId = candidate.application.user._id.toString();
                candidate.application.user.totalMeetingsHosted = meetingsCountMap[userId] || 0;
                console.log(`[DEBUG] User ${candidate.application.user.username} meetings hosted: ${candidate.application.user.totalMeetingsHosted}`);
            }
        });
    }

    const { ranked, hasConstraints } = rankApplications(
        candidates,
        constraints,
        attributeDefinitionMap,
        contextWithWorkload
    );

    // Determine the message based on dry run type and applicant status
    let message = null;
    if (dryRunType === "job") {
        if (!job?.applications?.length) {
            message = "This job has no applicants yet.";
        }
    } else {
        if (!job?.applications?.length && !ranked.some(r => r.isApplicant)) {
            message = "No applicants yet; showing how all users would rank for this meeting.";
        } else if (!hasConstraints) {
            message = "No constraints found for this meeting.";
        }
    }

    return {
        meetingId: meeting?._id?.toString() ?? null,
        jobId: job._id?.toString() ?? null,
        meetingTitle: job.meetingSnapshot?.title || meeting?.summary || "",
        constraintCount: constraints.length,
        constraints,
        workloadBalanceWindowDays: workloadBalanceWindow,
        applicants: ranked.map(r => ({
            applicationId: r.isApplicant ? (r.application?._id?.toString() ?? null) : null,
            userId: r.application?.user?._id?.toString() ?? null,
            userName: r.application?.user?.username || r.application?.user?.email || "Unknown",
            isApplicant: r.isApplicant,
            eligible: !r.disqualified,
            matched: r.matched,
            total: r.total,
            score: r.score, // This is now the composite score
            constraintScore: r.constraintScore, // Original constraint-only score
            meetingsHosted: SYSTEM_ATTRIBUTE_GETTERS.totalMeetingsHosted(r.application?.user),
            workloadScore: calculateWorkloadScore(r.application?.user),
            recentSubJobs: workloadBalanceWindow ? (r.application?.user?.assignedJobs || []).filter(assignment => {
                const assignedAt = assignment?.assignedAt ? new Date(assignment.assignedAt) : null;
                const cutoffDate = new Date(Date.now() - (workloadBalanceWindow * 24 * 60 * 60 * 1000));
                return assignedAt && assignedAt >= cutoffDate;
            }).length : null,
            recentSubScore: workloadBalanceWindow ? calculateRecentSubScore(r.application?.user, workloadBalanceWindow) : null,
            appliedAt: r.isApplicant ? (r.application?.appliedAt || null) : null,
            matchedConstraints: r.matchedConstraints || [],
        })),
        applicantCount: ranked.filter(r => r.isApplicant).length,
        eligibleCount: ranked.filter(r => !r.disqualified).length,
        dryRunType: dryRunType,
        message: message,
    };
}

export async function runMatchEngine() {
    console.log(`[MatchEngine] Cycle started at ${new Date().toISOString()}`);
    const { acceptApplication } = resolvers.Mutation;

    await connectDB();

    const attributeDefinitionMap = await buildAttributeDefinitionMap();
    const allUsers = await User.find({}).lean();

    // Step 1: Get open jobs
    const jobs = await Job.find({
        active: true,
        assignedTo: null
    })
        .populate("createdBy")
        .populate("applications.user");

    if (!jobs.length) {
        console.log("[MatchEngine] no eligible jobs found.");
        return;
    }

    let totalEvaluated = 0;

    for (const job of jobs) {
        try {
            // First check if the date and time has passed.  Close the job if so.
            const now = new Date();
            const meetingStart = new Date(job.meetingSnapshot?.startDateTime);
            if (meetingStart < now) {
                console.log(`[MatchEngine] - Job "${job._id}" meeting time has passed. Closing job.`);
                job.active = false;
                await job.save();
                totalEvaluated++;
                continue;
            }

            if (!job.applications || job.applications.length === 0) {

                if (!job.firstNotificationSent) {
                    console.log(`[MatchEngine] - Job "${job._id}" has no applications. Sending first notification.`);
                    job.firstNotificationSent = true;
                    await job.save();
                    await postJobToGoogleChat(job);
                    totalEvaluated++;
                    continue;
                // } else if(job.firstNotificationSent && !job.secondNotificationSent) {
                //     console.log(`[MatchEngine] - Job "${job._id}" has no applications. Sending second notification.`);
                //     job.secondNotificationSent = true;
                //     await job.save();
                //     totalEvaluated++;
                //     continue;
                } else {
                    console.log(`[MatchEngine] - Job "${job._id}" has no applications. Skipping job.`);
                    continue;
                }
            }

            const { meeting, constraints } = await getMeetingConstraints(job);
            const meetingContext = meeting || job.meetingSnapshot || {};
            const candidates = buildCandidateApplications(job, allUsers);

            const { ranked: rankedApplications, hasConstraints } = rankApplications(
                candidates,
                constraints,
                attributeDefinitionMap,
                meetingContext
            );

            if (hasConstraints) {
                console.log(
                    `[MatchEngine] - Evaluated ${rankedApplications.length} applicant(s) against ${constraints.length} constraint(s) for meeting "${meeting?._id || job.meetingSnapshot?.eventId}".`
                );
                rankedApplications.forEach(({ application, score, matched, total, disqualified }) => {
                    console.log(
                        `  applicant=${application?.user?._id || "unknown"} score=${score.toFixed(2)} (${matched}/${total}) appliedAt=${application?.appliedAt}${disqualified ? " [failed required rule]" : ""}`
                    );
                });
            } else {
                console.log(`[MatchEngine] - No constraints for meeting "${job.meetingSnapshot?.eventId}". Falling back to FIFO order.`);
            }

            const winnerRecord = rankedApplications?.find(r => !r.disqualified);
            const winner = winnerRecord?.application;

            if (!winner || !winner.user?._id) {
                console.log(`[MatchEngine] - No eligible applicants available for job "${job._id}".`);
                totalEvaluated++;
                continue;
            }

            if (!winnerRecord.isApplicant) {
                job.applications.push({
                    user: winner.user._id,
                    appliedAt: new Date(),
                });
                await job.save();

                const inserted = job.applications.find(app => String(app.user) === String(winner.user._id) && app.appliedAt);
                winner._id = inserted?._id || winner._id;
            }

            console.log(
                `[Assign] Job "${job._id}" assigned to ${winner._id}`
            );
            const res = await acceptApplication(
                null,
                { jobId: job._id, applicationId: winner._id },
                null,
            )

            if (res.success) {
                console.log(
                    `[MatchEngine] - Job "${job._id}" successfully assigned to applicant "${winner._id}" at ${res.assignedAt}`
                );

                // Add the successful assignment to the user's history
                await User.findByIdAndUpdate(
                    winner?.user?._id,
                    { $addToSet: { assignedJobs: { job: job._id, assignedAt: res.assignedAt } } },
                    { new: true, runValidators: true }
                );
            } else {
                console.log(
                    `[MatchEngine] - Job "${job._id}" assignment to applicant "${winner._id}" failed.`
                );
            }

            totalEvaluated++;
        }
        catch (err) {
            console.log(`[MatchEngine] - Error: Failed to process job "${job._id}":`, err.message);
        }
    }
    console.log(`[MatchEngine] Cycle complete. ${totalEvaluated} applicant(s) evaluated`);
}
