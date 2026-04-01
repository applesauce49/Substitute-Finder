import React, { useMemo } from "react";
import {
  FaCheckCircle,
  FaClipboardList,
  FaCalendar,
  FaClock,
  FaExclamationCircle,
} from "react-icons/fa";
import "./MatchProfileCard.css";

/**
 * MatchProfileCard
 * Displays match engine readiness score, profile completeness, and scoring factors breakdown
 *
 * Props:
 * - user: User object with attributes { key, value }
 * - attributeDefs: Array of UserAttributeDefinition objects with { key, label, userEditable, ... }
 * - stats: myJobStats object { assignedCount, totalMeetingsHosted, ... }
 * - onEditProfile: Callback when "Edit Profile" is clicked
 */
export function MatchProfileCard({ user = {}, attributeDefs = [], stats = {}, onEditProfile }) {
  // Calculate profile completeness
  const { completenessPercent, unfilledDefs } = useMemo(() => {
    const userAttrKeys = new Set((user.attributes || []).map((a) => a.key));
    const editableDefs = attributeDefs.filter((def) => def.userEditable);

    if (editableDefs.length === 0) {
      return { completenessPercent: 100, unfilledDefs: [] };
    }

    const filledCount = editableDefs.filter((def) =>
      userAttrKeys.has(def.key)
    ).length;

    const unfilled = editableDefs.filter(
      (def) => !userAttrKeys.has(def.key)
    );

    const percent = Math.round((filledCount / editableDefs.length) * 100);
    return { completenessPercent: percent, unfilledDefs: unfilled };
  }, [user.attributes, attributeDefs]);

  // Determine workload level based on meetings hosted
  const getWorkloadLevel = (meetingCount) => {
    if (meetingCount < 10) return { level: "Low", color: "success" };
    if (meetingCount < 30) return { level: "Medium", color: "warning" };
    return { level: "High", color: "danger" };
  };

  const workloadInfo = getWorkloadLevel(stats.totalMeetingsHosted || 0);

  // Calculate success rate safely
  const successRate = useMemo(() => {
    if (!stats.appliedCount || stats.appliedCount === 0) {
      return null;
    }
    return Math.round((stats.assignedCount / stats.appliedCount) * 100);
  }, [stats.appliedCount, stats.assignedCount]);

  return (
    <div className="match-profile-card mt-4">
      {/* Match Readiness Score */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light border-0 py-3">
          <h5 className="mb-0 d-flex align-items-center">
            <FaCheckCircle className="me-2 text-primary" />
            Match Readiness Score
          </h5>
        </div>

        <div className="card-body">
          <div className="match-readiness-container mb-4">
            <div className="readiness-score">
              <div className="readiness-percent">{completenessPercent}%</div>
              <div className="readiness-label">Complete</div>
            </div>

            <div className="progress flex-grow-1 ms-3" style={{ minHeight: "40px" }}>
              <div
                className="progress-bar bg-primary"
                role="progressbar"
                style={{ width: `${completenessPercent}%` }}
                aria-valuenow={completenessPercent}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
          </div>

          <small className="text-muted">
            This score reflects how many of your match attributes you've filled in. A complete
            profile helps admins match you with the right opportunities.
          </small>

          {unfilledDefs.length > 0 && (
            <div className="mt-3 p-3 bg-light rounded">
              <div className="fw-semibold mb-2 text-warning">
                <FaExclamationCircle className="me-2" />
                Missing attributes ({unfilledDefs.length}):
              </div>
              <ul className="mb-0 ps-4">
                {unfilledDefs.slice(0, 5).map((def) => (
                  <li key={def.key} className="text-muted small">
                    {def.label || def.key}
                  </li>
                ))}
                {unfilledDefs.length > 5 && (
                  <li className="text-muted small fw-semibold">
                    ...and {unfilledDefs.length - 5} more
                  </li>
                )}
              </ul>
              <button
                className="btn btn-sm btn-outline-primary mt-2"
                onClick={onEditProfile}
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scoring Factors Breakdown */}
      <div className="card shadow-sm">
        <div className="card-header bg-light border-0 py-3">
          <h5 className="mb-0 d-flex align-items-center">
            <FaClipboardList className="me-2 text-info" />
            Match Engine Scoring Factors
          </h5>
        </div>

        <div className="card-body">
          <small className="text-muted d-block mb-3">
            The match engine considers these factors when ranking you for available jobs.
          </small>

          {/* Factor 1: Constraint Matching */}
          <div className="factor-row mb-3 pb-3 border-bottom">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div className="fw-semibold">Constraint Matching</div>
                <small className="text-muted">Weight: 40%</small>
              </div>
              <div className="badge bg-primary">{completenessPercent}%</div>
            </div>
            <small className="text-muted">
              Your match attributes determine if you qualify for specific jobs. The more attributes
              you fill in, the more opportunities you can be matched with.
            </small>
          </div>

          {/* Factor 2: Workload Balance */}
          <div className="factor-row mb-3 pb-3 border-bottom">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div className="fw-semibold">Workload Balance</div>
                <small className="text-muted">Weight: 30%</small>
              </div>
              <div className={`badge bg-${workloadInfo.color}`}>
                {stats.totalMeetingsHosted || 0} meetings
              </div>
            </div>
            <small className="text-muted">
              Substitutes with fewer recent meetings are prioritized to balance workload fairly.
              Current load: <strong>{workloadInfo.level}</strong> ({stats.totalMeetingsHosted || 0} meetings
              hosted).
            </small>
          </div>

          {/* Factor 3: Recent Availability */}
          <div className="factor-row mb-3 pb-3 border-bottom">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div className="fw-semibold">Recent Availability</div>
                <small className="text-muted">Weight: 20%</small>
              </div>
              <div className="badge bg-secondary">
                {stats.assignedCount || 0} assignments
              </div>
            </div>
            <small className="text-muted">
              Substitutes who've taken fewer recent assignments are prioritized for new
              opportunities. You've been assigned {stats.assignedCount || 0} jobs total.
            </small>
          </div>

          {/* Factor 4: Application Timing */}
          <div className="factor-row">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div className="fw-semibold">Application Timing</div>
                <small className="text-muted">Weight: 10%</small>
              </div>
              <FaClock className="text-warning" />
            </div>
            <small className="text-muted">
              Applications submitted within 7 days of a job posting receive higher priority. After
              30 days, your application score resets to zero. Apply early for the best chance of
              being matched!
            </small>
          </div>
        </div>
      </div>

      {/*Success Rate Note */}
      {successRate !== null && (
        <div className="card shadow-sm mt-4 bg-light">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <div className="text-success fw-bold" style={{ fontSize: "1.5rem" }}>
                  {successRate}%
                </div>
                <small className="text-muted">Success Rate</small>
              </div>
              <small className="text-muted">
                You've been assigned <strong>{stats.assignedCount}</strong> of your{" "}
                <strong>{stats.appliedCount}</strong> applications. Keep applying and building
                your track record!
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchProfileCard;
