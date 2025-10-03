import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import ApplicantList from "../components/ApplicantList";

import Auth from "../utils/auth";
import { useQuery } from "@apollo/client";
import { QUERY_JOB, QUERY_ME } from "../utils/queries";
import { useMutation } from "@apollo/client";
import { ADD_APPLICATION, DEACTIVATE_JOB } from "../utils/mutations";
import { isJobApplyDisabled } from "../utils/jobHelpers";

const SingleJob = ({ jobId: propJobId }) => {
  const { id: routeJobId } = useParams();
  const jobId = propJobId || routeJobId;
  const [addApplication] = useMutation(ADD_APPLICATION);
  const [deactivateJob] = useMutation(DEACTIVATE_JOB);
  const { data: userData } = useQuery(QUERY_ME);

  const admin = userData?.me.admin || "";
  const navigate = useNavigate();

  const { loading, data, error } = useQuery(QUERY_JOB, {
    variables: { id: jobId },
    skip: !jobId,
  });

  if (!jobId) return <p>No Job ID Provided</p>;
  if (error) return <p>Error loading job.</p>;
  if (loading) return <div>Loading...</div>;

  const job = data?.job || {};

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    try {
      await addApplication({
        variables: { jobId },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeactivate = async (event) => {
    event.preventDefault();

    try {
      await deactivateJob({
        variables: { jobId: jobId, active: false },
      });
    } catch (e) {
      console.error(e);
    }
    navigate("/");
  };

  const applied = job?.applications?.find((app) => app._id === userData?.me._id);

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
          <ApplicantList applications={job.applications} />
        </div>
      )}
      <div className="d-flex justify-content-end gap-2">
        {Auth.loggedIn() && job.createdBy._id === Auth.getProfile().data._id && (
          <form onSubmit={handleDeactivate}>
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
