import { gql } from "@apollo/client";

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

export const JOB_CANCELED_SUB = gql`
  subscription JobCanceled {
    jobCanceled
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

