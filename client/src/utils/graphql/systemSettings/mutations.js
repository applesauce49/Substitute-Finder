import { gql } from "@apollo/client";

export const UPDATE_SYSTEM_SETTING = gql`
  mutation UpdateSystemSetting($key: String!, $value: String!) {
    updateSystemSetting(key: $key, value: $value) {
      _id
      key
      value
      type
      label
      description
      category
      updatedAt
    }
  }
`;

export const INITIALIZE_SYSTEM_SETTINGS = gql`
  mutation InitializeSystemSettings {
    initializeSystemSettings {
      _id
      key
      value
      type
      label
      description
      category
      updatedAt
    }
  }
`;