import userResolvers from "./userResolvers.js";
import jobResolvers from "./jobResolvers.js";
import calendarResolvers from "./calendarResolvers.js";
import { GraphQLJSON } from 'graphql-type-json';

export default {
    JSON: GraphQLJSON,
    Query: {
        ...userResolvers.Query,
        ...jobResolvers.Query,
        ...calendarResolvers.Query,
    },
    Mutation: {
        ...jobResolvers.Mutation,
        ...calendarResolvers.Mutation,
    },
    Job: {
        ...jobResolvers.Job,
    },
    Meeting: {
        ...calendarResolvers.Meeting,
    },
};