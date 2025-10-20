import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SingleJob from '../../pages/SingleJob.js';

const JobList = ({ jobs, title, onRefetch, children }) => {
  const [selectedJob, setSelectedJob] = useState(null);

  return (
    <div className='job-list-container'>
      <h3 className='list-heading text-center mb-4 mt-2'>{title}</h3>
      {children && <div className="joblist-actions mb-3">{children}</div>}
      {jobs && jobs.length > 0 ? (

        jobs.filter(job => job.active === true || true)
          .map(job => (
            <div
              key={job._id}
              className="card col-12 mb-3"
            >
              <p className={`card-header ${job.active ? "" : "bg-success text-white"} job-list-header`}>
                {job?.meetingSnapshot?.title || "Untitled" }
              </p>

              <div className={`card-body text-center`}>
                {job.active ? (
                  <Link
                    to="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedJob(job);
                    }}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <p>
                      <b>Date:</b> {new Date(job.meetingSnapshot?.startDateTime).toLocaleString()}<br />
                      <b>For:</b> {job?.createdBy?.username ?? "N/A"}<br />
                      <b>Posted:</b> {new Date(job.createdAt).toLocaleString()}<br />
                      <b>Applications:</b> {job.applicationCount ?? 0}
                    </p>
                  </Link>
                ) : (
                  <p>
                    <b>Date:</b> {new Date(job.meetingSnapshot?.startDateTime).toLocaleString()}<br />
                    <b>For:</b> {job?.createdBy?.username ?? "N/A"}<br />
                    <b>Assigned To:</b> {job.assignedTo?.username ?? "Unassigned"}
                  </p>
                )}
              </div>
            </div>
          ))
      ) : (
        <p>No Jobs Yet</p>
      )}

      {/* Modal overlay */}
      {selectedJob && (
        <div className="modal show" style={{ display: "block" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{title} Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedJob(null)}
                ></button>
              </div>
              <div className="modal-body">
                <SingleJob jobId={selectedJob._id}
                  onClose={() => {
                    setSelectedJob(null);
                    onRefetch(); // ✅ trigger refresh after closing modal
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobList;