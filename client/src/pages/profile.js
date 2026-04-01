import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { FaShareSquare } from "react-icons/fa";
import ProfileForm from "../components/ProfileForm";
import { QUERY_USER_ATTRIBUTE_DEFINITIONS } from "../utils/graphql/constraints/queries.js";
import { ModalForm } from "../components/Modal/ModalForm";
import { UPDATE_USER } from "../utils/graphql/users/mutations.js";
import { QUERY_MY_JOB_STATS } from "../utils/graphql/users/queries.js";
import MatchProfileCard from "../components/MatchProfileCard";

const Profile = ({ me }) => {
  const user = me || {};
  console.log ("Rendering Profile Page with me:", user);

  const [showEditor, setShowEditor] = useState(false);
  const hasUser = Boolean(user.username);
  const { data: attrDefData } = useQuery(QUERY_USER_ATTRIBUTE_DEFINITIONS, {
    skip: !hasUser,
  });
  const { data: statsData } = useQuery(QUERY_MY_JOB_STATS, {
    skip: !hasUser,
  });
  const [updateUser] = useMutation(UPDATE_USER);
  const attributeDefs = attrDefData?.userAttributeDefinitions ?? [];
  const stats = statsData?.myJobStats || {};

  const attributeMap = useMemo(() => {
    const map = {};
    (user.attributes || []).forEach(attr => {
      map[attr.key] = attr.value;
    });
    return map;
  }, [user.attributes]);

  const formatValue = (val) => {
    if (val === null || val === undefined || val === "") return "—";
    if (Array.isArray(val)) return val.join(", ");
    if (val === true) return "Yes";
    if (val === false) return "No";
    return String(val);
  };

  const dynamicRows = attributeDefs
    .filter(def => attributeMap.hasOwnProperty(def.key))
    .map(def => ({
      key: def.key,
      label: def.label || def.key,
      value: formatValue(attributeMap[def.key]),
    }));

  const staticRows = [
    { key: "username", label: "Display Name", value: user.username || "—" },
    { key: "email", label: "Email", value: user.email || "—" },
    { key: "phone", label: "Phone", value: user.phone || "—" },
    { key: "about", label: "About", value: user.about || "—" },
  ];

  const rows = [...staticRows, ...dynamicRows];

  if (!hasUser) {
    return (
      <h4>
        You need to be logged in to see this. Use the navigation links above to
        sign up or log in!
      </h4>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="mb-0">{me.username}</h2>
          <small className="text-muted">Profile settings</small>
        </div>
        <button className="btn btn-outline-primary" onClick={() => setShowEditor(true)}>
          Edit Profile
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="list-group list-group-flush">
          {rows.map(row => (
            <div
              key={row.key}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                <div className="fw-semibold text-dark">{row.label}</div>
                <div className="text-muted">{row.value}</div>
              </div>
              <button
                className="btn btn-link"
                onClick={() => setShowEditor(true)}
                style={{ textDecoration: "none" }}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <h6>Contact Me</h6>
        <div className="text-muted">
          <span className="text-dark">Email: </span>
          {user.email}&nbsp;
          <a
            id="mail"
            rel="noopener noreferrer"
            target="_blank"
            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${user.email}`}
          >
            <FaShareSquare className="email-icon mb-1" />
          </a>
          <br />
          <span className="text-dark">Phone Number: </span> {user.phone || "—"}
        </div>
      </div>

      {/* My Activity Card - Own Profile Only */}
      <div className="mt-4">
        <h5 className="mb-3">My Activity</h5>
        <div className="row">
          <div className="col-sm-6 col-lg-3 mb-3">
            <div className="card shadow-sm h-100 text-center">
              <div className="card-body">
                <div className="stat-number text-primary fw-bold" style={{ fontSize: "2rem" }}>
                  {stats.appliedCount || 0}
                </div>
                <div className="stat-label text-muted">Applications Submitted</div>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3 mb-3">
            <div className="card shadow-sm h-100 text-center">
              <div className="card-body">
                <div className="stat-number text-success fw-bold" style={{ fontSize: "2rem" }}>
                  {stats.assignedCount || 0}
                </div>
                <div className="stat-label text-muted">Jobs Filled</div>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3 mb-3">
            <div className="card shadow-sm h-100 text-center">
              <div className="card-body">
                <div className="stat-number text-info fw-bold" style={{ fontSize: "2rem" }}>
                  {stats.appliedCount && stats.appliedCount > 0
                    ? `${Math.round((stats.assignedCount / stats.appliedCount) * 100)}%`
                    : "—"}
                </div>
                <div className="stat-label text-muted">Success Rate</div>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3 mb-3">
            <div className="card shadow-sm h-100 text-center">
              <div className="card-body">
                <div className="stat-number text-warning fw-bold" style={{ fontSize: "2rem" }}>
                  {stats.totalMeetingsHosted || 0}
                </div>
                <div className="stat-label text-muted">Meetings Hosted</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Match Profile Card */}
      <MatchProfileCard
        user={user}
        attributeDefs={attributeDefs}
        stats={stats}
        onEditProfile={() => setShowEditor(true)}
      />

      {showEditor && (
        <ModalForm
          title="Edit Profile"
          onClose={() => setShowEditor(false)}
          footer={null}
        >
          <ProfileForm
            initialData={user}
            onSubmit={async (payload) => {
              try {
                await updateUser({
                  variables: {
                    _id: user._id,
                    email: payload.email,
                    phone: payload.phone,
                    about: payload.about,
                    attributes: payload.attributes,
                  },
                });
                setShowEditor(false);
              } catch (err) {
                console.error("Failed to update profile", err);
              }
            }}
          />
        </ModalForm>
      )}
    </div>
  );
};

export default Profile;
