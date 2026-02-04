import { gql } from 'graphql-tag';

export const systemSettingsTypeDefs = gql`
  extend type Query {
    systemSettings: [SystemSetting!]!
    systemSetting(key: String!): SystemSetting
  }

  extend type Mutation {
    updateSystemSetting(key: String!, value: String!): SystemSetting!
    initializeSystemSettings: [SystemSetting!]!
  }

  type SystemSetting {
    _id: ID!
    key: String!
    value: String!
    type: String!
    label: String!
    description: String
    category: String!
    updatedAt: DateTime!
  }
`;