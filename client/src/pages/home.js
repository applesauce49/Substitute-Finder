import React, { useState } from 'react';
import JobList from '../components/JobList';
import JobForm from '../components/JobForm';

import Auth from '../utils/auth';
import { useQuery } from '@apollo/client';
import { QUERY_JOBS, QUERY_ME } from '../utils/queries';

const Home = () => {
  // const { data: userData } = useQuery(QUERY_ME);
  const { loading, data, refetch } = useQuery(QUERY_JOBS);

  const jobs = data?.jobs || [];

  console.log('Jobs data:', data);

  // // const admin = userData?.me.admin || "";
  // const myJobs = userData?.me.jobs || [];
  const userId = Auth.getProfile()?.data?._id;

  const myCreatedJobs = jobs.filter(job => job.createdBy?._id === userId);
  const myAssignedJobs = jobs.filter(job => job.assignedTo?._id === userId);
  const availableJobs = jobs.filter(job => job.createdBy?._id !== userId && job.active && !job.assignedTo);

  const loggedIn = Auth.loggedIn();

  const [showForm, setShowForm] = useState(false);

  return (
    <main>
      <div className="flex-row justify-space-between">
        {loggedIn && (
          <div className={`col-12 col-lg-3 mb-3`}>
            {/* <JobForm onRefetch={refetch} /> */}
            {loading ? (
              <div>Loading...</div>
            ) : (
              <JobList
                jobs={myCreatedJobs}
                title="My Jobs"
                onRefetch={refetch}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  Request a Sub
                </button>
              </JobList>

            )}
          </div>
        )}

        {showForm && (
          <>
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1040 }}
            onClick={() => setShowForm(false)} // closes when clicking outside
          />
          <div 
            className="modal show" 
            style={{ display: "block", zIndex:1050 }}
            tabIndex="-1"
            role="dialog"
          >
            <div className="modal-dialog modal-md">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Request a Sub</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowForm(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <JobForm
                    onRefetch={() => {
                      refetch();
                      setShowForm(false);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          </>
        )}

        {loggedIn && (
          <div className={`col-12 col-lg-3 mb-3`}>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <JobList
                jobs={availableJobs}
                title="Available Jobs"
                onRefetch={refetch}
              />
            )}
          </div>
        )}
        {loggedIn && (
          <div id="job-list" className={`col-12 col-lg-3 mb-3`}>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <JobList
                jobs={myAssignedJobs}
                title="Assigned Jobs"
              />
            )}
          </div>
        )}
      </div>
      {!loggedIn && (
        <div id='welcome-container'>
          <div>
            <h1 className='welcome text-center mt-5 mb-0'><span>Welcome!</span></h1>
          </div>
          <div>
            <p className='text-center welcome-sub mt-0'>log in or sign up to get started</p>
          </div>
        </div>
      )}

    </main >
  );
};

export default Home;