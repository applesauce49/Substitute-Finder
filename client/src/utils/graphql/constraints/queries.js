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
    source
    readOnly
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

export const QUERY_CONSTRAINTS_GROUPS = gql`
  query ConstraintGroups {
    constraintGroups {
      _id
      name
      constraintIds
      constraints {
        _id
        name
        fieldKey
        operator
        value
      }
    }
  }
`;
