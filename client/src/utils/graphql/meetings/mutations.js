import { gql } from "@apollo/client";

export const UPDATE_MEETING = gql`
  mutation UpdateMeeting($id: ID!, $input: MeetingInput!) {
    updateMeeting(id: $id, input: $input) {
      _id
      source
      calendarId
      gcalEventId
      gcalRecurringEventId
      summary
      description
      constraintGroupIds
      zoomMeetingUrl
      host {
        _id
        username
        email
      }
      coHost {
        _id
        username
        email
      }
      alternateHost {
        _id
        username
        email
      }
      workloadBalanceWindowDays
      updatedAt
    }
  }
`;

export const CREATE_MEETING = gql`
  mutation CreateMeeting($input: MeetingInput!) {
    createMeeting(input: $input) {
      _id
      source
      calendarId
      gcalEventId
      gcalRecurringEventId
      summary
      description
      constraintGroupIds
      zoomMeetingUrl
      host {
        _id
        username
        email
      }
      coHost {
        _id
        username
        email
      }
      alternateHost {
        _id
        username
        email
      }
      workloadBalanceWindowDays
      updatedAt
    }
  }
`;

export const DELETE_MEETING = gql`
  mutation DeleteMeeting($id: ID!) {
    deleteMeeting(id: $id)
  }
`;

export const SYNC_MEETING_ASSIGNMENTS_FROM_CALENDAR = gql`
  mutation SyncMeetingAssignmentsFromCalendar($meetingId: ID!, $dryRun: Boolean) {
    syncMeetingAssignmentsFromCalendar(meetingId: $meetingId, dryRun: $dryRun) {
      meetingId
      reviewedJobs
      updatedJobs
      assignedJobs
      unassignedJobs
      skippedAmbiguousJobs
      warnings
    }
  }
`;
