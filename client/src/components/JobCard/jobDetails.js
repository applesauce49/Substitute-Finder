// components/JobDetails.jsx
import React from "react";

export default function JobDetails({ job, active = false }) {
  const start = new Date(job.meetingSnapshot?.startDateTime);

  const dateStr = start.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const timeStr = start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <p>
      <b>Date:</b> {dateStr}
      <br />
      <b>Time:</b> {timeStr}
      <br />
      <b>For:</b> {job?.createdBy?.username ?? "N/A"}
      <br />
      {active ? (
        <>
          <b>Notes:</b> {job.description || "—"}
        </>
      ) : (
        <>
          <b>Assigned To:</b> {job.assignedTo?.username ?? "Unassigned"}
        </>
      )}
    </p>
  );
}