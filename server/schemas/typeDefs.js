import { gql } from 'graphql-tag';

const typeDefs = gql`
scalar DateTime
scalar JSON

type Query {
  me: User
  user(username: String!): User
  userById(id: ID!): User
  users: [User!]!
  jobs(showAll: Boolean): [Job!]!
  job(_id: ID!): Job
  calendars: [Calendar!]!   # optional, if you want grouping
}

type UserJobStats {
  _id: ID!
  username: String!
  createdCount: Int!
  assignedCount: Int!
  appliedCount: Int!
}

extend type Query {
  userJobStats: [UserJobStats!]!
}

type AssignedJob {
  job: Job!
  assignedAt: DateTime!
}

type User {
  _id: ID!
  username: String
  email: String
  phone: String
  admin: Boolean
  about: String
  assignedJobs: [AssignedJob!]!
}

type AddJobPayload {
  conflict: Boolean!
  message: String
  job: Job
}

type AcceptApplicationResult {
  success: Boolean!
  jobId: ID!
  assignedAt: DateTime!
}

type Mutation {
  addJob(
    description: String
    createdBy: String!
    meeting: String!
    calendarId: String!
  ): AddJobPayload!
  applyForJob(jobId: ID!, applicantId: ID!): Job   # optional, if you want applications
  cancelJob(jobId: ID!): Boolean!
  acceptApplication(jobId: ID!, applicationId: ID!): AcceptApplicationResult!
  declineApplication(jobId: ID!, applicationId: ID!): Boolean!
  runMatchEngine: Boolean!
  addUser(username: String!, email: String!, admin: Boolean): Boolean!
  updateUser(_id: ID!, username: String, email: String, admin: Boolean): Boolean!
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
  assignedAt: DateTime
  firstNotificationSent: Boolean
  secondNotificationSent: Boolean
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

type CalendarAtendee {
  id: ID
  email: String!
  displayName: String
  responseStatus: String
  self: Boolean
  organizer: Boolean
}

type CalendarEvent {
  id: String!
  summary: String
  description: String
  start: String
  end: String
  calendarId: String
  attendees: [CalendarAtendee]
}

extend type Query {
  googleCalendars: [CalendarListEntry!]!
  googleEvents(calendarId: String!): [CalendarEvent!]!
}

extend type Mutation {
  inviteUserToEvent(eventId: String!, calendarId: String!, email: String!): CalendarEvent
}

type Subscription {
  jobUpdated: Job
  jobCreated: Job
  jobCanceled: ID
  jobAssigned: Job
}
  
`;

export default typeDefs;