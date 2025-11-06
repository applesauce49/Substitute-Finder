import { postToGoogleChat } from "./chatPoster.js";

export async function postJobToGoogleChat(job) {
    try {
        const title = "New Job Posted";
        const subtitle = `${job.meetingSnapshot.title}`;
        const imageUrl = "https://ssl.gstatic.com/images/icons/material/system/1x/event_available_black_48dp.png"
        const text = `A new job has been posted by ${job.createdBy.username}.\n\n`
        + `Meeting Title: ${job.meetingSnapshot.title}\n`
        + `Start Time: ${new Date(job.meetingSnapshot.startDateTime).toLocaleString()}\n`
        + `Description: ${job.description}\n\n`;

        const buttons = [
            {
                text: "View Job",
                url: `${process.env.CLIENT_URL}/jobs/${job._id}`, // Replace with actual frontend URL
            },
        ];

        await postToGoogleChat({
            title,
            subtitle,
            imageUrl,
            text,
            buttons,
        });
    } catch (error) {
        console.error("Error posting job to Google Chat:", error);
    }
}

export async function postJobCancelledToGoogleChat(job) {
    try {
        const title = "Job Cancelled";
        const subtitle = `${job.meetingSnapshot.title}`;
        const imageUrl = "https://ssl.gstatic.com/images/icons/material/system/1x/event_busy_black_48dp.png";
        const text = `The job posted by ${job.createdBy} has been cancelled.\n\n`
        + `Meeting Title: ${job.meetingSnapshot.title}\n`
        + `Start Time: ${new Date(job.meetingSnapshot.startDateTime).toLocaleString()}\n`;
        
        await postToGoogleChat({
            title,
            subtitle,
            imageUrl,
            text,
        });
    } catch (error) {
        console.error("Error posting job cancellation to Google Chat:", error);
    }
}

export async function postJobAssignedToGoogleChat(meetingName, createdBy, assignedUser, startDateTime) {
    try {
        const title = "Job Assigned";
        const subtitle = `${meetingName}`;
        const imageUrl = "https://ssl.gstatic.com/images/icons/material/system/1x/task_alt_black_48dp.png";
        const text = `The job posted by ${createdBy} has been assigned to ${assignedUser}.\n\n`
        + `Meeting Title: ${meetingName}\n`
        + `Start Time: ${new Date(startDateTime).toLocaleString()}\n`;

        await postToGoogleChat({
            title,
            subtitle,
            imageUrl,
            text,
        });
    } catch (error) {
        console.error("Error posting job assignment to Google Chat:", error);
    }
}