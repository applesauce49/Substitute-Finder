import { gql } from 'graphql-tag';

export const meeetingTypeDefs = gql`
scalar DateTime
scalar JSON

extend type Query {
  meetings: [Meeting!]!
}

type Meeting {
  _id: ID!
  source: String
  calendarId: String
  gcalEventId: String
  gcalRecurringEventId: String
  owner: User
  createdAt: DateTime
  summary: String
  description: String
  updatedAt: DateTime!
  recurrence: RecurrenceRule
  constraintGroupIds: [ID!]!
  constraintGroups: [ConstraintGroup!]
  zoomMeetingUrl: String
  host: User
  coHost: User
  alternateHost: User
  workloadBalanceWindowDays: Int
  linkedJobIds: [ID!]!
}

input MeetingInput {
  source: String
  calendarId: String
  gcalEventId: String
  gcalRecurringEventId: String
  summary: String
  description: String
  start: DateTime
  end: DateTime
  timezone: String
  owner: String
  recurrence: RecurrenceInput
  
  constraintGroupIds: [ID!]
  zoomMeetingUrl: String
  hostId: ID
  coHostId: ID
  alternateHostId: ID
  workloadBalanceWindowDays: Int
  linkedJobIds: [ID!]
}

input RecurrenceInput {
  frequency: String
  daysOfWeek: [String!]
  startTime: String
  endTime: String
  until: DateTime
  timezone: String
}

type RecurrenceRule {
  frequency: String
  daysOfWeek: [String!]
  startTime: String
  endTime: String
  until: DateTime
  timezone: String
}

type ConstraintAttribute {
  key: String!
  type: String!
  value: String!
}

extend type Mutation {
  createMeeting(input: MeetingInput!): Meeting!
  updateMeeting(id: ID!, input: MeetingInput!): Meeting!
  syncMeetingAssignmentsFromCalendar(meetingId: ID!, dryRun: Boolean): MeetingAssignmentSyncResult!
}

type MeetingAssignmentSyncResult {
  meetingId: ID!
  reviewedJobs: Int!
  updatedJobs: Int!
  assignedJobs: Int!
  unassignedJobs: Int!
  skippedAmbiguousJobs: Int!
  warnings: [String!]!
}

`;
