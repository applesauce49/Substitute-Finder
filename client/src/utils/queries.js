import { gql } from "@apollo/client";

export const QUERY_JOBS = gql`
  query jobs($username: String) {
    jobs(username: $username) {
      _id
      active
      description
      createdAt
      createdBy {
        _id
        username
        email
      }
      meeting
      dates
      applicationCount
    }
  }
`;

export const QUERY_JOB = gql`
  query job($id: ID!) {
    job(_id: $id) {
      _id
      active
      dates
      description
      createdAt
      createdBy {
        _id
        username
        email
      }
      meeting
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

export const QUERY_USER = gql`
  query user($username: String!) {
    user(username: $username) {
      _id
      username
      email
      phone
      about
      degree
      meeting
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
  {
    me {
      _id
      username
      email
      phone
      admin
      about
      degree
      meeting
      jobs {
        _id
        active
        description
        dates
        meeting
        createdAt
      }
    }
  }
`;

export const QUERY_ME_BASIC = gql`
  {
    me {
      _id
      username
      email
      admin
    }
  }
`;

export const QUERY_MEETINGS = gql`
  {
    meetings {
      _id
      title
      startDateTime
    }
  }
`;

export const QUERY_MY_EVENTS = gql`
  query MyEvents {
    myEvents {
      id
      summary
      description
      start
      end
    }
  }
`;