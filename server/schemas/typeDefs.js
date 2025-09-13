// const { gql } = require('apollo-server-express');
import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type User {
    _id: ID
    username: String
    email: String
    phone: String
    degree: Boolean
    about: String
    meeting: String
    admin: Boolean
    profileURL: String
    jobCount: Int
    jobs: [Job]
  }

  type Job {
    _id: ID
    active: Boolean
    dates: String
    description: String
    meeting: String
    createdAt: String
    username: String
    applicationCount: Int
    applications: [User]
  }

  type Auth {
    token: ID!
    user: User
  }

  type Query {
    me: User
    users: [User]
    user(username: String!): User
    jobs(username: String): [Job]
    job(_id: ID!): Job
  }

  type Mutation {
    login(email: String!, password: String!): Auth
    addUser(username: String!, email: String!, password: String!, meeting: String, admin: Boolean): Auth
    addJob(active: Boolean!, dates: String! meeting: String!  description: String!): Job
    addApplication(jobId: ID!): Job
    updateMe(email: String, phone: String degree: Boolean, about: String): User
    deactivateJob(jobId: ID!, active: Boolean!): Job
  }

  scalar DateTime

  type Meeting {
    _id: ID
    title: String!
    description: String
    startDateTime: DateTime!
    repeat: RepeatRule!
    host: User!
    coHost: User!
    firstAlternative: User
    createdAt: String!
  }

  enum RepeatRule {
    None
    Daily
    Weekly
    Monthly
  }

  input MeetingInput {
    title: String!
    description: String
    startDateTime: DateTime!
    repeat: RepeatRule
    hostId: ID!
    coHostId: ID!
    firstAlternativeId: ID!
  }

  extend type Query {
    meetings: [Meeting]
    meeting(id: ID!): Meeting
  }

  extend type Mutation {
    createMeeting(input: MeetingInput!): Meeting
    updateMeeting(id: ID!, input: MeetingInput!): Meeting
    deleteMeeting(id: ID!): Boolean
  }
`;

export default typeDefs;
