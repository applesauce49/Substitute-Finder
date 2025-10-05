import { gql } from "@apollo/client";

export const LOGIN_USER = gql`
  mutation login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        _id
        username
      }
    }
  }
`;

export const ADD_USER = gql`
  mutation addUser(
    $username: String!
    $password: String!
    $email: String!
    $meeting: String
    $admin: Boolean
  ) {
    addUser(
      username: $username
      password: $password
      email: $email
      meeting: $meeting
      admin: $admin
    ) {
      token
      user {
        _id
        email
        username
        meeting
        admin
      }
    }
  }
`;

export const ADD_JOB = gql`
  mutation AddJob($dates: [String!]!, $description: String, $meeting: ID!) {
    addJob(dates: $dates, description: $description, meeting: $meeting) {
      conflict
      message
      job {
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
        createdBy {
          _id
          username
          email
        }
        applicationCount
      }
    }
  }
`;

export const APPLY_FOR_JOB = gql`
  mutation ApplyForJob($jobId: ID!) {
    applyForJob(jobId: $jobId) {
      _id
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

export const CANCEL_JOB = gql`
  mutation CancelJob($jobId: ID!) {
    cancelJob(jobId: $jobId)
  }
`;

export const ACCEPT_APPLICATION = gql`
  mutation AcceptApplication($jobId: ID!, $applicationId: ID!) {
    acceptApplication(jobId: $jobId, applicationId: $applicationId)
  }
`;


export const DECLINE_APPLICATION = gql`
  mutation DeclineApplication($jobId: ID!, $applicationId: ID!) {
    declineApplication(jobId: $jobId, applicationId: $applicationId)
  }
`;

export const UPDATE_ME = gql`
  mutation updateMe(
    $email: String
    $phone: String
    $degree: Boolean
    $about: String
  ) {
    updateMe(email: $email, phone: $phone, degree: $degree, about: $about) {
      _id
      username
      email
      phone
      degree
      about
      admin
      jobs {
        _id
        active
        description
        dates
        createdAt
      }
    }
  }
`;
