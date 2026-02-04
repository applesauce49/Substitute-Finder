import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { QUERY_ELIGIBLE_JOBS_FOR_MATCH_ENGINE } from "../../utils/graphql/jobs/queries";
import { RUN_MATCH_ENGINE_CONFIGURABLE } from "../../utils/graphql/jobs/mutations";
import "./MatchEngineModal.css";

export function MatchEngineModal({ onClose }) {
    const { loading, error, data } = useQuery(QUERY_ELIGIBLE_JOBS_FOR_MATCH_ENGINE);
    const [runMatchEngine, { loading: running }] = useMutation(RUN_MATCH_ENGINE_CONFIGURABLE);
    
    const [selectedJobs, setSelectedJobs] = useState(new Set());
    const [dryRun, setDryRun] = useState(true);
    const [results, setResults] = useState(null);
    const [showResults, setShowResults] = useState(false);

    const jobs = data?.eligibleJobsForMatchEngine || [];
    const eligibleJobs = jobs.filter(job => job.isEligible);

    const handleToggleJob = (jobId) => {
        const newSelected = new Set(selectedJobs);
        if (newSelected.has(jobId)) {
            newSelected.delete(jobId);
        } else {
            newSelected.add(jobId);
        }
        setSelectedJobs(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedJobs.size === eligibleJobs.length) {
            setSelectedJobs(new Set());
        } else {
            setSelectedJobs(new Set(eligibleJobs.map(job => job.jobId)));
        }
    };

    const handleRun = async () => {
        try {
            const jobIds = selectedJobs.size > 0 ? Array.from(selectedJobs) : null;
            const { data } = await runMatchEngine({
                variables: { jobIds, dryRun }
            });
            setResults(data.runMatchEngineConfigurable);
            setShowResults(true);
        } catch (err) {
            console.error("Error running match engine:", err);
            alert(`Error: ${err.message}`);
        }
    };

    const getStatusBadgeClass = (status) => {
        const statusMap = {
            'assigned': 'badge-success',
            'would-assign': 'badge-info',
            'closed': 'badge-secondary',
            'would-close': 'badge-warning',
            'notified': 'badge-info',
            'would-notify': 'badge-info',
            'no-applications': 'badge-warning',
            'no-eligible-applicants': 'badge-warning',
            'too-far-future': 'badge-secondary',
            'assignment-failed': 'badge-danger',
            'error': 'badge-danger',
            'skipped': 'badge-secondary'
        };
        return statusMap[status] || 'badge-secondary';
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content match-engine-modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Loading...</h2>
                        <button className="close-btn" onClick={onClose}>&times;</button>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content match-engine-modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Error</h2>
                        <button className="close-btn" onClick={onClose}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <p className="error-message">Error loading jobs: {error.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (showResults && results) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content match-engine-modal match-engine-results" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Match Engine Results</h2>
                        <button className="close-btn" onClick={onClose}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <div className="results-summary">
                            <h3>
                                {results.dryRun ? "Dry Run Complete" : "Match Engine Complete"}
                            </h3>
                            <p>
                                Processed {results.jobsProcessed} job(s), evaluated {results.totalEvaluated} applicant(s)
                            </p>
                            {results.dryRun && (
                                <p className="dry-run-notice">
                                    <strong>Note:</strong> This was a dry run. No changes were made.
                                </p>
                            )}
                        </div>

                        <div className="results-table-container">
                            <table className="results-table">
                                <thead>
                                    <tr>
                                        <th>Meeting</th>
                                        <th>Status</th>
                                        <th>Details</th>
                                        <th>Applicants</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.jobResults.map((result) => (
                                        <tr key={result.jobId}>
                                            <td>{result.meetingTitle}</td>
                                            <td>
                                                <span className={`badge ${getStatusBadgeClass(result.status)}`}>
                                                    {result.status.replace(/-/g, ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                {result.message}
                                                {result.assignedToName && (
                                                    <div className="assigned-info">
                                                        → {result.assignedToName}
                                                        {result.winnerScore && (
                                                            <span className="score"> (score: {result.winnerScore.toFixed(2)})</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {result.applicantCount > 0 ? (
                                                    <>
                                                        {result.eligibleCount} / {result.applicantCount} eligible
                                                    </>
                                                ) : (
                                                    <span className="text-muted">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="modal-footer">
                        {results.dryRun && results.jobResults.some(r => r.status === 'would-assign') && (
                            <button 
                                className="btn btn-primary"
                                onClick={() => {
                                    setShowResults(false);
                                    setDryRun(false);
                                }}
                            >
                                Run For Real
                            </button>
                        )}
                        <button className="btn btn-secondary" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content match-engine-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Run Match Engine</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <div className="modal-body">
                    <div className="match-engine-options">
                        <div className="option-group">
                            <label className="dry-run-toggle">
                                <input
                                    type="checkbox"
                                    checked={dryRun}
                                    onChange={(e) => setDryRun(e.target.checked)}
                                />
                                <span className="toggle-label">
                                    Dry Run Mode
                                    <small className="help-text">Preview results without making changes</small>
                                </span>
                            </label>
                        </div>

                        <div className="job-summary">
                            <div className="summary-item">
                                <strong>Total Jobs:</strong> {jobs.length}
                            </div>
                            <div className="summary-item">
                                <strong>Eligible Jobs:</strong> {eligibleJobs.length}
                            </div>
                            <div className="summary-item">
                                <strong>Selected:</strong> {selectedJobs.size === 0 ? 'All eligible' : selectedJobs.size}
                            </div>
                        </div>
                    </div>

                    <div className="job-selection">
                        <div className="selection-header">
                            <h3>Select Jobs to Process</h3>
                            <button 
                                className="btn btn-sm btn-outline"
                                onClick={handleSelectAll}
                            >
                                {selectedJobs.size === eligibleJobs.length ? 'Deselect All' : 'Select All Eligible'}
                            </button>
                        </div>

                        {eligibleJobs.length === 0 ? (
                            <p className="no-jobs-message">No eligible jobs found.</p>
                        ) : (
                            <div className="job-list">
                                {jobs.map((job) => {
                                    const isEligible = job.isEligible;
                                    const isSelected = selectedJobs.has(job.jobId);
                                    
                                    return (
                                        <div 
                                            key={job.jobId} 
                                            className={`job-item ${!isEligible ? 'job-item-disabled' : ''} ${isSelected ? 'job-item-selected' : ''}`}
                                        >
                                            <label className="job-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleJob(job.jobId)}
                                                    disabled={!isEligible}
                                                />
                                                <div className="job-details">
                                                    <div className="job-title">{job.meetingTitle}</div>
                                                    <div className="job-meta">
                                                        <span className="job-date">{formatDateTime(job.startDateTime)}</span>
                                                        <span className="job-creator">by {job.createdBy}</span>
                                                        <span className="job-applications">
                                                            {job.applicationCount} application{job.applicationCount !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                    {!isEligible && (
                                                        <div className="job-status-reason">
                                                            {job.meetingIsPast && <span className="badge badge-warning">Past</span>}
                                                            {job.meetingIsTooFarFuture && <span className="badge badge-secondary">Too far future</span>}
                                                            {!job.meetingIsPast && !job.meetingIsTooFarFuture && job.applicationCount === 0 && (
                                                                <span className="badge badge-info">Already notified, no apps</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button 
                        className="btn btn-secondary" 
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button 
                        className={`btn ${dryRun ? 'btn-info' : 'btn-primary'}`}
                        onClick={handleRun}
                        disabled={running || eligibleJobs.length === 0}
                    >
                        {running ? 'Running...' : (dryRun ? 'Preview Results' : 'Run Match Engine')}
                    </button>
                </div>
            </div>
        </div>
    );
}
