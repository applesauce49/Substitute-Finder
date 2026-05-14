// components/JobCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import JobDetails from "./jobDetails";

const ICON_ALIASES = {
  woman: "👩",
  female: "♀️",
  man: "👨",
  male: "♂️",
  group: "👥",
  people: "👥",
  language: "🗣️",
  location: "📍",
  time: "🕒",
  schedule: "📅",
  required: "✅",
  priority: "🎯",
  balance: "⚖️",
  specialty: "🧩",
  home: "🏠",
  communication: "💬",
};

function resolveBadgeIcon(iconValue) {
  const value = (iconValue || "").trim();
  if (!value) return "";

  const aliasKey = value
    .toLowerCase()
    .replace(/^[:\[]+|[:\]]+$/g, "")
    .replace(/\s+/g, "")
    .replace(/_/g, "");

  return ICON_ALIASES[aliasKey] || value;
}

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
  const requirementBadges = Array.isArray(job?.requirementBadges)
    ? job.requirementBadges
    : [];
  const legacyRequirements = Array.isArray(job?.requirements) ? job.requirements : [];
  const normalizedBadges = requirementBadges.length > 0
    ? requirementBadges
    : legacyRequirements.map((name) => ({ name, icon: null }));
  
  console.log("Rendering JobCard for job:", job._id, "Active:", isActive);
  const handleClick = (e) => {
    e.preventDefault();
    if ( onSelect ) onSelect(job);
  };

  return (
    <div key={job._id} className="card col-12 mb-3">
      <p className={headerClass}>{job.meetingSnapshot?.title || "Untitled"}</p>

      <div className="card-body text-center">
          <Link
            to="#"
            onClick={handleClick}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <JobDetails job={job} active={isActive} />
          </Link>

        <div className="mt-3 text-start">
          <h6 className="mb-2">Requirements</h6>
          {normalizedBadges.length > 0 ? (
            <div className="d-flex flex-wrap gap-2">
              {normalizedBadges.map((badge, idx) => (
                (() => {
                  const resolvedIcon = resolveBadgeIcon(badge.icon);
                  const hasIcon = Boolean(resolvedIcon);
                  return (
                <span
                  key={`${job._id}-requirement-${idx}`}
                  className="badge rounded-pill text-bg-light border"
                  title={badge.name}
                  style={{
                    fontSize: hasIcon ? "0.92rem" : "0.7rem",
                    lineHeight: 1,
                    padding: hasIcon ? "0.35rem 0.55rem" : "0.3rem 0.5rem",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {resolvedIcon ? resolvedIcon : badge.name}
                </span>
                  );
                })()
              ))}
            </div>
          ) : (
            <p className="text-muted mb-0">No requirements configured</p>
          )}
        </div>
        {/* {isActive ? (
          <Link
            to="#"
            onClick={handleClick}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <JobDetails job={job} active />
          </Link>
        ) : (
          <JobDetails job={job} />
        )} */}
      </div>
    </div>
  );
}