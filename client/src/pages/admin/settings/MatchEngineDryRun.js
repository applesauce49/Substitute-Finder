import React from "react";
import { useQuery, useLazyQuery } from "@apollo/client";
import { QUERY_MEETINGS } from "../../../utils/graphql/meetings/queries.js";
import { QUERY_MATCH_ENGINE_DRY_RUN, QUERY_JOBS } from "../../../utils/graphql/jobs/queries.js";

export function MatchEngineDryRun() {
  const { data: meetingsData, loading: meetingsLoading } = useQuery(QUERY_MEETINGS);
  const { data: jobsData, loading: jobsLoading } = useQuery(QUERY_JOBS, { 
    variables: { showAll: true } 
  });
  const [
    runDryRun,
    { data: dryRunData, loading: dryRunLoading, error: dryRunError }
  ] = useLazyQuery(QUERY_MATCH_ENGINE_DRY_RUN, { fetchPolicy: "no-cache" });

  const meetings = meetingsData?.meetings ?? [];
  const jobs = jobsData?.jobs ?? [];
  
  // Filter jobs that have applications
  const jobsWithApplications = React.useMemo(() => {
    return jobs.filter(job => job.applications && job.applications.length > 0);
  }, [jobs]);
  
  // Combine meetings and jobs with applications
  const meetingOptions = React.useMemo(() => {
    const meetingItems = meetings.map(meeting => ({
      id: meeting._id,
      label: `${meeting.summary || "(Untitled)"} — ${meeting.updatedAt ? new Date(meeting.updatedAt).toLocaleString() : "Unknown date"}`,
      type: 'meeting'
    }));
    
    const jobItems = jobsWithApplications.map(job => ({
      id: job.meetingSnapshot?._id || job._id,
      label: `${job.meetingSnapshot?.title || "(Untitled)"} — ${job.applications.length} application(s) — ${new Date(job.createdAt).toLocaleString()}`,
      type: 'job'
    }));
    
    return [...meetingItems, ...jobItems];
  }, [meetings, jobsWithApplications]);
  const [selectedMeetingId, setSelectedMeetingId] = React.useState("");

  const handleRun = React.useCallback(() => {
    if (!selectedMeetingId) return;
    runDryRun({ variables: { meetingId: selectedMeetingId } });
  }, [runDryRun, selectedMeetingId]);

  const result = dryRunData?.matchEngineDryRun;

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h2 className="mb-0">Match Engine Dry Run</h2>
          <small className="text-muted">
            Preview how applicants would rank for a meeting without assigning anyone.
          </small>
        </div>
      </div>

      <div className="row g-2 align-items-end mb-3">
        <div className="col-12 col-md-7">
          <label className="form-label">Meeting or Job</label>
          <select
            className="form-select"
            value={selectedMeetingId}
            onChange={(e) => setSelectedMeetingId(e.target.value)}
            disabled={meetingsLoading || jobsLoading || dryRunLoading}
          >
            <option value="">Select a meeting or job…</option>
            {meetingOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-3">
          <button
            className="btn btn-primary w-100"
            onClick={handleRun}
            disabled={!selectedMeetingId || dryRunLoading}
          >
            {dryRunLoading ? "Running…" : "Run Dry Run"}
          </button>
        </div>
      </div>

      {dryRunError && (
        <div className="alert alert-danger">
          Failed to run dry run. Please try again.
        </div>
      )}

      {result && (
        <div className="mt-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <h5 className="mb-0">{result.meetingTitle || "Meeting"}</h5>
              <small className="text-muted">
                Job ID: {result.jobId || "—"} | Constraints: {result.constraintCount}
              </small>
            </div>
            {result.message && (
              <span className="badge text-bg-warning">{result.message}</span>
            )}
          </div>

          <div className="mb-3">
            <h6>Constraints</h6>
            {result.constraints?.length ? (
              <ul className="list-group list-group-flush">
                {result.constraints.map((c) => (
                  <li className="list-group-item px-0" key={c._id}>
                    <strong>{c.name}</strong>{" "}
                    {c.required && (
                      <span className="badge text-bg-danger ms-2">Required</span>
                    )}
                    <span className="text-muted">
                      ({c.fieldKey} {(c.operator || "").toLowerCase()} {c.value})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted">No constraints found for this meeting.</div>
            )}
          </div>

          <div>
            <h6>Applicants</h6>
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Eligible</th>
                    <th>Score</th>
                    <th>Matched</th>
                    <th>Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {result.applicants?.length ? (
                    result.applicants.map((app) => (
                      <tr key={app.applicationId || app.userId}>
                        <td>{app.userName || "Unknown"}</td>
                        <td>{app.eligible ? "Yes" : "No"}</td>
                        <td>{(app.score ?? 0).toFixed(2)}</td>
                        <td
                          title={
                            app.matchedConstraints?.length
                              ? `Matched: ${app.matchedConstraints.join(", ")}`
                              : "No constraints matched"
                          }
                          style={{ cursor: "help" }}
                        >
                          {app.matched}/{app.total}
                        </td>
                        <td>
                          {app.appliedAt
                            ? new Date(app.appliedAt).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-muted">
                        No applications available for this job.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
