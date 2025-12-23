import { gql } from "@apollo/client";

export const UPDATE_MEETING = gql`
  mutation UpdateMeeting($id: ID!, $input: MeetingInput!) {
    updateMeeting(id: $id, input: $input) {
      _id
      summary
      description
      constraintGroupIds
      updatedAt
    }
  }
`;

export const CREATE_MEETING = gql`
  mutation CreateMeeting($input: MeetingInput!) {
    createMeeting(input: $input) {
      _id
      summary
      description
      constraintGroupIds
      updatedAt
    }
  }
`;

export const DELETE_MEETING = gql`
  mutation DeleteMeeting($id: ID!) {
    deleteMeeting(id: $id)
  }
`;
