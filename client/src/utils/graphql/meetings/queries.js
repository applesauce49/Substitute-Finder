import { gql } from "@apollo/client";

export const QUERY_MEETINGS = gql`
  query GetMeetings {
    meetings {
      _id
      source
      calendarId
      gcalEventId
      gcalRecurringEventId
      createdAt
      summary
      description
      updatedAt
      recurrence {
        frequency
        daysOfWeek
        startTime
        endTime
        until
      }
      constraintGroupIds
      constraintGroups {
        _id
        name
        constraints {
          _id
          name
          operator
          value
        }
      }
    }
  }
`;