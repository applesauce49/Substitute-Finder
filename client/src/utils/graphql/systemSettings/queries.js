import { gql } from "@apollo/client";

export const QUERY_SYSTEM_SETTINGS = gql`
  query SystemSettings {
    systemSettings {
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

export const QUERY_SYSTEM_SETTING = gql`
  query SystemSetting($key: String!) {
    systemSetting(key: $key) {
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