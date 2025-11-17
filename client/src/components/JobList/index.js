import React, { useState } from 'react';
import SingleJob from '../SingleJob.js';
import JobCard from '../JobCard/jobCard.js';

const JobList = ({me, jobs, title, onRefetch, children }) => {
  const [selectedJob, setSelectedJob] = useState(null);

  return (
    <div className='job-list-container'>
      <h3 className='list-heading text-center mb-4 mt-2'>{title}</h3>
      {children && <div className="joblist-actions mb-3">{children}</div>}

      {jobs && jobs.length > 0 ? (

        jobs
          // .filter(job => job.active === true)
          .map(job => (
            <JobCard key={job._id} job={job} onSelect={setSelectedJob} />
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
                <SingleJob me={me} jobId={selectedJob._id}
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