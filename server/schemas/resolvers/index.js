import userResolvers from "./userResolvers.js";
import jobResolvers from "./jobResolvers.js";
import meetingResolvers from "./meetingResolvers.js";
import calendarResolvers from "./calendarResolvers.js";
import constraintResolvers from "./constraintResolvers.js";
import systemSettingsResolvers from "./systemSettingsResolvers.js";
import { GraphQLJSON } from 'graphql-type-json';

export default {
    JSON: GraphQLJSON,
    Query: {
        ...userResolvers.Query,
        ...jobResolvers.Query,
        ...meetingResolvers.Query,
        ...calendarResolvers.Query,
        ...constraintResolvers.Query,
        ...systemSettingsResolvers.Query,
    },
    Mutation: {
        ...jobResolvers.Mutation,
        ...calendarResolvers.Mutation,
        ...userResolvers.Mutation,
        ...constraintResolvers.Mutation,
        ...meetingResolvers.Mutation,
        ...systemSettingsResolvers.Mutation,
    },
    Subscription: {
        ...jobResolvers.Subscription,
    },
    Job: {
        ...jobResolvers.Job,
    },
    Meeting: {
        ...calendarResolvers.Meeting,
        ...meetingResolvers.Meeting,
    },

    ConstraintGroup: constraintResolvers.ConstraintGroup,
    UserAttributeDefinition: constraintResolvers.UserAttributeDefinition,
    Constraint: constraintResolvers.Constraint,

};