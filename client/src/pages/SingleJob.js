import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import ApplicantList from "../components/ApplicantList";

import Auth from "../utils/auth";
import { useQuery } from "@apollo/client";
import { QUERY_JOB, QUERY_ME } from "../utils/queries";
import { useMutation } from "@apollo/client";
import { ADD_APPLICATION, DEACTIVATE_JOB } from "../utils/mutations";

const SingleJob = () => {
  const { id: jobId } = useParams();
  const [addApplication] = useMutation(ADD_APPLICATION);
  const [deactivateJob] = useMutation(DEACTIVATE_JOB);
  const { data: userData } = useQuery(QUERY_ME);

  const admin = userData?.me.admin || "";
  const navigate = useNavigate();

  const { loading, data } = useQuery(QUERY_JOB, {
    variables: { id: jobId },
  });

  const job = data?.job || {};

  if (loading) {
    return <div>Loading...</div>;
  }

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

  const applied = job.applications.find((app) => app._id === userData?.me._id);

  return (
    <div className="text-center single-job-close">
      {Auth.loggedIn()  && (
          <form
            className="flex-row justify-center align-stretch"
            onSubmit={handleDeactivate}
          >
            <div className=" w-100 ">
              <button
                className="no-border-btn btn btn-danger w-100 mb-3 "
                type="submit"
              >
                Close Job Listing
              </button>
            </div>
          </form>
      )}
      <div className="card mb-3">
        <p className="card-header single-job-header">
          <span style={{ fontWeight: 700 }}>{job?.createdBy?.username ?? "N/A"}</span>
          &nbsp;{job.createdAt}
        </p>
        <div className="card-body">
          <p>
          <p className="text-dark job-description">{job.description}</p>
            <hr></hr>
            <b>Date(s): </b>
            {job.dates}
            <br />
            <b>Meeting: </b>
            {job.meeting}
          </p>
          
        </div>
      </div>

      {job.applicationCount > 0  && (
        <div>
          <ApplicantList applications={job.applications} />
        </div>
      )}

      {Auth.loggedIn() && !admin && !applied && (
        <form onSubmit={handleFormSubmit}>
          <button className="btn no-border-btn btn-success col-12 col-md-3" type="submit">
            Apply
          </button>
        </form>
      )}
      {Auth.loggedIn() && !admin && applied && <p>Already Applied!</p>}
    </div>
  );
};

export default SingleJob;
