/**
 * Match Engine Core
 * Main orchestration functions for job matching and assignment
 */

import { connectDB } from "../config/db.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import Meeting from "../models/Meeting.js";
import resolvers from "../schemas/resolvers/index.js";
import { postJobToGoogleChat } from "../utils/chatJobNotifier.js";
import { getDefaultWorkloadBalanceWindowDays, getMaxFutureJobDays } from "../services/systemSettingsService.js";

// Import from modular files
import { SYSTEM_ATTRIBUTE_GETTERS } from './systemAttributes.js';
import { calculateWorkloadScore, calculateRecentSubScore, rankApplications } from './scoring.js';
import { buildAttributeDefinitionMap, getMeetingConstraints, loadConstraintsByGroupIds, buildCandidateApplications } from './dataLoaders.js';

/**
 * Preview match engine results for a meeting without making any changes
 * @param {string} meetingId - The meeting ID
 * @param {string} userId - Optional user ID filter
 * @param {string} dryRunType - Type of dry run ("meeting" or "job")
 * @param {string} jobId - Optional job ID for job-specific dry runs
 * @param {Object} virtualMeeting - Optional virtual meeting object
 * @returns {Promise<Object>} Preview results with applicant rankings
 */
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

    const candidates = buildCandidateApplications(job, allUsers, dryRunType);

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
        contextWithWorkload,
        job
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

/**
 * Run the match engine to process open jobs and assign winners
 * @returns {Promise<void>}
 */
export async function runMatchEngine() {
    console.log(`[MatchEngine] Cycle started at ${new Date().toISOString()}`);
    const { acceptApplication } = resolvers.Mutation;

    await connectDB();

    const attributeDefinitionMap = await buildAttributeDefinitionMap();
    const allUsers = await User.find({}).lean();

    // Get system configuration for max future job processing
    const maxFutureJobDays = await getMaxFutureJobDays();
    const now = new Date();
    const maxFutureDate = new Date(now.getTime() + (maxFutureJobDays * 24 * 60 * 60 * 1000));
    console.log(`[MatchEngine] Processing jobs with meetings between now and ${maxFutureDate.toISOString()} (${maxFutureJobDays} days)`);

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
            // First check if the date and time has passed. Close the job if so.
            const meetingStart = new Date(job.meetingSnapshot?.startDateTime);
            if (meetingStart < now) {
                console.log(`[MatchEngine] - Job "${job._id}" meeting time has passed. Closing job.`);
                job.active = false;
                await job.save();
                totalEvaluated++;
                continue;
            }
            
            // Check if the meeting is too far in the future
            if (meetingStart > maxFutureDate) {
                console.log(`[MatchEngine] - Job "${job._id}" meeting is too far in future (${meetingStart.toISOString()}). Skipping for now.`);
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
                } else {
                    console.log(`[MatchEngine] - Job "${job._id}" has no applications. Skipping job.`);
                    continue;
                }
            }

            const { meeting, constraints } = await getMeetingConstraints(job);
            const meetingContext = meeting || job.meetingSnapshot || {};
            const candidates = buildCandidateApplications(job, allUsers, "job");

            const { ranked: rankedApplications, hasConstraints } = rankApplications(
                candidates,
                constraints,
                attributeDefinitionMap,
                meetingContext,
                job
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

            // Ensure we have the application ID
            let applicationId = winner._id;
            
            if (!winnerRecord.isApplicant) {
                // Winner is not an existing applicant, create application
                job.applications.push({
                    user: winner.user._id,
                    appliedAt: new Date(),
                });
                await job.save();

                const inserted = job.applications.find(app => String(app.user) === String(winner.user._id) && app.appliedAt);
                applicationId = inserted?._id;
                
                if (!applicationId) {
                    console.error(`[MatchEngine] - Failed to create application for winner ${winner.user._id} on job ${job._id}`);
                    totalEvaluated++;
                    continue;
                }
            }

            console.log(
                `[Assign] Job "${job._id}" assigned to application ${applicationId}`
            );
            const res = await acceptApplication(
                null,
                { jobId: job._id, applicationId: applicationId },
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

/**
 * Get list of eligible jobs for match engine processing
 * @returns {Promise<Array>} Array of eligible job information
 */
export async function getEligibleJobsForMatchEngine() {
    await connectDB();
    
    const maxFutureJobDays = await getMaxFutureJobDays();
    const now = new Date();
    const maxFutureDate = new Date(now.getTime() + (maxFutureJobDays * 24 * 60 * 60 * 1000));

    const jobs = await Job.find({
        active: true,
        assignedTo: null
    })
        .populate("createdBy")
        .populate("applications.user")
        .lean();

    return jobs.map(job => {
        const meetingStart = new Date(job.meetingSnapshot?.startDateTime);
        const isPast = meetingStart < now;
        const isTooFarFuture = meetingStart > maxFutureDate;
        
        return {
            jobId: job._id.toString(),
            meetingTitle: job.meetingSnapshot?.title || "Untitled",
            startDateTime: job.meetingSnapshot?.startDateTime,
            createdBy: job.createdBy?.username || job.createdBy?.email,
            applicationCount: job.applications?.length || 0,
            meetingIsPast: isPast,
            meetingIsTooFarFuture: isTooFarFuture,
            isEligible: !isPast && !isTooFarFuture && (job.applications?.length > 0 || !job.firstNotificationSent)
        };
    });
}

/**
 * Run match engine with configurable options
 * @param {Array<String>} jobIds - Optional array of specific job IDs to process
 * @param {Boolean} dryRun - If true, don't make any changes, just return what would happen
 * @returns {Promise<Object>} Results of the match engine run
 */
export async function runMatchEngineConfigurable(jobIds = null, dryRun = false) {
    const logPrefix = dryRun ? "[MatchEngine-DryRun]" : "[MatchEngine-Config]";
    console.log(`${logPrefix} Started at ${new Date().toISOString()}`);
    console.log(`${logPrefix} jobIds filter: ${jobIds ? jobIds.join(", ") : "all"}`);
    
    const { acceptApplication } = resolvers.Mutation;
    await connectDB();

    const attributeDefinitionMap = await buildAttributeDefinitionMap();
    const allUsers = await User.find({}).lean();

    const maxFutureJobDays = await getMaxFutureJobDays();
    const now = new Date();
    const maxFutureDate = new Date(now.getTime() + (maxFutureJobDays * 24 * 60 * 60 * 1000));

    // Build query filter
    const query = {
        active: true,
        assignedTo: null
    };
    
    if (jobIds && jobIds.length > 0) {
        query._id = { $in: jobIds };
    }

    const jobs = await Job.find(query)
        .populate("createdBy")
        .populate("applications.user");

    if (!jobs.length) {
        console.log(`${logPrefix} No eligible jobs found.`);
        return {
            success: true,
            dryRun,
            jobsProcessed: 0,
            jobResults: [],
            totalEvaluated: 0
        };
    }

    console.log(`${logPrefix} Found ${jobs.length} job(s) to process`);

    let totalEvaluated = 0;
    const jobResults = [];

    for (const job of jobs) {
        const result = {
            jobId: job._id.toString(),
            meetingTitle: job.meetingSnapshot?.title || "Untitled",
            status: "skipped",
            message: "",
            assignedTo: null,
            assignedToName: null,
            applicantCount: job.applications?.length || 0,
            eligibleCount: 0,
            winnerScore: null
        };

        try {
            const meetingStart = new Date(job.meetingSnapshot?.startDateTime);
            
            // Check if meeting time has passed
            if (meetingStart < now) {
                result.status = dryRun ? "would-close" : "closed";
                result.message = "Meeting time has passed";
                
                if (!dryRun) {
                    job.active = false;
                    await job.save();
                }
                
                totalEvaluated++;
                jobResults.push(result);
                continue;
            }
            
            // Check if meeting is too far in future
            if (meetingStart > maxFutureDate) {
                result.status = "too-far-future";
                result.message = `Meeting is beyond ${maxFutureJobDays} days in the future`;
                jobResults.push(result);
                continue;
            }

            // Handle jobs with no applications
            if (!job.applications || job.applications.length === 0) {
                if (!job.firstNotificationSent) {
                    result.status = dryRun ? "would-notify" : "notified";
                    result.message = "No applications - sending first notification";
                    
                    if (!dryRun) {
                        job.firstNotificationSent = true;
                        await job.save();
                        await postJobToGoogleChat(job);
                    }
                    
                    totalEvaluated++;
                } else {
                    result.status = "no-applications";
                    result.message = "No applications and already notified";
                }
                
                jobResults.push(result);
                continue;
            }

            // Process job with applications
            const { meeting, constraints } = await getMeetingConstraints(job);
            const meetingContext = meeting || job.meetingSnapshot || {};
            const candidates = buildCandidateApplications(job, allUsers, "job");

            const { ranked: rankedApplications, hasConstraints } = rankApplications(
                candidates,
                constraints,
                attributeDefinitionMap,
                meetingContext,
                job
            );

            result.eligibleCount = rankedApplications.filter(r => !r.disqualified).length;

            if (hasConstraints) {
                console.log(
                    `${logPrefix} - Evaluated ${rankedApplications.length} applicant(s) against ${constraints.length} constraint(s) for job "${job._id}".`
                );
            }

            const winnerRecord = rankedApplications?.find(r => !r.disqualified);
            const winner = winnerRecord?.application;

            if (!winner || !winner.user?._id) {
                result.status = "no-eligible-applicants";
                result.message = "No eligible applicants available";
                totalEvaluated++;
                jobResults.push(result);
                continue;
            }

            result.winnerScore = winnerRecord.score;
            result.assignedTo = winner.user._id.toString();
            result.assignedToName = winner.user.username || winner.user.email;

            if (dryRun) {
                result.status = "would-assign";
                result.message = `Would assign to ${result.assignedToName} (score: ${result.winnerScore.toFixed(2)})`;
            } else {
                // Actually assign the job
                let applicationId = winner._id;
                
                if (!winnerRecord.isApplicant) {
                    // Winner is not an existing applicant, create application
                    job.applications.push({
                        user: winner.user._id,
                        appliedAt: new Date(),
                    });
                    await job.save();

                    const inserted = job.applications.find(
                        app => String(app.user) === String(winner.user._id) && app.appliedAt
                    );
                    applicationId = inserted?._id;
                    
                    if (!applicationId) {
                        result.status = "error";
                        result.message = `Failed to create application for ${result.assignedToName}`;
                        totalEvaluated++;
                        jobResults.push(result);
                        continue;
                    }
                }

                const res = await acceptApplication(
                    null,
                    { jobId: job._id, applicationId: applicationId },
                    null,
                );

                if (res.success) {
                    result.status = "assigned";
                    result.message = `Successfully assigned to ${result.assignedToName}`;
                    
                    await User.findByIdAndUpdate(
                        winner?.user?._id,
                        { $addToSet: { assignedJobs: { job: job._id, assignedAt: res.assignedAt } } },
                        { new: true, runValidators: true }
                    );
                } else {
                    result.status = "assignment-failed";
                    result.message = "Assignment failed";
                }
            }

            totalEvaluated++;
            jobResults.push(result);
        } catch (err) {
            result.status = "error";
            result.message = `Error: ${err.message}`;
            jobResults.push(result);
            console.log(`${logPrefix} - Error processing job "${job._id}":`, err.message);
        }
    }

    console.log(`${logPrefix} Complete. ${totalEvaluated} job(s) evaluated`);

    return {
        success: true,
        dryRun,
        jobsProcessed: jobs.length,
        jobResults,
        totalEvaluated
    };
}
