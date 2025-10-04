import React from "react";
import { useParams } from "react-router-dom";

import ApplicantList from "../components/ApplicantList";

import Auth from "../utils/auth";
import { useQuery } from "@apollo/client";
import { QUERY_JOB, QUERY_ME } from "../utils/queries";
import { useMutation } from "@apollo/client";
import { APPLY_FOR_JOB, CANCEL_JOB } from "../utils/mutations";
import { isJobApplyDisabled } from "../utils/jobHelpers";

const SingleJob = ({ jobId: propJobId, onClose }) => {
  const { id: routeJobId } = useParams();
  const jobId = propJobId || routeJobId;
  const [applyForJob] = useMutation(APPLY_FOR_JOB);
  const [cancelJob] = useMutation(CANCEL_JOB);
  const { data: userData } = useQuery(QUERY_ME);

  const admin = userData?.me.admin || "";

  const { loading, data, error } = useQuery(QUERY_JOB, {
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
      await applyForJob({variables: { jobId }});
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  const handleCancelJob = async (event) => {
    event.preventDefault();

    console.log("Cancelling job ", jobId);
    try {
      await cancelJob({variables: { jobId: jobId }});
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  const applied = job?.applications?.find((app) => app._id === userData?.me._id);

  const accepted = () => { console.log("Application Accepted")};
  const denied = () => { console.log("Application DENIED.")};

  return (
    <div className="text-center single-job-close">
      <div className="card mb-3">
        <p className="card-header single-job-header">
          {job.meeting.title}
        </p>
        <div className="card-body">
          <p>
            <b>Date: </b>{job.dates}<br />
            <p className="text-dark">{job?.createdBy?.username ?? "N/A"}</p>
            <b>Posted: </b>{job.createdAt}<br />
            <b>Notes: </b> {job.description}<br />
          </p>
        </div>
      </div>

      {(job?.applicationCount ?? 0) > 0 && job?.applications && (
        <div>
          <ApplicantList applications={job?.applications} onAccepted={accepted} onDenied={denied} />
        </div>
      )}
      <div className="d-flex justify-content-end gap-2">
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
