import { gql } from "@apollo/client";

export const QUERY_JOBS = gql`
  query jobs {
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
      meeting {
      _id
      title
      startDateTime
      host {
        username
        email
      }
    }
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
      meeting {
      _id
      title
      startDateTime
      host {
        username
        email
      }
    }
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
      jobs {
        _id
        active
        description
        dates
        meeting {
          _id
          title
          startDateTime
          host {
            username
            email
          }
        }
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
    calendars {
      id
      name
      color
      meetings {
        _id
        title
        startDateTime
      }
    }
  }
`;

export const QUERY_MY_EVENTS = gql`
  query MyEvents {
    myEvents {
      _id
      summary
      description
      start
      end
    }
  }
`;

export const QUERY_MY_CALENDARS = gql`
  query MyCalendars {
    myCalendars {
      primary {
        _id
        events {
          _id
          summary
          start
          end
        }
      }
      others {
        _id
        name
        color
        accessRole
      }
    }
  }
`;