import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SingleJob from '../../pages/SingleJob.js';

const JobList = ({ jobs, title, onRefetch }) => {

  const [selectedJob, setSelectedJob] = useState(null);

  return (
    <div className='job-list-container'>
      <h3 className='list-heading text-center mb-4 mt-2'>{title}</h3>
      {jobs && jobs.length > 0 ? (

        jobs.filter(job => job.active === true)
          .map(job => (
            <div key={job._id} className="card col-12 mb-3">
              <p className="card-header job-list-header">
                {job.meeting.title}
              </p>
              <div className="card-body text-center">
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedJob(job)
                  }}
                >
                  <p>
                    <b>Date: </b>{job.dates}<br />
                    {job?.createdBy?.username ?? "N/A"}&nbsp;
                    <b>Posted: </b>{job.createdAt}<br />
                    <b>Applications: </b>{job.applicationCount}

                    {/* <b>Notes: </b> {job.description}<br /> */}
                  </p>
                </Link>
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
                <h5 className="modal-title">Available Job Details</h5>
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