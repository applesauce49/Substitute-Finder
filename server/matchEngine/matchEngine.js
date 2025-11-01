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
        assignedTo: null,
        "applications.0": { $exists: true } 
    })
        .populate("createdBy")
        .populate("applications.user");

    if (!jobs.length) {
        console.log("[MatchEngine] no eligible jobs found.");
        return;
    }

    let totalEvaluated = 0;

    for (const job of jobs) {
        // const meeting = job.meeting;
        // const applicants = job.applications.map(a => a.user).filter(Boolean);
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
    console.log(`[MatchEngine] Cycle complete. ${totalEvaluated} applicant(s) evaluated`);
}
