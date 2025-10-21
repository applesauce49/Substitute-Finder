import { GraphQLError } from 'graphql';
import { User } from "../../models/index.js";

export default {
    Query: {
        me: async (_, __, { user }) => {
            if (!user) throw new GraphQLError('Not logged in');

            return User.findById(user._id)
                .select('-__v -password')
                .populate('jobs');
        },

        user: async (_, { username }) => {
            return User.findOne({ username })
                .select('-__v -password')
                .populate('jobs');
        },
    },
};
