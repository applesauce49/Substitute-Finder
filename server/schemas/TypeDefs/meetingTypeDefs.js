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
}

input MeetingInput {
  source: String
  summary: String
  description: String
  start: DateTime
  end: DateTime
  timezone: String
  owner: String
  recurrence: RecurrenceInput
  
  constraintGroupIds: [ID!]
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
}

`;
