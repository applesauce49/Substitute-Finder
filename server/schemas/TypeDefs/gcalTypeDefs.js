import { gql } from 'graphql-tag';

export const gcalTypeDefs = gql`

extend type Query {
  googleCalendars: [CalendarListEntry!]!
  googleEvents(calendarId: String!): [CalendarEvent!]!
  calendars: [Calendar!]!   # optional, if you want grouping

}

extend type Mutation {
  inviteUserToEvent(eventId: String!, calendarId: String!, email: String!): CalendarEvent
  importGoogleMeetings: ImportResult!
}

type ImportResult {
  imported: Int!
  skipped: Int!
  updated: Int!
  expired: Int!
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

`;