import { gql } from "@apollo/client";

export const LOGIN_USER = gql`
  mutation login($email: String!) {
    login(email: $email) {
      token
      user {
        _id
        username
      }
    }
  }
`;
// ADD_USER
export const ADD_USER = gql`
  mutation addUser(
    $username: String!
    $email: String!
    $admin: Boolean
    $attributes: [UserAttributeValueInput!]
  ) {
    addUser(
      username: $username
      email: $email
      admin: $admin
      attributes: $attributes
    ) {
      _id
      username
      email
      admin
      attributes { key value }
    }
  }
`;

// UPDATE_USER
export const UPDATE_USER = gql`
  mutation updateUser(
    $_id: ID!
    $username: String
    $email: String
    $admin: Boolean
    $attributes: [UserAttributeValueInput!]
  ) {
    updateUser(
      _id: $_id
      username: $username
      email: $email
      admin: $admin
      attributes: $attributes
    ) {
      _id
      username
      email
      admin
      attributes { key value }
    }
  }
`;
