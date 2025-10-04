import React from "react";

const ApplicantList = ({ applications, onAccepted, onDenied }) => {
  return (
    <>
      <h3 className="applicants">Applicants</h3>
      <div className="application-cards">
        {applications.map((application) => (
          <div className="card mr-2 mb-2" key={application._id}>
            <h6 className="card-header">
              {application.user?.username ?? "N/A"}
            </h6>
            <p className="m-2">
              <b>Applied: </b>{application.appliedAt}<br />
            </p>
            <div className="d-flex justify-content-center gap-2 mb-2 mr-2">

              <button
                type="button"
                className="btn btn-success"
                onClick={onAccepted}
              >
                Accept
              </button>
              <button type="button" className="btn btn-secondary" onClick={onDenied}>
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ApplicantList;
