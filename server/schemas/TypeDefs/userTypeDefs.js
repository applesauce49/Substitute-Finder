import { gql } from 'graphql-tag';

export const userTypeDefs = gql`
scalar DateTime
scalar JSON

type Query {
  me: User
  user(username: String!): User
  userById(id: ID!): User
  users: [User!]!
  userJobStats: [UserJobStats!]!
}

type Mutation {
  addUser(
    _id: ID!
    username: String!
    email: String!
    admin: Boolean
    attributes: [UserAttributeValueInput]
  ): User

  updateUser(
    _id: ID!
    username: String
    email: String
    admin: Boolean
    attributes: [UserAttributeValueInput]
  ): User
}

input UserAttributeValueInput {
  key: String!
  value: JSON
}

type UserJobStats {
  _id: ID!
  username: String!
  createdCount: Int!
  assignedCount: Int!
  appliedCount: Int!
}

type AssignedJob {
  job: Job!
  assignedAt: DateTime!
}

type User {
  _id: ID!
  username: String
  email: String
  phone: String
  admin: Boolean
  about: String
  assignedJobs: [AssignedJob!]
  attributes: [UserAttributeValue!]
}

type UserAttributeValue {
  key: String!
  value: JSON
}
`;
