import React from "react";
import SingleJobCard from "./SingleJobCard";

const SingleJob = ({me, jobId: propJobId, onClose }) => {
 
  return (
    <div className="text-center single-job-close">
      <SingleJobCard me={me} jobId={propJobId} onClose={onClose} />
    </div>
  );
};

export default SingleJob;
