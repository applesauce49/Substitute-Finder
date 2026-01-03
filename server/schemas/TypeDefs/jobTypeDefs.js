import { gql } from 'graphql-tag';

export const jobTypeDefs = gql`
scalar DateTime
scalar JSON

extend type Query {
  jobs(showAll: Boolean): [Job!]!
  job(_id: ID!): Job
  matchEngineDryRun(meetingId: ID!): MatchEngineDryRunResult!
}

extend type Mutation {
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
}

type Subscription {
  jobUpdated: Job
  jobCreated: Job
  jobCanceled: ID
  jobAssigned: Job
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

type Application {
  _id: ID!
  appliedAt: DateTime!
  user: User!
}

type MatchEngineApplicantScore {
  applicationId: ID
  userId: ID
  userName: String
  isApplicant: Boolean!
  eligible: Boolean!
  matched: Int!
  total: Int!
  score: Float!
  appliedAt: DateTime
  matchedConstraints: [String!]!
}

type MatchEngineDryRunResult {
  meetingId: ID
  jobId: ID
  meetingTitle: String
  constraintCount: Int!
  constraints: [Constraint!]!
  applicants: [MatchEngineApplicantScore!]!
  message: String
}

type MeetingSnapshotSchema {
  eventId: String!
  gcalEventId: String
  gcalRecurringEventId: String
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
`;
