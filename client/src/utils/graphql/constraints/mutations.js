import { gql } from "@apollo/client";

export const CREATE_USER_ATTRIBUTE_DEFINITION = gql`
  mutation CreateUserAttributeDefinition($input: UserAttributeDefinitionInput!) {
    createUserAttributeDefinition(input: $input) {
      _id
      key
      label
      type
      description
      active
    }
  }
`;

export const DELETE_USER_ATTRIBUTE_DEFINITION = gql`
  mutation DeleteUserAttributeDefinition($id: ID!) {
    deleteUserAttributeDefinition(id: $id)
  }
`;

export const UPDATE_USER_ATTRIBUTE_DEFINITION = gql`
  mutation UpdateUserAttributeDefinition($id: ID!, $input: UserAttributeDefinitionInput!) {
    updateUserAttributeDefinition(id: $id, input: $input) {
      _id
      key
      label
      type
      description
      active
      options
      userEditable
    }
  }
`;

export const CREATE_CONSTRAINT = gql`
  mutation CreateConstraint($input: ConstraintInput!) {
    createConstraint(input: $input) {
      _id
      name
      description
      fieldSource
      fieldKey
      operator
      value
      active
    }
  }
`;

export const DELETE_CONSTRAINT = gql`
  mutation DeleteConstraint($id: ID!) {
    deleteConstraint(id: $id)
  }
`;

export const UPDATE_CONSTRAINT = gql`
  mutation UpdateConstraint($id: ID!, $input: ConstraintInput!) {
    updateConstraint(id: $id, input: $input) {
      _id
      name
      description
      fieldSource
      fieldKey
      operator
      value
      active
    }
  }
`;

export const CREATE_CONSTRAINT_GROUP = gql`
  mutation CreateConstraintGroup($input: ConstraintGroupInput!) {
    createConstraintGroup(input: $input) {
      _id
      name
      constraintIds
    }
  }
`;

export const UPDATE_CONSTRAINT_GROUP = gql`
  mutation UpdateConstraintGroup($id: ID!, $input: ConstraintGroupInput!) {
    updateConstraintGroup(id: $id, input: $input) {
      _id
      name
      constraintIds
    }
  }
`;

export const DELETE_CONSTRAINT_GROUP = gql`
  mutation DeleteConstraintGroup($id: ID!) {
    deleteConstraintGroup(id: $id)
  }
`;
