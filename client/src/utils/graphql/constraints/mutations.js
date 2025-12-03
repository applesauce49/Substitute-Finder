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