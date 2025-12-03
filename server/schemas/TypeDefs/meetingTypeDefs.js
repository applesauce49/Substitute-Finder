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
  constraints: [ConstraintAttribute!]!
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

`;
