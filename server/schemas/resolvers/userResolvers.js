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
                            { $match: { $expr: { $or: [{ $eq: ["$host", "$$userId"] }, { $eq: ["$coHost", "$$userId"] }] } } },
                            { $count: "count" }
                        ],
                        as: "hostedMeetings"
                    }
                },
                {
                    $addFields: {
                        createdCount: { $ifNull: [{ $arrayElemAt: ["$createdJobs.count", 0] }, 0] },
                        assignedCount: { $ifNull: [{ $arrayElemAt: ["$assignedJobs.count", 0] }, 0] },
                        appliedCount: { $ifNull: [{ $arrayElemAt: ["$appliedJobs.count", 0] }, 0] },
                        totalMeetingsHosted: { $ifNull: [{ $arrayElemAt: ["$hostedMeetings.count", 0] }, 0] }
                    }
                },
                {
                    $project: {
                        createdJobs: 0,
                        assignedJobs: 0,
                        appliedJobs: 0,
                        hostedMeetings: 0
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
        },

        updateUsersInBulk: async (_, { userIds, updates }) => {
            console.log("[updateUsersInBulk] request:", { userIds, updates });
            
            let updatedCount = 0;
            const failedIds = [];

            try {
                const users = await User.find({ _id: { $in: userIds } });
                
                if (users.length !== userIds.length) {
                    const foundIds = users.map(u => u._id.toString());
                    const notFoundIds = userIds.filter(id => !foundIds.includes(id));
                    failedIds.push(...notFoundIds);
                }

                for (const user of users) {
                    try {
                        // Update admin status if specified
                        if (updates.admin !== undefined) {
                            user.admin = updates.admin;
                        }

                        // Handle attribute updates
                        if (updates.attributes) {
                            // Replace all attributes
                            user.attributes = updates.attributes;
                        } else {
                            // Handle granular attribute operations
                            let currentAttributes = user.attributes || [];
                            
                            // Add/update attributes
                            if (updates.addAttributes) {
                                for (const newAttr of updates.addAttributes) {
                                    const existingIndex = currentAttributes.findIndex(a => a.key === newAttr.key);
                                    if (existingIndex >= 0) {
                                        currentAttributes[existingIndex].value = newAttr.value;
                                    } else {
                                        currentAttributes.push(newAttr);
                                    }
                                }
                            }
                            
                            // Remove attributes
                            if (updates.removeAttributeKeys) {
                                currentAttributes = currentAttributes.filter(
                                    attr => !updates.removeAttributeKeys.includes(attr.key)
                                );
                            }
                            
                            user.attributes = currentAttributes;
                        }

                        await user.save();
                        updatedCount++;
                    } catch (err) {
                        console.error(`Failed to update user ${user._id}:`, err);
                        failedIds.push(user._id.toString());
                    }
                }

                return {
                    success: failedIds.length === 0,
                    updatedCount,
                    failedIds,
                    message: failedIds.length > 0 
                        ? `Updated ${updatedCount} users, ${failedIds.length} failed` 
                        : `Successfully updated ${updatedCount} users`
                };
            } catch (err) {
                console.error("Bulk update error:", err);
                throw new GraphQLError(`Bulk update failed: ${err.message}`);
            }
        }
    }
};
