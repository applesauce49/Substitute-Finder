import { gql } from "@apollo/client";

// User Info
export const QUERY_USER = gql`
  query User($username: String!) {
    user(username: $username) {
      _id
      username
      email
      about
      degree
      jobs {
        _id
        description
        dates
        createdAt
      }
    }
  }
`;

export const QUERY_ME = gql`
  query Me {
    me {
      _id
      username
      email
      phone
      admin
      about
      degree
      jobs {
        _id
        active
        description
        dates
        meeting {
          _id
          title
          startDateTime
        }
        createdAt
      }
    }
  }
`;

// JOB Info
export const QUERY_JOBS = gql`
  query Jobs {
    jobs {
      _id
      active
      description
      createdAt
      createdBy {
        _id
        username
        email
      }
      assignedTo {
        _id
        username
        email
      }
      meeting {
        _id
        title
        startDateTime
      }
      dates
      applicationCount
    }
  }
`;

export const QUERY_JOB = gql`
  query Job($id: ID!) {
    job(_id: $id) {
      _id
      active
      description
      dates
      createdAt
      createdBy {
        _id
        username
        email
      }
      meeting {
        _id
        title
        startDateTime
      }
      applicationCount
      applications {
        _id
        appliedAt
        user {
          _id
          username
          email
        }
      }
    }
  }
`;

export const QUERY_MEETINGS = gql`
  query Meetings {
    meetings {
      _id
      gcalEventId
      title
      startDateTime
      endDateTime
      description
      ownership
      userId
      allDay
    }
  }
`;

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
