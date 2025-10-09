import { gql } from 'apollo-server-express';

const typeDefs = gql`
scalar DateTime
scalar JSON

type Query {
  me: User
  user(username: String!): User
  jobs: [Job!]!
  job(_id: ID!): Job
  meetings: [Meeting!]!
  calendars: [Calendar!]!   # optional, if you want grouping
}

type User {
  _id: ID!
  username: String
  email: String
  phone: String
  admin: Boolean
  about: String
  degree: String
  jobs: [Job!]!
}

type AddJobPayload {
  conflict: Boolean!
  message: String
  job: Job
}

type Mutation {
  addJob(
    dates: [String!]!
    description: String
    meeting: ID!
  ): AddJobPayload!
  acceptJob(jobId: ID!): Job
  applyForJob(jobId: ID!): Job   # optional, if you want applications
  cancelJob(jobId: ID!): Boolean!
  acceptApplication(jobId: ID!, applicationId: ID!): Boolean!
  declineApplication(jobId: ID!, applicationId: ID!): Boolean!
}

type Application {
  _id: ID!
  appliedAt: DateTime!
  user: User!
}

type Job {
  _id: ID!
  active: Boolean
  description: String
  dates: [String!]!
  createdAt: DateTime!
  createdBy: User!
  meeting: Meeting!
  applicationCount: Int!
  applications: [Application]   # if you want to support applications
  assignedTo: User        # optional for accepted subs
}

type Meeting {
  _id: ID!
  gcalEventId: String!
  title: String
  description: String
  startDateTime: DateTime
  endDateTime: DateTime
  host: User
}

type Calendar {
  _id: ID!
  name: String
  color: String
  meetings: [Meeting!]!
}

`;

export default typeDefs;