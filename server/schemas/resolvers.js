import { AuthenticationError } from 'apollo-server-express';
import { User, Job, Meeting } from "../models/index.js";
import { signToken } from "../utils/auth.js";
import { GraphQLJSON } from 'graphql-type-json';
import { getCalendarClient, getUserCalendarClient } from '../services/googleClient.js';

const resolvers = {
  JSON: GraphQLJSON,

  Meeting: {
    startDateTime: (meeting) => meeting.start?.dateTime || null,
    endDateTime: (meeting) => meeting.end?.dateTime || null,
  },

  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select('-__v -password')
          .populate('jobs')

        return userData;
      }

      throw new AuthenticationError('Not logged in');
    },
    user: async (parent, { username }) => {
      return User.findOne({ username })
        .select('-__v -password')
        .populate('jobs');
    },
    jobs: async () => {
      return Job.find({})
        .populate("createdBy")
        .populate("applications")
        .populate("meeting")
        .sort({ createdAt: -1 });
    },
    job: async (_, { _id }) => {
      const job = await Job.findById(_id)
        .populate({ path: "createdBy", select: "_id username email" })
        .populate({ path: "meeting", select: "_id title description startDateTime endDateTime" })
        .populate({ path: "applications.user", select: "_id username email" });

      if (!job) throw new Error("Job not found");
      return job;
    },
    meetings: async () => {
      return Meeting.find({})
        .populate("host")
        .populate("coHost")
        .populate("firstAlternative");
    },
  },

  Mutation: {
    addJob: async (_, { dates, description, meeting }, context) => {
      if (!context.user) {
        throw new AuthenticationError('You need to be logged in!');
      }

      const meetingDoc = await Meeting.findById(meeting);
      if (!meetingDoc) {
        return {
          conflict: true,
          message: "Meeting not found",
          job: null,
        }
      }

      const existingJob = await Job.findOne({
        meeting,
        dates,
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

      const newJob = await Job.create({
        dates,
        description,
        meeting,
        active: true,
        createdBy: context.user._id,
      });

      return {
        conflict: false,
        message: "Job created successfully",
        job: await newJob.populate("meeting createdBy"),
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
      await job.populate("meeting");
      await job.populate("applications");

      return job;
    },
    cancelJob: async (_, { jobId }, context) => {
      if (!context.user) throw new AuthenticationError("Not logged in");

      const job = await Job.findById(jobId);
      if (!job) throw new Error("Job not found");

      // Optional: only allow creator or admin
      if (job.createdBy.toString() !== context.user._id.toString()) {
        throw new AuthenticationError("Not authorized");
      }

      await Job.findByIdAndDelete(jobId);
      return true;   // ✅ GraphQL expects something back
    }
  }
};

export default resolvers;