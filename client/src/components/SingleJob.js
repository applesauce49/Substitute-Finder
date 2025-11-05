import React, { useState } from "react";
import { useParams } from "react-router-dom";
import SingleJobCard from "./SingleJobCard";

const SingleJob = ({ jobId: propJobId, onClose }) => {
 
  return (
    <div className="text-center single-job-close">
      <SingleJobCard jobId={propJobId} onClose={onClose} />
    </div>
  );
};

export default SingleJob;
