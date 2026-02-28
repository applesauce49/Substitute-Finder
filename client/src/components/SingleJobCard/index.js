import React, { useState } from "react";
import { useParams } from "react-router-dom";
import ApplicantList from "../ApplicantList";

import Auth from "../../utils/auth";
import { URLS } from "../../config/urls";
import { useQuery, useMutation } from "@apollo/client";
import { QUERY_JOB } from "../../utils/graphql/jobs/queries.js";
import { GET_USERS } from "../../utils/graphql/users/queries.js";
import {
  APPLY_FOR_JOB,
  CANCEL_JOB,
  DECLINE_APPLICATION,
  ACCEPT_APPLICATION
} from "../../utils/graphql/jobs/mutations.js";
import JobCard from "../JobCard/jobCard";

const SingleJobCard = ({me: userData, jobId: propJobId, onClose }) => {
  const { id: routeJobId } = useParams();
  const jobId = propJobId || routeJobId;

  const [applyForJob] = useMutation(APPLY_FOR_JOB);
  const [cancelJob] = useMutation(CANCEL_JOB);
  const [declineApplication] = useMutation(DECLINE_APPLICATION);
  const [acceptApplication] = useMutation(ACCEPT_APPLICATION);

  // const { data: userData, loading: userLoading } = useQuery(QUERY_ME);
  const { data: usersData } = useQuery(GET_USERS);
  const { loading, data, error, refetch } = useQuery(QUERY_JOB, {
    variables: { id: jobId },
    skip: !jobId,
  });

  const [selectedUserId, setSelectedUserId] = useState("");

  if (!jobId) return <p>No Job ID Provided</p>;
  if (error) return <p>Error loading job.</p>;
  if (loading ) return <div>Loading...</div>;

  const job = data?.job || {};
  const users = usersData?.users ?? [];
  const userOptions = users.map((u) => ({
    value: u._id.toString(),
    label: u.username,
  }));

  const currentUserId = userData?._id;
  const createdById = job?.createdBy?._id;

  const applied = job?.applications?.some(
    (app) => app.user?._id === currentUserId
  );

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    try {
      const applicantId = userData?.admin ? selectedUserId || currentUserId : currentUserId;

      await applyForJob({
        variables: { jobId, applicantId },
      });

      await refetch();
    } catch (e) {
      console.error('Error applying for job:', e);
      
      let errorMessage = 'Failed to apply for job. ';
      
      if (e.message?.includes('Not Found') || e.networkError?.statusCode === 404) {
        errorMessage += `The server endpoint could not be found (Trying to connect to: ${URLS.apiURL}). Please check your network connection or contact support.`;
      } else if (e.message?.includes('already applied')) {
        errorMessage += 'You have already applied for this job.';
      } else if (e.networkError) {
        errorMessage += `Network error: ${e.networkError.message || 'Unable to connect to server'}`;
      } else if (e.graphQLErrors?.length > 0) {
        errorMessage += e.graphQLErrors.map(err => err.message).join(', ');
      } else {
        errorMessage += e.message || 'An unknown error occurred.';
      }
      
      alert(errorMessage);
    }

    if (onClose) onClose();
  };

  const handleCancelJob = async (event) => {
    event.preventDefault();

    try {
      await cancelJob({ variables: { jobId } });
      await refetch();
    } catch (e) {
      console.error('Error cancelling job:', e);
      
      let errorMessage = 'Failed to cancel job. ';
      
      if (e.message?.includes('Not Found') || e.networkError?.statusCode === 404) {
        errorMessage += `The server endpoint could not be found (Trying to connect to: ${URLS.apiURL}). Please check your network connection or contact support.`;
      } else if (e.message?.includes('Job not found')) {
        errorMessage += 'This job no longer exists.';
      } else if (e.networkError) {
        errorMessage += `Network error: ${e.networkError.message || 'Unable to connect to server'}`;
      } else if (e.graphQLErrors?.length > 0) {
        errorMessage += e.graphQLErrors.map(err => err.message).join(', ');
      } else {
        errorMessage += e.message || 'An unknown error occurred.';
      }
      
      alert(errorMessage);
    }

    if (onClose) onClose();
  };

  const denied = async (appId) => {
    try {
      console.log(`Declining application ${appId} for job ${jobId}`);
      await declineApplication({ variables: { jobId, applicationId: appId } });
      await refetch();
    } catch (e) {
      console.error('Error declining application:', e);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to decline application. ';
      
      if (e.message?.includes('Not Found') || e.networkError?.statusCode === 404) {
        errorMessage += `The server endpoint could not be found (Trying to connect to: ${URLS.apiURL}). Please check your network connection or contact support.`;
      } else if (e.message?.includes('Job not found')) {
        errorMessage += 'This job no longer exists.';
      } else if (e.message?.includes('Application not found')) {
        errorMessage += 'This application no longer exists.';
      } else if (e.networkError) {
        errorMessage += `Network error: ${e.networkError.message || 'Unable to connect to server'}`;
      } else if (e.graphQLErrors?.length > 0) {
        errorMessage += e.graphQLErrors.map(err => err.message).join(', ');
      } else {
        errorMessage += e.message || 'An unknown error occurred.';
      }
      
      alert(errorMessage);
    }
    if (onClose) onClose();
  };

  const accepted = async (appId) => {
    try {
      console.log(`Accepting application ${appId} for job ${jobId}`);
      await acceptApplication({ variables: { jobId, applicationId: appId } });
      await refetch();
    } catch (e) {
      console.error('Error accepting application:', e);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to accept application. ';
      
      if (e.message?.includes('Not Found') || e.networkError?.statusCode === 404) {
        errorMessage += `The server endpoint could not be found (Trying to connect to: ${URLS.apiURL}). Please check your network connection or contact support.`;
      } else if (e.message?.includes('Calendar event not found')) {
        errorMessage += 'The associated calendar event may have been deleted, but the job assignment was still processed.';
      } else if (e.message?.includes('Job not found')) {
        errorMessage += 'This job no longer exists.';
      } else if (e.message?.includes('Application not found')) {
        errorMessage += 'This application no longer exists.';
      } else if (e.networkError) {
        errorMessage += `Network error: ${e.networkError.message || 'Unable to connect to server'}`;
      } else if (e.graphQLErrors?.length > 0) {
        errorMessage += e.graphQLErrors.map(err => err.message).join(', ');
      } else {
        errorMessage += e.message || 'An unknown error occurred.';
      }
      
      alert(errorMessage);
    }
    if (onClose) onClose();
  };

  const canCancelJob = Auth.loggedIn() && job.active === true && (createdById === Auth.getProfile()?.data?._id || userData?.admin);
  const canApply = Auth.loggedIn() && job.active === true && (createdById !== Auth.getProfile()?.data?._id || userData?.admin);

  return (
    <div>
      <JobCard job={job} />

      {job.active && job?.applications?.length > 0 && (
        <ApplicantList
          applications={job.applications}
          onDenied={(appId) => denied(appId, job._id)}
          onAssigned={(appId) => accepted(appId, job._id)}
          user={userData}
        />
      )}

      <div className="d-flex justify-content-between align-items-center gap-2">
        {canCancelJob && (
          <form onSubmit={handleCancelJob}>
            <div className="d-flex align-items-center gap-2">
              <button className="no-border-btn btn btn-danger" type="submit">
                Cancel Job
              </button>
            </div>
          </form>
        )}

        <div className="flex-grow-1" />

        {canApply && (
          <form onSubmit={handleFormSubmit}>
            <div className="d-flex justify-content-end align-items-center gap-2">
              {userData?.admin && (
                <>
                  <label htmlFor="applyFor" className="mb-0 text-nowrap">
                    Apply on behalf of:
                  </label>
                  <select
                    id="applyFor"
                    name="applyFor"
                    className="form-input"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="">-- Select user --</option>
                    {userOptions.map((user) => (
                      <option key={user.value} value={user.value}>
                        {user.label}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <button
                className="btn no-border-btn btn-success"
                type="submit"
                disabled={ !userData?.admin && applied }
              >
                {!userData?.admin && applied ? "Already Applied" : "Apply"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SingleJobCard;