import React from "react";
import { useQuery, useLazyQuery } from "@apollo/client";
import { QUERY_MEETINGS } from "../../../utils/graphql/meetings/queries.js";
import { QUERY_MATCH_ENGINE_DRY_RUN, QUERY_MATCH_ENGINE_JOB_DRY_RUN, QUERY_JOBS } from "../../../utils/graphql/jobs/queries.js";
import "./MatchEngineDryRun.css";

function DryRunResults({ result, loading, error }) {
  // Log errors to console for debugging
  React.useEffect(() => {
    if (error) {
      console.error('Match Engine Dry Run Error:', error);
      console.error('GraphQL Error Details:', {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
        extraInfo: error.extraInfo
      });
    }
  }, [error]);

  if (loading) return (
    <div className="loading-container">
      <div className="text-center">
        <div className="spinner-border" role="status" aria-hidden="true"></div>
        <div className="mt-2 text-muted">Running match engine analysis...</div>
      </div>
    </div>
  );
  
  if (error) {
    return (
      <div className="alert alert-danger">
        <div className="d-flex align-items-start">
          <i className="bi bi-exclamation-triangle-fill me-2 mt-1 flex-shrink-0"></i>
          <div className="flex-grow-1">
            <strong>Match Engine Error</strong>
            <div className="mt-2">
              <strong>Message:</strong> {error.message || 'Unknown error occurred'}
            </div>
            {error.graphQLErrors && error.graphQLErrors.length > 0 && (
              <div className="mt-2">
                <strong>Details:</strong>
                <ul className="mb-0 mt-1">
                  {error.graphQLErrors.map((err, index) => (
                    <li key={index}>{err.message}</li>
                  ))}
                </ul>
              </div>
            )}
            {error.networkError && (
              <div className="mt-2">
                <strong>Network Error:</strong> {error.networkError.message}
              </div>
            )}
            <div className="mt-3">
              <small className="text-muted">
                Check the browser console for more detailed error information.
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!result) return null;

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-0">{result.meetingTitle || "Meeting"}</h5>
          <small className="text-muted">
            Job ID: {result.jobId || "—"} | Constraints: {result.constraintCount}
            {result.workloadBalanceWindowDays && (
              <> | Workload Window: {result.workloadBalanceWindowDays} days</>
            )}
          </small>
          {result.workloadBalanceWindowDays && (
            <div className="mt-1">
              <small className="badge text-bg-info me-2">
                📊 Workload Balance Analysis Active
              </small>
              <small className="text-muted">
                Recent sub jobs within {result.workloadBalanceWindowDays} days are factored into ranking
              </small>
            </div>
          )}
        </div>
        {result.message && (
          <span className="badge text-bg-warning">{result.message}</span>
        )}
      </div>

      <div className="row">
        <div className="col-md-4">
          <h6>Constraints</h6>
          {result.constraints?.length ? (
            <ul className="list-group list-group-flush">
              {result.constraints.map((c) => (
                <li className="list-group-item px-0" key={c._id}>
                  <strong>{c.name}</strong>{" "}
                  {c.required && (
                    <span className="badge text-bg-danger ms-2">Required</span>
                  )}
                  <br />
                  <small className="text-muted">
                    ({c.fieldKey} {(c.operator || "").toLowerCase()} {c.value})
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted">No constraints found for this meeting.</div>
          )}
        </div>
        
        <div className="col-md-8">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6>Applicants ({result.applicants?.length || 0})</h6>
            {result.workloadBalanceWindowDays && (
              <div className="d-flex gap-2">
                <small className="text-muted">
                  📊 Workload Analysis:
                </small>
                <small className="badge text-bg-light text-dark">
                  {result.applicants?.filter(app => (app.recentSubJobs ?? 0) === 0).length || 0} with 0 recent subs
                </small>
                <small className="badge text-bg-light text-dark">
                  {result.applicants?.filter(app => (app.recentSubJobs ?? 0) >= 1).length || 0} with 1+ recent subs
                </small>
              </div>
            )}
          </div>
          <div className="table-responsive">
            <table className="table table-sm table-striped align-middle">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Constraints</th>
                  {result.workloadBalanceWindowDays && (
                    <th title={`Sub jobs within last ${result.workloadBalanceWindowDays} days (used in workload scoring)`}>
                      Recent Subs 📊
                    </th>
                  )}
                  <th>Meetings Hosted</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {result.applicants?.length ? (
                  result.applicants.map((app, index) => (
                    <tr key={app.applicationId || app.userId} className={index === 0 ? "table-success" : ""}>
                      <td>
                        <strong>{app.userName || "Unknown"}</strong>
                        {!app.isApplicant && <small className="text-muted d-block">(Non-applicant)</small>}
                      </td>
                      <td>
                        <span className={`badge ${app.eligible ? 'text-bg-success' : 'text-bg-danger'}`}>
                          {app.eligible ? "Eligible" : "Disqualified"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex flex-column align-items-start">
                          <strong>{(app.score ?? 0).toFixed(2)}</strong>
                          {result.workloadBalanceWindowDays && app.recentSubScore !== null && (
                            <small className="text-muted" title="Workload balance adjustment">
                              WL Adj: {app.recentSubScore.toFixed(2)}
                            </small>
                          )}
                        </div>
                      </td>
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
                      {result.workloadBalanceWindowDays && (
                        <td className="text-center">
                          <span 
                            className={`badge ${
                              app.recentSubJobs === 0 ? 'text-bg-success' :
                              app.recentSubJobs === 1 ? 'text-bg-warning' :
                              'text-bg-danger'
                            }`}
                            title={`${app.recentSubJobs} substitute jobs in the last ${result.workloadBalanceWindowDays} days`}
                          >
                            {app.recentSubJobs ?? 0}
                          </span>
                          {app.recentSubScore !== null && (
                            <div className="mt-1">
                              <small className="text-muted">
                                Score: {app.recentSubScore.toFixed(2)}
                              </small>
                            </div>
                          )}
                        </td>
                      )}
                      <td>
                        <span className="badge text-bg-secondary">
                          {app.meetingsHosted || 0}
                        </span>
                      </td>
                      <td>
                        {app.appliedAt
                          ? new Date(app.appliedAt).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={result.workloadBalanceWindowDays ? 7 : 6} className="text-muted text-center">
                      No applicants available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActiveJobsTab() {
  const { data: jobsData, loading: jobsLoading } = useQuery(QUERY_JOBS, { 
    variables: { showAll: false } // Only active jobs
  });
  const [
    runJobDryRun,
    { data: dryRunData, loading: dryRunLoading, error: dryRunError }
  ] = useLazyQuery(QUERY_MATCH_ENGINE_JOB_DRY_RUN, { fetchPolicy: "no-cache" });

  const [selectedJobId, setSelectedJobId] = React.useState("");

  const activeJobs = React.useMemo(() => {
    return (jobsData?.jobs ?? []).filter(job => job.active && !job.assignedTo);
  }, [jobsData]);

  const handleRun = React.useCallback(() => {
    if (!selectedJobId) return;
    console.log('Running job dry run for job ID:', selectedJobId);
    runJobDryRun({ variables: { jobId: selectedJobId } })
      .then(result => {
        console.log('Job dry run completed successfully:', result);
      })
      .catch(error => {
        console.error('Job dry run failed:', error);
      });
  }, [runJobDryRun, selectedJobId]);

  if (jobsLoading) return (
    <div className="loading-container">
      <div className="text-center">
        <div className="spinner-border" role="status" aria-hidden="true"></div>
        <div className="mt-2 text-muted">Loading active jobs...</div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="tab-description">
        <strong>🎯 Active Job Analysis:</strong> View match engine results for currently active substitute jobs that have applications.
        This shows how the system would rank actual applicants for real substitute opportunities.
      </div>

      <div className="enhanced-form-controls">
        <div className="row g-3 align-items-end mb-4">
          <div className="col-12 col-md-8">
            <label className="form-label fw-semibold">Select Active Job</label>
            <select
              className="form-select"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              disabled={dryRunLoading}
            >
              <option value="">Choose an active substitute job…</option>
              {activeJobs.map((job) => (
                <option key={job._id} value={job._id}>
                  📅 {job.meetingSnapshot?.title || "(Untitled)"} — 
                  👥 {job.applicationCount || 0} applications — 
                  ⏰ {job.meetingSnapshot?.startDateTime ? 
                    new Date(job.meetingSnapshot.startDateTime).toLocaleString() : 
                    "Date TBD"
                  }
                </option>
              ))}
            </select>
            {activeJobs.length === 0 && (
              <small className="text-muted mt-1 d-block">
                <i className="bi bi-info-circle me-1"></i>
                No active jobs with applications found.
              </small>
            )}
          </div>
          <div className="col-12 col-md-4">
            <button
              className="btn btn-primary w-100"
              onClick={handleRun}
              disabled={!selectedJobId || dryRunLoading}
            >
              {dryRunLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Analyzing...
                </>
              ) : (
                <>
                  <i className="bi bi-play-circle me-2"></i>
                  Run Job Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <DryRunResults 
        result={dryRunData?.matchEngineJobDryRun}
        loading={dryRunLoading}
        error={dryRunError}
      />
    </div>
  );
}

function AllMeetingsTab() {
  const { data: meetingsData, loading: meetingsLoading } = useQuery(QUERY_MEETINGS);
  const [
    runMeetingDryRun,
    { data: dryRunData, loading: dryRunLoading, error: dryRunError }
  ] = useLazyQuery(QUERY_MATCH_ENGINE_DRY_RUN, { fetchPolicy: "no-cache" });

  const [selectedMeetingId, setSelectedMeetingId] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredMeetings = React.useMemo(() => {
    const meetings = meetingsData?.meetings ?? [];
    if (!searchTerm) return meetings;
    
    const term = searchTerm.toLowerCase();
    return meetings.filter(meeting => 
      (meeting.summary || "").toLowerCase().includes(term) ||
      (meeting.description || "").toLowerCase().includes(term)
    );
  }, [meetingsData, searchTerm]);

  const handleRun = React.useCallback(() => {
    if (!selectedMeetingId) return;
    console.log('Running meeting dry run for meeting ID:', selectedMeetingId);
    runMeetingDryRun({ variables: { meetingId: selectedMeetingId } })
      .then(result => {
        console.log('Meeting dry run completed successfully:', result);
      })
      .catch(error => {
        console.error('Meeting dry run failed:', error);
      });
  }, [runMeetingDryRun, selectedMeetingId]);

  if (meetingsLoading) return (
    <div className="loading-container">
      <div className="text-center">
        <div className="spinner-border" role="status" aria-hidden="true"></div>
        <div className="mt-2 text-muted">Loading meetings...</div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="tab-description">
        <strong>📋 Meeting Constraint Testing:</strong> Test constraint matching against any meeting (regardless of date) to see how users would rank.
        This helps you validate constraint configurations and understand user eligibility.
      </div>

      <div className="enhanced-form-controls">
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold">Search Meetings</label>
            <div className="position-relative">
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Search by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold">Select Meeting</label>
            <select
              className="form-select"
              value={selectedMeetingId}
              onChange={(e) => setSelectedMeetingId(e.target.value)}
              disabled={dryRunLoading}
            >
              <option value="">Choose a meeting to analyze…</option>
              {filteredMeetings.map((meeting) => (
                <option key={meeting._id} value={meeting._id}>
                  📅 {meeting.summary || "(Untitled)"} — 
                  🔧 {meeting.constraintGroups?.length || 0} constraint groups — 
                  📝 {meeting.updatedAt ? new Date(meeting.updatedAt).toLocaleDateString() : "Unknown date"}
                </option>
              ))}
            </select>
            {filteredMeetings.length === 0 && searchTerm && (
              <small className="text-muted mt-1 d-block">
                <i className="bi bi-search me-1"></i>
                No meetings match your search criteria.
              </small>
            )}
          </div>
          <div className="col-12 col-md-2">
            <label className="form-label">&nbsp;</label>
            <button
              className="btn btn-primary w-100 d-block"
              onClick={handleRun}
              disabled={!selectedMeetingId || dryRunLoading}
            >
              {dryRunLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Running...
                </>
              ) : (
                <>
                  <i className="bi bi-play-circle me-1"></i>
                  Test
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <DryRunResults 
        result={dryRunData?.matchEngineDryRun}
        loading={dryRunLoading}
        error={dryRunError}
      />
    </div>
  );
}

export function MatchEngineDryRun() {
  const [activeTab, setActiveTab] = React.useState("jobs");

  return (
    <div className="mb-4">
      <div className="tab-section-header">
        <div>
          <h2 className="mb-0 d-flex align-items-center">
            <i className="bi bi-gear-fill me-2 text-primary"></i>
            Match Engine Dry Run
          </h2>
          <small className="text-muted">
            Preview and test how applicants would rank without making any actual assignments.
          </small>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <ul className="nav nav-tabs match-engine-tabs">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "jobs" ? "active" : ""}`}
            onClick={() => setActiveTab("jobs")}
            data-tab="jobs"
          >
            Active Jobs
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "meetings" ? "active" : ""}`}
            onClick={() => setActiveTab("meetings")}
            data-tab="meetings"
          >
            All Meetings
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "jobs" && <ActiveJobsTab />}
        {activeTab === "meetings" && <AllMeetingsTab />}
      </div>
    </div>
  );
}