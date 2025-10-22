import { GraphQLError } from 'graphql';
import { Job } from "../../models/index.js";
import { pubsub } from '../../graphql/pubsub.js';
import { getUserCalendarClient } from '../../services/googleClient.js';

export default {
    Query: {
        jobs: async (_, args, context) => {
            const now = new Date();
            const filter = { "meetingSnapshot.startDateTime": { $gte: now } };

            return Job.find({})
                .populate("createdBy", "_id username email")
                .populate("assignedTo", "_id username email")
                .populate("meetingSnapshot", "_id title startDateTime")
                .populate("applications")
                .sort({ createdAt: -1 });
        },
        job: async (_, { _id }) => {
            const job = await Job.findById(_id)
                .populate({ path: "createdBy", select: "_id username email" })
                .populate({ path: "assignedTo", select: "_id username email " })
                .populate({ path: "meetingSnapshot", select: "eventId title startDateTime endDateTime" })
                .populate({ path: "applications.user", select: "_id username email" });

            if (!job) throw new Error("Job not found");
            return job;
        },
    },
    Mutation: {
        addJob: async (_, { description, meeting }, context) => {
            if (!context.user) {
                throw new AuthenticationError('You need to be logged in!');
            }

            const existingJob = await Job.findOne({
                "meetingSnapshot.eventId": meeting,
                createdBy: context.user._id,
                active: true,
            });
            if (existingJob) {
                return {
                    conflict: true,
                    message: "You have already created a job for this meeting on this date.",
                    job: existingJob,
                }
            };

            const calendar = await getUserCalendarClient(context.user);

            const eventResponse = await calendar.events.get({
                calendarId: "primary",
                eventId: meeting,
            })

            const ev = eventResponse.data;

            const meetingSnapshot = {
                eventId: ev.id,
                calendarId: ev.organizer?.email || "primary",
                title: ev.summary || "No Title",
                description: ev.description || "",
                startDateTime: ev.start?.dateTime || ev.start?.date,
                endDateTime: ev.end?.dateTime || ev.end?.date,
            };

            const newJob = await Job.create({
                active: true,
                description,
                meetingSnapshot,
                createdBy: context.user._id,
            });

            await pubsub.publish("JOB_CREATED", { jobCreated: newJob });

            return {
                conflict: false,
                message: "Job created successfully",
                job: await newJob.populate("createdBy"),
            }
        },

        applyForJob: async (_, { jobId }, context) => {
            if (!context.user) {
                throw new AuthenticationError("You must be logged in");
            }

            const job = await Job.findById(jobId);
            if (!job) throw new Error("Job not found");

            // prevent duplicate applications
            if (job.applications.includes(context.user._id)) {
                throw new Error("Already applied");
            }

            // push properly shaped subdoc
            job.applications.push({
                user: context.user._id,
                appliedAt: new Date()
            });

            await job.save();

            await job.populate("createdBy");
            await job.populate("applications");

            console.log("Publishing JOB_UPDATED event");
            pubsub.publish("JOB_UPDATED", { jobUpdated: job });
            return job;
        },

        cancelJob: async (_, { jobId }, context) => {
            if (!context.user) throw new GraphQLError("Not logged in");

            const job = await Job.findById(jobId);
            if (!job) throw new Error("Job not found");

            // Optional: only allow creator or admin
            if (job.createdBy.toString() !== context.user._id.toString()) {
                throw new GraphQLError("Not authorized");
            }

            await Job.findByIdAndDelete(jobId);

            await pubsub.publish("JOB_CANCELED", { jobCanceled: jobId });
            return true;   // ✅ GraphQL expects something back
        },

        acceptApplication: async (_, { jobId, applicationId }, context) => {
            // if (!context.user) {
            //   throw new AuthenticationError("Not logged in");
            // }
            console.log(`Accepting application ${applicationId} for jobId ${jobId}`)
            const job = await Job.findById(jobId);

            if (!job) {
                throw new Error("Job not found");
            }

            const acceptedApp =
                job.applications.id(applicationId) ||
                (job.applications || []).find(
                    (a) => String(a?._id) === String(applicationId)
                );

            if (!acceptedApp) {
                throw new Error("Application not found.");
            }

            // mark job as inactive and assign user
            job.active = false;
            job.assignedTo = acceptedApp.user._id;

            // TODO: optional: handle declining the rest of the apps here
            // job.applications = [acceptedApp];

            await job.save();

            await pubsub.publish("JOB_ASSIGNED", { jobAssigned: job });

            // add job to the accepted user's profile
            // await User.findByIdAndUpdate(
            //     acceptedApp.user._id,
            //     { $addToSet: { acceptedJobs: job._id } },
            //     { new: true }
            // );

            return true;
        },

        declineApplication: async (_, { jobId, applicationId }, context) => {
            if (!context.user) {
                throw new GraphQLError("Not logged in");
            }

            // Try to update the job and remove the application entry
            const job = await Job.findByIdAndUpdate(
                jobId,
                { $pull: { applications: { _id: applicationId } } },
                { new: true }
            );

            if (!job) {
                throw new Error("Job not found");
            }

            return true; // simple success indicator
        },

        runMatchEngine: async (_, __, context) => {
            // if (!context.user || context.user.role !== "admin") {
            //   throw new Error("Unauthorized");
            // }
            await runMatchEngine();
            return true;
        },
    },
    Subscription: {
        jobUpdated: {
            subscribe: () => {
                console.log("Subscription to jobUpdated initiated");
                return pubsub.asyncIterableIterator(['JOB_UPDATED']);
            },
        },
        jobCreated: {
            subscribe: () => {
                console.log("Subscription to jobCreated initiated");
                return pubsub.asyncIterableIterator(['JOB_CREATED']);
            },
        },
        jobCanceled: {
            subscribe: () => {
                console.log("Subscription to jobCanceled initiated");
                return pubsub.asyncIterableIterator(['JOB_CANCELED']);
            },
        },
        jobAssigned: {
            subscribe: () => {
                console.log("Subscription to jobAssigned initiated");
                return pubsub.asyncIterableIterator(['JOB_ASSIGNED']);
            },
        },

    },
    Job: {
        applicationCount: (job) => job.applications?.length || 0,
    }
};
