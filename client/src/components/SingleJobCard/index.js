import React, { useState } from "react";
import { useParams } from "react-router-dom";

import ApplicantList from "../ApplicantList";

import Auth from "../../utils/auth";
import { useQuery } from "@apollo/client";
import { QUERY_JOB, QUERY_ME, GET_USERS } from "../../utils/queries";
import { useMutation } from "@apollo/client";
import {
  ACCEPT_APPLICATION,
  APPLY_FOR_JOB,
  CANCEL_JOB,
  DECLINE_APPLICATION,
  // RUN_MATCH_ENGINE,
} from "../../utils/mutations";
import { isJobApplyDisabled } from "../../utils/jobHelpers";
import JobCard from "../JobCard/jobCard";

const SingleJobCard = ({ jobId: propJobId, onClose }) => {
  const { id: routeJobId } = useParams();
  const jobId = propJobId || routeJobId;
  const [applyForJob] = useMutation(APPLY_FOR_JOB);
  const [cancelJob] = useMutation(CANCEL_JOB);
  const [declineApplication] = useMutation(DECLINE_APPLICATION);
  const [acceptApplication] = useMutation(ACCEPT_APPLICATION);

  const { data: userData } = useQuery(QUERY_ME);
  const admin = userData?.me.admin || "";

  const { data: usersData } = useQuery(GET_USERS);

  const users = usersData?.users ?? [];
  const userOptions = users?.map(u => ({
    value: u._id.toString(),
    label: u.username
  }));



  const { loading, data, error, refetch } = useQuery(QUERY_JOB, {
    variables: { id: jobId },
    skip: !jobId,
  });

  const [selectedUserId, setSelectedUserId] = useState("");


  if (!jobId) return <p>No Job ID Provided</p>;
  if (error) return <p>Error loading job.</p>;
  if (loading) return <div>Loading...</div>;

  const job = data?.job || {};

  console.log("Loading job: ", job);


  const handleFormSubmit = async (event) => {
    event.preventDefault();

    try {
      // Determine who the "applicant" is
      const currentUser = userData?.me?._id;
      const applicantId = admin ? selectedUserId || currentUser : currentUser;

      await applyForJob({
        variables: {
          jobId,
          applicantId: applicantId,
        }
      });
    } catch (e) {
      console.error(e);
    }
    if (onClose) onClose();
  };

  const handleCancelJob = async (event) => {
    event.preventDefault();

    console.log("Cancelling job ", jobId);
    try {
      await cancelJob({ variables: { jobId: jobId } });
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  // Determine if the current user has already applied
  const applied = job?.applications?.some(
    (app) => app.user?._id === userData?.me?._id
  );

  const accepted = async (appId, jobId) => {
    try {
      console.log(`Acception application ${appId} for job ${jobId}`);
      acceptApplication({ variables: { jobId: jobId, applicationId: appId } });
      await refetch();
    }
    catch (e) {
      console.error(e);
    }
    console.log("Application Accepted");
    onClose();
  };

  const denied = async (appId, jobId) => {
    try {
      console.log(`Declining application ${appId} for job ${jobId}`);
      declineApplication({ variables: { jobId: jobId, applicationId: appId } });
      await refetch();
    }
    catch (e) {
      console.error(e);
    }

    console.log("Application DENIED.");
    onClose();

  };

  return (
    <div>
      {/* Job Details Card */}
      <JobCard job={job} />

      {(job?.applicationCount ?? 0) > 0 && job?.applications && (
        <div>
          <ApplicantList
            applications={job?.applications}
            onDenied={(appId) => denied(appId, job._id)}
            user={userData?.me}
          />
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center gap-2">
        {((Auth.loggedIn() && job.createdBy._id === Auth.getProfile().data._id) || admin) && (
          <form onSubmit={handleCancelJob}>
            <div className="d-flex justify-content-front align-items-center gap-2">
              <button
                className="no-border-btn btn btn-danger"
                type="submit"
              >
                Cancel Job
              </button>
            </div>
          </form>
        )}

        <div className="flex-grow-1"></div>

        {((Auth.loggedIn() && job.createdBy._id !== Auth.getProfile().data._id) || admin) && (
          <form onSubmit={(e) => handleFormSubmit(e, selectedUserId)}>
            <div className="d-flex justify-content-end align-items-center gap-2">

              {admin && (
                <>
                  <label htmlFor="applyFor" className="mb-0 text-nowrap">Apply on behalf of:</label>
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
                disabled={isJobApplyDisabled(job, { admin, applied }) || applied}
              >
                Apply
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
};

export default SingleJobCard;
