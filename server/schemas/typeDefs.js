import { gql } from 'apollo-server-express';

const typeDefs = gql`
  scalar JSON
  scalar DateTime

  type User {
    _id: ID
    username: String
    email: String
    phone: String
    degree: Boolean
    about: String
    meeting: String
    admin: Boolean
    profileURL: String
    jobCount: Int
    jobs: [Job]
  }

  type Job {
    _id: ID
    active: Boolean
    dates: String
    description: String
    meeting: Meeting!
    createdAt: String
    createdBy: User!
    applicationCount: Int
    applications: [User]
    assignedTo: User
  }

  type Auth {
    token: ID!
    user: User
  }

  type Meeting {
    _id: ID
    title: String!
    description: String
    startDateTime: DateTime
    endDateTime: DateTime
    repeat: RepeatRule!
    host: User!
    coHost: User!
    firstAlternative: User
    attendees: [Attendee]
    substitutions: [Substitution]
    createdAt: String!
  }

  type Event {
    _id: ID!
    summary: String
    description: String
    start: JSON
    end: JSON
    attendees: [JSON]
  }

  type CalendarMeta {
    _id: ID!
    name: String
    color: String
    accessRole: String  
  }

  type CalendarWithEvents {
    _id: ID!
    events: [Event!]!
  }

  type MyCalendarsPayload {
    primary: CalendarWithEvents!
    others: [CalendarMeta!]!
  }

  type Attendee {
    email: String
    responseStatus: String
    self: Boolean
    user: User
  }
  
  type Substitution {
    _id: ID!
    originalHost: User!
    substitute: User!
    meeting: Meeting!
    createdAt: DateTime!
  }

  enum RepeatRule {
    None
    Daily
    Weekly
    Monthly
  }

  input MeetingInput {
    title: String!
    description: String
    startDateTime: DateTime!
    repeat: RepeatRule
    hostId: ID!
    coHostId: ID!
    firstAlternativeId: ID!
  }

  type Query {
    me: User
    users: [User]
    user(username: String!): User
    jobs: [Job]
    job(_id: ID!): Job
    meetings: [Meeting]
    meeting(id: ID!): Meeting

    # Calendar-related
    myEvents: [Event!]!
    myCalendars: MyCalendarsPayload!
  }

  type AddJobResponse {
    conflict: Boolean!
    job: Job
  }

  type Mutation {
    login(email: String!, password: String!): Auth
    addUser(username: String!, email: String!, password: String!, meeting: String, admin: Boolean): Auth
    addApplication(jobId: ID!): Job
    updateMe(email: String, phone: String, degree: Boolean, about: String): User
    deactivateJob(jobId: ID!, active: Boolean!): Job

    addJob(dates: String!, description: String, meeting: ID!): AddJobResponse

    createMeeting(input: MeetingInput!): Meeting
    updateMeeting(id: ID!, input: MeetingInput!): Meeting
    deleteMeeting(id: ID!): Boolean
  }
`;

export default typeDefs;