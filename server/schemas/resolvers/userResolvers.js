import { GraphQLError } from 'graphql';
import { User } from "../../models/index.js";

export default {
    Query: {
        me: async (_, __, { user }) => {
            if (!user) throw new GraphQLError('Not logged in');

            return User.findById(user._id)
                .select('-__v')
                .populate('jobs');
        },

        user: async (_, { username }) => {
            return User.findOne({ username })
                .select('-__v')
                .populate('jobs');
        },

        userById: async (_, { id }) => {
            return User.findById(id)
                .select('-__v')
                .populate('jobs');
        },

        users: async () => {
            return User.find()
                .select('-__v')
                .populate('jobs');
        }
    },
    Mutation: {
        addUser: async (_, { username, email, admin }) => {
            const existingUser = await User.findOne({ $or: [{ username }, { email }] });
            if (existingUser) {
                throw new GraphQLError('User with this username or email already exists');
            }

            const newUser = new User({ username, email, admin });
            await newUser.save();
            return true;
        },

        updateUser: async (_, { _id, username, email, admin }) => {
            const user = await User.findById(_id);
            if (!user) {
                throw new GraphQLError('User not found');
            }

            if (username !== undefined) user.username = username;
            if (email !== undefined) user.email = email;
            if (admin !== undefined) user.admin = admin;

            await user.save();
            return true;
        }
    }
};
