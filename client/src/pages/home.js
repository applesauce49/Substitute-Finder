import React from 'react';
import JobList from '../components/JobList';
import JobForm from '../components/JobForm';

import Auth from '../utils/auth';
import { useQuery } from '@apollo/client';
import { QUERY_JOBS, QUERY_ME } from '../utils/queries';

const Home = () => {
  const { data: userData } = useQuery(QUERY_ME);
  console.log("Username: ", userData?.me?.username, "myJobs: ", userData?.me?.jobs);

  const { loading, data, error, refetch } = useQuery(QUERY_JOBS);
  console.log("loading:", loading, "data:", data, "error:", error);

  const jobs = data?.jobs || [];

  // // const admin = userData?.me.admin || "";
  // const myJobs = userData?.me.jobs || [];
  const userId = Auth.getProfile()?.data?._id;

  const assignedJobs = jobs.filter(job => job.assignedTo?._id === userId);
  const availableJobs = jobs.filter(job => job.active && !job.assignedTo);

  const loggedIn = Auth.loggedIn();

  return (
    <main>
      <div className="flex-row justify-space-between">
        {loggedIn && (
          <div className={`col-12 col-lg-4 mb-3`}>
            <JobForm onRefetch={refetch} />
          </div>
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
                jobs={assignedJobs}
                title="Upcoming Jobs"
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