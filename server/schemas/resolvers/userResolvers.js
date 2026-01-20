import { GraphQLError } from 'graphql';
import { User, Job } from "../../models/index.js";

export default {
    Query: {
        me: async (_, __, { user }) => {
            if (!user) throw new GraphQLError('Not logged in');

            return User.findById(user._id)
                .select('-__v')
                .populate('assignedJobs.job');
        },

        user: async (_, { username }) => {
            return User.findOne({ username })
                .select('-__v')
                .populate('assignedJobs.job');
        },

        userById: async (_, { id }) => {
            return User.findById(id)
                .select('-__v')
                .populate('assignedJobs.job');
        },

        users: async () => {
            return User.find()
                .select('-__v')
                .populate('assignedJobs.job');
        },

        
        userJobStats: async () => {
            return User.aggregate([
                {
                    $lookup: {
                        from: "jobs",
                        let: { userId: "$_id" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$createdBy", "$$userId"] } } },
                            { $count: "count" }
                        ],
                        as: "createdJobs"
                    }
                },
                {
                    $lookup: {
                        from: "jobs",
                        let: { userId: "$_id" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$assignedTo", "$$userId"] } } },
                            { $count: "count" }
                        ],
                        as: "assignedJobs"
                    }
                },
                {
                    $lookup: {
                        from: "jobs",
                        let: { userId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $in: ["$$userId", "$applications.user"] }
                                }
                            },
                            { $count: "count" }
                        ],
                        as: "appliedJobs"
                    }
                },
                {
                    $lookup: {
                        from: "meetings",
                        let: { userId: "$_id" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$host", "$$userId"] } } },
                            { $count: "count" }
                        ],
                        as: "hostedMeetings"
                    }
                },
                {
                    $lookup: {
                        from: "meetings",
                        let: { userId: "$_id" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$coHost", "$$userId"] } } },
                            { $count: "count" }
                        ],
                        as: "coHostedMeetings"
                    }
                },
                {
                    $addFields: {
                        createdCount: { $ifNull: [{ $arrayElemAt: ["$createdJobs.count", 0] }, 0] },
                        assignedCount: { $ifNull: [{ $arrayElemAt: ["$assignedJobs.count", 0] }, 0] },
                        appliedCount: { $ifNull: [{ $arrayElemAt: ["$appliedJobs.count", 0] }, 0] },
                        hostedMeetingsCount: { $ifNull: [{ $arrayElemAt: ["$hostedMeetings.count", 0] }, 0] },
                        coHostedMeetingsCount: { $ifNull: [{ $arrayElemAt: ["$coHostedMeetings.count", 0] }, 0] }
                    }
                },
                {
                    $project: {
                        createdJobs: 0,
                        assignedJobs: 0,
                        appliedJobs: 0,
                        hostedMeetings: 0,
                        coHostedMeetings: 0
                    }
                }
            ]).exec();
        },
    },
    Mutation: {
        addUser: async (_, { username, email, admin, attributes, phone, about }) => {
            console.log("[addUser] request:", { username, email, admin, phone, about, attrCount: attributes?.length });
            const existingUser = await User.findOne({ $or: [{ username }, { email }] });
            if (existingUser) {
                throw new GraphQLError('User with this username or email already exists');
            }

            const newUser = new User({ 
                username, 
                email, 
                admin,
                phone,
                about,
                attributes
            });
            await newUser.save();
            return newUser;
        },

        updateUser: async (_, { _id, username, email, admin, attributes, phone, about }) => {
            console.log("[updateUser] request:", { _id, username, email, admin, phone, about, attrCount: attributes?.length });
            const user = await User.findById(_id);
            if (!user) {
                throw new GraphQLError('User not found');
            }

            if (username !== undefined) user.username = username;
            if (email !== undefined) user.email = email;
            if (admin !== undefined) user.admin = admin;
            if (attributes !== undefined) user.attributes = attributes;
            if (phone !== undefined) user.phone = phone;
            if (about !== undefined) user.about = about;

            await user.save();
            return user;
        }
    }
};
