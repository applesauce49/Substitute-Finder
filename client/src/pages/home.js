import React from 'react';
import JobList from '../components/JobList';
import JobForm from '../components/JobForm';

import Auth from '../utils/auth';
import { useQuery } from '@apollo/client';
import { QUERY_JOBS, QUERY_ME } from '../utils/queries';

const Home = () => {
  const { loading, data } = useQuery(QUERY_JOBS);
  const { data: userData } = useQuery(QUERY_ME);
  const jobs = data?.jobs || [];
  const admin = userData?.me.admin || "";
  const myJobs = userData?.me.jobs || [];

  const loggedIn = Auth.loggedIn();

  return (
    <main>
      <div className="flex-row justify-space-between">
        {loggedIn && (
          <div className={`col-12 col-lg-3 mb-3`}>
            <JobForm />
          </div>
        )}
        {loggedIn && (
          <div className={`col-12 col-lg-3 mb-3`}>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <JobList
                jobs={jobs.filter(
                  job => job.createdBy && job.createdBy._id !== userData?.me?._id
                )}
                title="Available Jobs"
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
                jobs={myJobs}
                title="My Jobs"
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