import { gql } from "@apollo/client";

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

// 1) Data query for the stats
export const QUERY_USER_JOB_STATS = gql`
  query GetUserJobStats {
    userJobStats {
      _id
      username
      createdCount
      assignedCount
      appliedCount
      hostedMeetingsCount
      coHostedMeetingsCount
    }
  }
`;

// 2) Generic schema introspection for the UserJobStats type
export const QUERY_USER_JOB_STATS_SCHEMA = gql`
  query GetUserJobStatsSchema {
    __type(name: "UserJobStats") {
      name
      fields {
        name
        type {
          name
          kind
          ofType {
            name
            kind
          }
        }
      }
    }
  }
`;

export const QUERY_JOB_METRICS_OVER_TIME = gql`
  query GetJobMetricsOverTime($days: Int) {
    jobMetricsOverTime(days: $days) {
      date
      jobsPosted
      jobsAssigned
      totalApplications
    }
  }
`;

export const QUERY_MATCH_ENGINE_DRY_RUN = gql`
  query MatchEngineDryRun($meetingId: ID!) {
    matchEngineDryRun(meetingId: $meetingId) {
      meetingId
      jobId
      meetingTitle
      constraintCount
      message
      constraints {
        _id
        name
        fieldKey
        operator
        value
        required
      }
      applicants {
        applicationId
        userId
        userName
        isApplicant
        eligible
        matched
        total
        score
        appliedAt
        matchedConstraints
      }
    }
  }
`;
