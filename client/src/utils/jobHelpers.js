// utils/jobHelpers.js
import Auth from "../utils/auth";

export function isJobApplyDisabled(job, { admin, applied }) {
  if (!Auth.loggedIn()) return true;

  const userId = Auth.getProfile().data._id;

  return (
    admin ||              // admins can't apply
    applied ||            // already applied
    job.createdBy._id === userId // owner of the job
  );
}