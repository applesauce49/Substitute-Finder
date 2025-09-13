import React from 'react';
import { Link } from 'react-router-dom';

const JobList = ({ jobs, title}) => {
  return (
    <div className='job-list-container'>
      <h3 className='list-heading text-center mb-4 mt-2'>{title}</h3>
      {jobs && jobs.length > 0 ? (

        jobs.filter(job => job.active === true)
        .map(job => (
          <div key={job._id} className="card col-12 mb-3">
            <p className="card-header job-list-header">
              <Link
                to={`/profile/${job?.createdBy?.username ?? "N/A"}`}
                style={{ fontWeight: 700 }}
                className="text-dark"
              >
                {job?.createdBy?.username ?? "N/A"}&nbsp;
              </Link>{' '}
              {job.createdAt}
            </p>
            <div className="card-body text-center">
              <Link to={`/job/${job._id}`}>
              <p className='text-dark job-description'>{job.description}</p>
              <hr></hr>
                <p><b>Date(s): </b>{job.dates}<br /><b>Meeting: </b> {job.meeting}<br /></p>
              </Link>
            </div>
          </div>
        ))
     ) : (
      <p>No Jobs Yet</p>
     )
      }
    </div>
  );
};

export default JobList;