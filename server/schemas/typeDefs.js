import { gql } from 'graphql-tag';

const typeDefs = gql`
scalar DateTime
scalar JSON

type Query {
  me: User
  user(username: String!): User
  jobs: [Job!]!
  job(_id: ID!): Job
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
    description: String
    meeting: String!
  ): AddJobPayload!
  acceptJob(jobId: ID!): Job
  applyForJob(jobId: ID!): Job   # optional, if you want applications
  cancelJob(jobId: ID!): Boolean!
  acceptApplication(jobId: ID!, applicationId: ID!): Boolean!
  declineApplication(jobId: ID!, applicationId: ID!): Boolean!
  runMatchEngine: Boolean!
}

type Application {
  _id: ID!
  appliedAt: DateTime!
  user: User!
}

type MeetingSnapshotSchema {
  eventId: String!
  title: String
  description: String
  startDateTime: DateTime
  endDateTime: DateTime
}

type Job {
  _id: ID!
  active: Boolean
  description: String
  meetingSnapshot: MeetingSnapshotSchema!
  createdAt: DateTime!
  createdBy: User!
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
  ownership: String
  userId: String
  allDay: Boolean
}

type Calendar {
  _id: ID!
  name: String
  color: String
  meetings: [Meeting!]!
}

type CalendarListEntry {
  id: String!
  summary: String
  primary: Boolean
  accessRole: String
  backgroundColor: String
  foregroundColor: String
}

type CalendarEvent {
  id: String!
  summary: String
  description: String
  start: String
  end: String
  calendarId: String
}

extend type Query {
  googleCalendars: [CalendarListEntry!]!
  googleEvents(calendarId: String!): [CalendarEvent!]!
}

type Subscription {
  jobUpdated: Job
  jobCreated: Job
  jobCanceled: ID
  jobAssigned: Job
}
  
`;

export default typeDefs;