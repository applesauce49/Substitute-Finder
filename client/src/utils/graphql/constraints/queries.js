import { gql } from "@apollo/client";

export const QUERY_USER_ATTRIBUTE_DEFINITIONS = gql`
  query UserAttributeDefinitions {
    userAttributeDefinitions {
    _id
    key
    label
    type
    options
    userEditable
    defaultValue
    description
    active
    }
  }
`;

export const QUERY_CONSTRAINTS = gql`
  query Constraints {
    constraints {
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