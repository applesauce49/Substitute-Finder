import { gql } from 'graphql-tag';

export const matchEngineTypeDefs = gql`

# --- Enums ---

enum UserAttributeType {
  STRING
  NUMBER
  BOOLEAN
  DATE
  ENUM
}

enum ConstraintOperator {
  EQUALS
  NOT_EQUALS
  GT
  LT
  GTE
  LTE
  CONTAINS
  NOT_CONTAINS
  IN
  NOT_IN
  BETWEEN
}

enum AttributeSource {
  SYSTEM
  CUSTOM
}

# --- Types ---

type UserAttributeDefinition {
  _id: ID!
  key: String!
  label: String!
  type: UserAttributeType!
  options: [String!]!
  userEditable: Boolean!
  defaultValue: String
  description: String
  active: Boolean!
  source: AttributeSource!
  readOnly: Boolean!    # derived field: !userEditable && source == SYSTEM
}

type Constraint {
  _id: ID!
  name: String!
  description: String
  fieldSource: String!       # "user" | "meeting" (v1: "user")
  fieldKey: String!          # references UserAttributeDefinition.key
  operator: ConstraintOperator!
  value: String!             # we can store JSON-ish as string for now; can evolve later
  active: Boolean!
}

type ConstraintGroup {
  _id: ID!
  name: String!
  constraintIds: [ID!]!          # stored in Mongo
  constraints: [Constraint!]!    # resolved field
}

# --- Inputs ---

input UserAttributeDefinitionInput {
  key: String!
  label: String!
  type: UserAttributeType!
  options: [String!]
  userEditable: Boolean
  defaultValue: String
  description: String
  active: Boolean
}

input ConstraintInput {
  name: String!
  description: String
  fieldSource: String!        # v1: "user"
  fieldKey: String!
  operator: ConstraintOperator!
  value: String!
  active: Boolean
}

input ConstraintGroupInput {
  name: String!
  constraintIds: [ID!]!
}

# --- Query / Mutation ---

extend type Query {
  userAttributeDefinitions: [UserAttributeDefinition!]!
  constraints: [Constraint!]!
  constraintGroups: [ConstraintGroup!]!
}

extend type Mutation {
  createUserAttributeDefinition(input: UserAttributeDefinitionInput!): UserAttributeDefinition!
  updateUserAttributeDefinition(id: ID!, input: UserAttributeDefinitionInput!): UserAttributeDefinition!
  deleteUserAttributeDefinition(id: ID!): Boolean!

  createConstraint(input: ConstraintInput!): Constraint!
  updateConstraint(id: ID!, input: ConstraintInput!): Constraint!
  deleteConstraint(id: ID!): Boolean!

  createConstraintGroup(input: ConstraintGroupInput!): ConstraintGroup!
  updateConstraintGroup(id: ID!, input: ConstraintGroupInput!): ConstraintGroup!
  deleteConstraintGroup(id: ID!): Boolean!
}
`;