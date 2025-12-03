import { gql } from "@apollo/client";

// Users Info
export const GET_USERS = gql`
  query GetUsers {
    users {
      _id
      username
      email
      admin
    }
  }
`;

// User Info
export const QUERY_USER = gql`
  query User($username: String!) {
    user(username: $username) {
      _id
      username
      email
      admin
      about
      assignedJobs {
        assignedAt
        job {
          _id
          active
          description
          createdAt
        }
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
      assignedJobs {
        assignedAt
        job {
          _id
          active
          description
          createdAt
        }
      }
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

