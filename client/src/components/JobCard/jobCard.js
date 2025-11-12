// components/JobCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import JobDetails from "./jobDetails";

function getJobHeaderColor(job) {

  if (!job.active) {
    return "bg-success text-white";
  }

  if (!job?.meetingSnapshot?.startDateTime) return "";

  const start = new Date(job.meetingSnapshot.startDateTime);
  const now = new Date();
  const diffMs = start - now; // milliseconds difference
  const diffHours = diffMs / (1000 * 60 * 60); // convert to hours

  if (diffHours <= 24 && diffHours >= 0) {
    return "bg-danger text-white";
  } else if (diffHours <= 36 && diffHours >= 0) {
    return "bg-warning text-dark";
  } else {
    return "bg-info";
  }
}

export default function JobCard({ job, onSelect }) {
  const isActive = job.active;
  const headerClass = `card-header job-list-header ${getJobHeaderColor(job)}`;
  
  console.log("Rendering JobCard for job:", job._id, "Active:", isActive);
  const handleClick = (e) => {
    e.preventDefault();
    if (onSelect && isActive) onSelect(job);
  };

  return (
    <div key={job._id} className="card col-12 mb-3">
      <p className={headerClass}>{job.meetingSnapshot?.title || "Untitled"}</p>

      <div className="card-body text-center">
        {isActive ? (
          <Link
            to="#"
            onClick={handleClick}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <JobDetails job={job} active />
          </Link>
        ) : (
          <JobDetails job={job} />
        )}
      </div>
    </div>
  );
}