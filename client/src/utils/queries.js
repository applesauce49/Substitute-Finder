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
      about
      jobs {
        _id
        description
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
      jobs {
        _id
        active
        description
        createdAt
      }
    }
  }
`;

export const JOB_BASE_FIELDS = gql`
  fragment JobBaseFields on Job {
    _id
    active
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
    meetingSnapshot {
      eventId
      title
      startDateTime
      endDateTime
    }
    description
    applicationCount
  }
`

// JOB Info
export const QUERY_JOBS = gql`
  query Jobs($showAll: Boolean) {
    jobs(showAll: $showAll) {
      ...JobBaseFields
    }
  }
    ${JOB_BASE_FIELDS}
`;

export const QUERY_JOB = gql`
  query Job($id: ID!) {
    job(_id: $id) {
      ...JobBaseFields
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
  ${JOB_BASE_FIELDS}
`;

export const QUERY_ALL_JOBS = gql`
  query JobsAllForReport{
    jobs(showAll: true) {
      ...JobBaseFields
    }
  }
    ${JOB_BASE_FIELDS}
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

export const JOB_UPDATED_SUB = gql`
subscription {
  jobUpdated {
    _id
    active
    applicationCount
  }
}
`;


export const JOB_CREATED_SUB = gql`
  subscription JobCreated {
    jobCreated {
      _id
      description
      active
      meetingSnapshot {
        startDateTime
      }
      createdBy {
        _id
        username
      }
    }
  }
`;

export const JOB_CANCELLED_SUB = gql`
  subscription JobCancelled {
    jobCancelled
  }
`;

export const JOB_ASSIGNED_SUB = gql`
  subscription JobAssigned {
    jobAssigned {
      _id
      assignedTo {
        _id
        username
      }
      active
    }
  }
`;