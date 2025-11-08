import { connectDB } from "../config/db.js";
import Job from "../models/Job.js";
import resolvers from "../schemas/resolvers/index.js";


// import Meeting from "../models/Meeting.js";
// import User from "../models/User.js";

export async function runMatchEngine() {
    console.log(`[MatchEngine] Cycle started at ${new Date().toISOString()}`);
    const { acceptApplication } = resolvers.Mutation;

    await connectDB();

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
                console.log(`[MatchEngine] - Job "${job._id}" has no applications. Skipping.`);
                continue;
            }

            console.log(`${job}`);
            const sorted = job.applications.sort(
                (a, b) => new Date(a.appliedAt) - new Date(b.appliedAt)
            );
    
    
            const winner = sorted[0];
    
            console.log(
                `[Assign] Job "${job._id}" assigned to ${winner._id}`
            );
            await acceptApplication(
                null,
                { jobId: job._id, applicationId: winner._id },
                null,
            )
            totalEvaluated++;
        }
        catch (err) {
            console.log(`[MatchEngine] - Error: Failed to process job "${job._id}":`, err.message);
        }
    }
    console.log(`[MatchEngine] Cycle complete. ${totalEvaluated} applicant(s) evaluated`);
}
