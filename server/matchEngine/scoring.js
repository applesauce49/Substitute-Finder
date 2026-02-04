/**
 * Scoring Module
 * Handles applicant scoring algorithms including workload and composite scoring
 */

import { SYSTEM_ATTRIBUTE_GETTERS, resolveAttributeValue } from './systemAttributes.js';
import { evaluateConstraint } from './constraints.js';

/**
 * Calculate workload balance score for an applicant
 * Higher scores favor users with fewer meetings (better for workload distribution)
 * @param {Object} user - The user object
 * @returns {number} Score between 0 and 1, where 1 = lowest meeting count
 */
export function calculateWorkloadScore(user) {
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
export function calculateRecentSubScore(user, windowDays) {
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

/**
 * Calculate a composite score that includes multiple factors
 * @param {Object} scored - The scored application object
 * @param {Object} meetingContext - Meeting context for workload balance
 * @param {Object} job - The job object to get creation date from
 * @returns {number} Composite score between 0 and 1
 */
export function calculateCompositeScore(scored, meetingContext, job) {
    const user = scored.application?.user;
    if (!user) return 0;

    // 1. Constraint Score (0-1) - 40% weight
    const constraintScore = scored.score || 0;
    const constraintWeight = 0.40;

    // 2. Workload Balance Score (0-1) - 30% weight  
    const workloadScore = calculateWorkloadScore(user);
    const workloadWeight = 0.30;

    // 3. Recent Substitute Jobs Score (0-1) - 20% weight
    const workloadBalanceWindow = meetingContext?.workloadBalanceWindowDays;
    const recentSubScore = workloadBalanceWindow ? calculateRecentSubScore(user, workloadBalanceWindow) : 0;
    const recentSubWeight = 0.20;

    // 4. Application Date Score (0-1) - 10% weight
    // Applications closer to job post date get higher scores
    let applicationDateScore = 0;
    if (scored.application?.appliedAt && job?.createdAt) {
        const appliedAt = new Date(scored.application.appliedAt);
        const jobPostedAt = new Date(job.createdAt);
        const daysSinceJobPosted = (appliedAt - jobPostedAt) / (1000 * 60 * 60 * 24);
        
        // Score decreases over 30 days from job post date, with applications in first 7 days getting full score
        if (daysSinceJobPosted <= 7) {
            applicationDateScore = 1.0; // Full score for applications within first week
        } else if (daysSinceJobPosted <= 30) {
            applicationDateScore = Math.max(0, (30 - daysSinceJobPosted) / 23); // Linear decline from day 8-30
        } else {
            applicationDateScore = 0; // No credit for applications more than 30 days after job posted
        }
        
        // Handle applications submitted before job creation (edge case)
        if (daysSinceJobPosted < 0) {
            applicationDateScore = 1.0;
        }
    }
    const applicationDateWeight = 0.10;

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

/**
 * Score an applicant against a set of constraints
 * @param {Object} application - The application object with user data
 * @param {Array} constraints - Array of constraint objects
 * @param {Map} attrDefMap - Map of attribute definitions
 * @param {Object} meetingContext - Meeting context for attribute resolution
 * @returns {Object} Scoring result with matched constraints and disqualification status
 */
export function scoreApplicant(application, constraints, attrDefMap, meetingContext) {
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

/**
 * Rank applications by score
 * @param {Array} candidates - Array of candidate applications
 * @param {Array} constraints - Array of constraints to evaluate
 * @param {Map} attrDefMap - Attribute definition map
 * @param {Object} meetingContext - Meeting context
 * @param {Object} job - Job object
 * @returns {Object} Ranking results with ranked applications
 */
export function rankApplications(candidates, constraints, attrDefMap, meetingContext, job) {
    const hasConstraints = constraints?.length > 0;

    // Step 1: Score each candidate against the constraints
    const scored = candidates.map(candidate => 
        scoreApplicant(candidate.application, constraints, attrDefMap, meetingContext)
    );

    // Step 2: Calculate composite scores
    const withCompositeScores = scored.map(s => {
        const compositeScore = calculateCompositeScore(s, meetingContext, job);
        return {
            ...s,
            constraintScore: s.score, // Preserve original constraint-only score
            score: compositeScore,    // Replace score with composite
            isApplicant: candidates.find(c => c.application === s.application)?.isApplicant ?? false
        };
    });

    // Step 3: Sort by composite score (higher is better), then by appliedAt
    const ranked = withCompositeScores.sort((a, b) => {
        if (a.disqualified !== b.disqualified) {
            return a.disqualified ? 1 : -1;
        }
        if (Math.abs(a.score - b.score) > 0.001) {
            return b.score - a.score;
        }
        // If scores are equal, prefer earlier applications
        const aDate = a.application?.appliedAt ? new Date(a.application.appliedAt) : new Date();
        const bDate = b.application?.appliedAt ? new Date(b.application.appliedAt) : new Date();
        return aDate - bDate;
    });

    return { ranked, hasConstraints };
}
