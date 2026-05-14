import { gql } from "@apollo/client";

export const QUERY_CALENDARS = gql`
  query {
    googleCalendars {
      id
      summary
      primary
      backgroundColor
      foregroundColor
      accessRole
    }
  }
`;

export const IMPORT_GOOGLE_MEETINGS = gql`
  mutation ImportGoogleMeeetings {
    importGoogleMeetings {
      imported
      skipped
      updated
      expired
    }
  }
`;

export const QUERY_EVENTS = gql`
  query ($calendarId: String!, $parentOnly: Boolean) {
    googleEvents(calendarId: $calendarId, parentOnly: $parentOnly) {
      id
      recurringEventId
      summary
      start
      end
      description
      calendarId
      }
    }
`;

export const QUERY_EVENTS_FOR_CALENDARS = gql`
  query ($calendarIds: [String!]!) {
    googleEventsForCalendars(calendarIds: $calendarIds) {
      id
      recurringEventId
      summary
      start
      end
      description
      calendarId
    }
  }
`;

