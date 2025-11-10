// components/JobCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import JobDetails from "./jobDetails";

export default function JobCard({ job, onSelect }) {
  const isActive = job.active;
  const headerClass = `card-header ${isActive ? "bg-info" : "bg-success text-white"} job-list-header`;

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