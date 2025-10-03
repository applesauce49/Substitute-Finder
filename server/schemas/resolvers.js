import { AuthenticationError }  from 'apollo-server-express';
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
    // users: async () => {
    //   return User.find()
    //     .select('-__v -password')
    //     .populate('jobs')
    // },
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
    job: async (parent, { _id }) => {
      const job = await Job.findOne({ _id })
      .populate('createdBy')
      .populate('applications')
      .populate('meeting');

      if (!job.applications) {
        job.applications = [];
      }
      
      return job;
    },
    meetings: async () => {
      return Meeting.find({})
        .populate("host")
        .populate("coHost")
        .populate("firstAlternative");
    },
    // meeting: async (parent, { id }) => {
    //   return Meeting.findById(id)
    //     .populate("host")
    //     .populate("coHost")
    //     .populate("firstAlternative");
    // },
    // myEvents: async (_, __, context) => {
    //   if (!context.user) {
    //     throw new AuthenticationError('Not logged in');
    //   }

    //   const calendar = await getUserCalendarClient(context.user._id);

    //   const { data } = await calendar.events.list({
    //     calendarId: "primary",
    //     timeMin: new Date().toISOString(),
    //     maxResults: 20,
    //     singleEvents: true,
    //     orderBy: 'startTime',
    //   });

    //   return (data.items || []).map(ev => ({
    //     _id: ev.id,
    //     summary: ev.summary,
    //     description: ev.description,
    //     start: ev.start,
    //     end: ev.end,
    //     attendees: ev.attendees || []
    //   }));
    // },
    // myCalendars: async (_, __, context) => {
    //   if (!context.user) {
    //     throw new AuthenticationError("Not logged in");
    //   }

    //   const gcal = await getUserCalendarClient(context.user._id);

    //   const res = await gcal.calendarList.list();
    //   const calendars = res.data.items || [];

    //     const { data: primaryData } = await gcal.events.list({
    //     calendarId: "primary",
    //     timeMin: new Date().toISOString(),
    //     maxResults: 20,
    //     singleEvents: true,
    //     orderBy: 'startTime',
    //   });

    //   const primaryEvents = (primaryData.items || []).map(ev => ({
    //     _id: ev.id,
    //     summary: ev.summary,
    //     description: ev.description,
    //     start: ev.start,
    //     end: ev.end,
    //     attendees: ev.attendees || []
    //   }));

    //   return {
    //     primary: {
    //       _id: "primary",
    //       events: primaryEvents
    //     },
    //     others: calendars
    //       .filter(c => c.id !== "primary")
    //       .map(c => ({
    //         _id: c.id,
    //         name: c.summary,
    //         color: c.backgroundColor,
    //         accessRole: c.accessRole
    //       }))
    //   };
    // }
  },
  // Attendee: {
  //   user: async (attendee) => {
  //     return User.findOne({ email: attendee.email });
  //   },
  // },

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

    // addApplication: async(parent, {jobId}, context) => {
    //   if (context.user) {
    //     const user = await User.findOne({username: context.user.username});
        
    //     console.log(user);
    //     const updatedJob = await Job.findOneAndUpdate(
    //       {_id: jobId},
    //       { $addToSet: {applications: {_id: user._id, username: user.username}}},
    //       {new: true}
    //     ).populate('applications');

    //     return updatedJob;
    //   }

    //   throw new AuthenticationError('You need to be logged in!');
    // },
    // updateMe: async (parent, {email, phone, degree, about}, context) => {
    //   if (context.user) {
    //     const updatedUser = await User.findOneAndUpdate(
    //       {_id: context.user._id},
    //       {$set: {email: email, phone: phone, degree: degree, about: about}},
    //       {new: true}
    //     )
    //     return updatedUser;
    //   }
    //   throw new AuthenticationError('You need to be logged in!');
    // },
    // deactivateJob: async(parent, {jobId, active}, context) => {
    //   if (context.user) {
    //     const updatedJob = await Job.findOneAndUpdate(
    //       {_id: jobId},
    //       {$set: {active: active}},
    //       {new: true}
    //     )
    //     return updatedJob;
    //   }
    //   throw new AuthenticationError('You need to be logged in!');
    // },
    // createMeeting: async (parent, { input }) => {
    //   const meeting = await Meeting.create(input);

    //   //update user records to reference this meeting
    //   await User.findByIdAndUpdate(input.host, {
    //     $push: {meetings: meeting._id},
    //   });

    //   await User.findByIdAndUpdate(input.coHost, {
    //     $push: {meetings: meeting._id},
    //   });

    //   if (input.firstAlternative) {
    //     await User.findByIdAndUpdate(input.firstAlternative, {
    //       $push: {meetings: meeting._id},
    //     });
    //   }

    //   return meeting.populate("host coHost firstAlternative");
    // }
  }
};

export default resolvers;