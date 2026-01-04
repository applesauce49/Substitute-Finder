import React from "react";

const ApplicantList = ({ applications, onDenied, onAssigned, user }) => {
  return (
    <>
      <h4 className="applicants">Applicants</h4>
      <div className="application-cards">
        {applications.map((application) => {
          const isCurrentUser = user?._id === application.user?._id || user?.admin;
          const isAdmin = user?.admin;
          console.log("Rendering application for user:", application.user?.username, "Current user is admin:", user?.admin);
          return (
            <div className="card mr-2 mb-2" key={application._id}>
              <h6 className="card-header">
                {application.user?.username ?? "N/A"}
              </h6>
              <p className="m-2">
                <b>Applied: </b>{new Date(application.appliedAt).toLocaleString()}<br />
              </p>

              {(isCurrentUser || isAdmin) && (
                <div className="d-flex justify-content-center gap-2 mb-2 mr-2">
                  {isCurrentUser && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => onDenied?.(application._id)}
                    >
                      Cancel
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => onAssigned?.(application._id)}
                    >
                      Assign
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ApplicantList;