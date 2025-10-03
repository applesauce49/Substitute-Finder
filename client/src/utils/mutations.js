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

export const ADD_APPLICATION = gql`
  mutation addApplication($jobId: ID!) {
    addApplication(jobId: $jobId) {
      _id
      applicationCount
      applications {
        _id
        username
        email
        phone
        degree
      }
    }
  }
`;

export const DEACTIVATE_JOB = gql`
  mutation deactivateJob($jobId: ID!, $active: Boolean!) {
    deactivateJob(jobId: $jobId, active: $active) {
      _id
      active
    }
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
