import React from "react";
import { useParams } from "react-router-dom";

import ApplicantList from "../components/ApplicantList";

import Auth from "../utils/auth";
import { useQuery } from "@apollo/client";
import { QUERY_JOB, QUERY_ME } from "../utils/queries";
import { useMutation } from "@apollo/client";
import { ACCEPT_APPLICATION, 
        APPLY_FOR_JOB, 
        CANCEL_JOB, 
        DECLINE_APPLICATION,
        RUN_MATCH_ENGINE,
      } from "../utils/mutations";
import { isJobApplyDisabled } from "../utils/jobHelpers";

const SingleJob = ({ jobId: propJobId, onClose }) => {
  const { id: routeJobId } = useParams();
  const jobId = propJobId || routeJobId;
  const [applyForJob] = useMutation(APPLY_FOR_JOB);
  const [cancelJob] = useMutation(CANCEL_JOB);
  const [declineApplication] = useMutation(DECLINE_APPLICATION);
  const [acceptApplication] = useMutation(ACCEPT_APPLICATION);
  const [runMatchEngine] = useMutation(RUN_MATCH_ENGINE);
  const { data: userData } = useQuery(QUERY_ME);

  const admin = userData?.me.admin || "";

  const { loading, data, error, refetch } = useQuery(QUERY_JOB, {
    variables: { id: jobId },
    skip: !jobId,
  });

  if (!jobId) return <p>No Job ID Provided</p>;
  if (error) return <p>Error loading job.</p>;
  if (loading) return <div>Loading...</div>;

  const job = data?.job || {};

  console.log("Loading job: ", job);

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    try {
      await applyForJob({ variables: { jobId } });
    } catch (e) {
      console.error(e);
    }
    onClose();
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

  const handleRunMatchEngine = async (event) => {
    event.preventDefault();

    console.log("Running Match Engine");
    try {
      await runMatchEngine();
    } catch (e) {
      console.error(e);
    }
    onClose();
  }

  const applied = job?.applications?.find((app) => app._id === userData?.me._id);

  const accepted = async (appId, jobId) => { 
    try {
      console.log(`Acception application ${appId} for job ${jobId}`);
      acceptApplication({ variables: {jobId: jobId, applicationId: appId } });
      await refetch();
    }
    catch (e) {
      console.error(e);
    }
    console.log("Application Accepted") 
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

  };

  return (
    <div className="text-center single-job-close">
      <div className="card mb-3">
        <p className="card-header single-job-header">
          {job.meeting.title}
        </p>
        <div className="card-body">
          <p>
            <b>Date: </b>{job.dates}<br />
            <b>For: </b>{job?.createdBy?.username ?? "N/A"}<br />
            <b>Posted: </b>{job.createdAt}<br />
            <b>Notes: </b> {job.description}<br />
          </p>
        </div>
      </div>

      {(job?.applicationCount ?? 0) > 0 && job?.applications && (
        <div>
          <ApplicantList
            applications={job?.applications}
            onAccepted={(appId) => accepted(appId, job._id)}
            onDenied={(appId) => denied(appId, job._id)}
          />
        </div>
      )}
      <div className="d-flex justify-content-end gap-2">
        <form onSubmit={handleRunMatchEngine}>
          <button 
          className="btn no-border-btn btn-info"
          type="submit"
          >
            Run Match Engine
          </button>
        </form>
        {Auth.loggedIn() && job.createdBy._id === Auth.getProfile().data._id && (
          <form onSubmit={handleCancelJob}>
            <button
              className="no-border-btn btn btn-danger"
              type="submit"
            >
              Close Job
            </button>
          </form>
        )}

        <form onSubmit={handleFormSubmit}>
          <button
            className="btn no-border-btn btn-success"
            type="submit"
            disabled={isJobApplyDisabled(job, { admin, applied })}
          >
            Apply
          </button>
        </form>
      </div>

    </div>
  );
};

export default SingleJob;
