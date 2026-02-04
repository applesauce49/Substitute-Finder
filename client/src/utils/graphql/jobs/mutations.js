import { gql } from "@apollo/client";

export const ADD_JOB = gql`
  mutation AddJob($description: String, $createdBy: String!, $meeting: String!, $calendarId: String!) {
    addJob(description: $description, createdBy: $createdBy, meeting: $meeting, calendarId: $calendarId) {
      conflict
      message
      job {
        _id
        active
        meetingSnapshot {
          eventId
          title
          description
          startDateTime
          endDateTime
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
  mutation ApplyForJob($jobId: ID!, $applicantId: ID!) {
    applyForJob(jobId: $jobId, applicantId: $applicantId) {
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
    acceptApplication(jobId: $jobId, applicationId: $applicationId) {
      success
      jobId
      assignedAt
    }
  }
`;

export const DECLINE_APPLICATION = gql`
  mutation DeclineApplication($jobId: ID!, $applicationId: ID!) {
    declineApplication(jobId: $jobId, applicationId: $applicationId)
  }
`;

export const RUN_MATCH_ENGINE = gql`
  mutation RunMatchEngine {
    runMatchEngine
  }
`;

export const RUN_MATCH_ENGINE_CONFIGURABLE = gql`
  mutation RunMatchEngineConfigurable($jobIds: [ID!], $dryRun: Boolean) {
    runMatchEngineConfigurable(jobIds: $jobIds, dryRun: $dryRun) {
      success
      dryRun
      jobsProcessed
      totalEvaluated
      jobResults {
        jobId
        meetingTitle
        status
        message
        assignedTo
        assignedToName
        applicantCount
        eligibleCount
        winnerScore
      }
    }
  }
`;

