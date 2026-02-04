import { gql } from 'graphql-tag';

export const jobTypeDefs = gql`
scalar DateTime
scalar JSON

extend type Query {
  jobs(showAll: Boolean): [Job!]!
  job(_id: ID!): Job
  matchEngineDryRun(meetingId: ID!): MatchEngineDryRunResult!
  matchEngineJobDryRun(jobId: ID!): MatchEngineDryRunResult!
  jobMetricsOverTime(days: Int): [JobMetricsData!]!
  eligibleJobsForMatchEngine: [EligibleJobInfo!]!
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
  runMatchEngineConfigurable(jobIds: [ID!], dryRun: Boolean): MatchEngineConfigurableResult!
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
  meetingsHosted: Int!
  workloadScore: Float!
  recentSubJobs: Int
  recentSubScore: Float
  appliedAt: DateTime
  matchedConstraints: [String!]!
}

type MatchEngineDryRunResult {
  meetingId: ID
  jobId: ID
  meetingTitle: String
  constraintCount: Int!
  constraints: [Constraint!]!
  workloadBalanceWindowDays: Int
  applicants: [MatchEngineApplicantScore!]!
  applicantCount: Int!
  eligibleCount: Int!
  dryRunType: String!
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

type JobMetricsData {
  date: String!
  jobsPosted: Int!
  jobsAssigned: Int!
  totalApplications: Int!
}

type EligibleJobInfo {
  jobId: ID!
  meetingTitle: String!
  startDateTime: DateTime!
  createdBy: String
  applicationCount: Int!
  meetingIsPast: Boolean!
  meetingIsTooFarFuture: Boolean!
  isEligible: Boolean!
}

type MatchEngineJobResult {
  jobId: ID!
  meetingTitle: String!
  status: String!
  message: String
  assignedTo: ID
  assignedToName: String
  applicantCount: Int
  eligibleCount: Int
  winnerScore: Float
}

type MatchEngineConfigurableResult {
  success: Boolean!
  dryRun: Boolean!
  jobsProcessed: Int!
  jobResults: [MatchEngineJobResult!]!
  totalEvaluated: Int!
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
