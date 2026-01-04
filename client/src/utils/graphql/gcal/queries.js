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
  query ($calendarId: String!) {
    googleEvents(calendarId: $calendarId) {
      id
      summary
      start
      end
      description
      calendarId
      }
    }
`;

