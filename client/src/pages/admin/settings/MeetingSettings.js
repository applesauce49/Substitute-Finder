import React from "react";
import { useQuery, useMutation } from "@apollo/client";
import { QUERY_MEETINGS } from "../../../utils/graphql/meetings/queries.js";
import { QUERY_CONSTRAINTS_GROUPS } from "../../../utils/graphql/constraints/queries.js";
import { UPDATE_MEETING, CREATE_MEETING, DELETE_MEETING } from "../../../utils/graphql/meetings/mutations.js";
import { GenericReportTable } from "../../../components/reporting/GenericReportTable/GenericReportTable.js";
import { createColumnHelper } from "@tanstack/react-table";
import ImportMeetingsButton from "./UserSettings/ImportMeetingsButton.js";
import ModalForm from "../../../components/Modal/ModalForm";

export default function MeetingsSettings() {
  const { loading, error, data, refetch } = useQuery(QUERY_MEETINGS);
  const {
    data: groupsData,
  } = useQuery(QUERY_CONSTRAINTS_GROUPS);

  const [updateMeeting] = useMutation(UPDATE_MEETING, { onCompleted: () => refetch() });
  const [createMeeting] = useMutation(CREATE_MEETING, { onCompleted: () => refetch() });
  const [deleteMeeting] = useMutation(DELETE_MEETING, { onCompleted: () => refetch() });

  const [showForm, setShowForm] = React.useState(false);
  const [editingMeeting, setEditingMeeting] = React.useState(null);
  const [formState, setFormState] = React.useState({
    summary: "",
    description: "",
    constraintGroupIds: [],
  });

  const meetings = data?.meetings || [];
  const constraintGroups = groupsData?.constraintGroups ?? [];
  const columnHelper = createColumnHelper();

  const resetForm = React.useCallback(() => {
    setFormState({
      summary: "",
      description: "",
      constraintGroupIds: [],
    });
    setEditingMeeting(null);
  }, []);

  const handleEditMeeting = React.useCallback((meeting) => {
    setEditingMeeting(meeting);
    setFormState({
      summary: meeting.summary ?? "",
      description: meeting.description ?? "",
      constraintGroupIds: meeting.constraintGroupIds ?? [],
    });
    setShowForm(true);
  }, []);

  const handleSubmit = React.useCallback(async (e) => {
    e.preventDefault();
    const payload = {
      summary: formState.summary.trim(),
      description: formState.description,
      constraintGroupIds: formState.constraintGroupIds,
    };

    try {
      if (editingMeeting?._id) {
        await updateMeeting({ variables: { id: editingMeeting._id, input: payload } });
      } else {
        await createMeeting({ variables: { input: payload } });
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error("Error saving meeting:", err);
    }
  }, [formState, editingMeeting, updateMeeting, createMeeting, resetForm]);

  const handleDelete = React.useCallback(async (id) => {
    if (!window.confirm("Delete this meeting?")) return;
    try {
      await deleteMeeting({ variables: { id } });
    } catch (err) {
      console.error("Error deleting meeting:", err);
    }
  }, [deleteMeeting]);

  const columns = React.useMemo(() => [
    columnHelper.accessor("summary", {
      header: "Summary",
      cell: (info) => info.getValue() || "—"
    }),
    columnHelper.accessor("description", {
      header: "description",
      cell: info => {
        const html = info.getValue(); // your HTML string
        return (
          <div
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      },
    }),
    columnHelper.accessor("gcalRecurringEventId", {
      header: "Series ID",
      cell: (info) => info.getValue() || "—"
    }),
    columnHelper.accessor(row => (row.constraintGroups ? row.constraintGroups.length : 0), {
      id: "constraintGroupCount",
      header: "Rule Groups",
    }),
    columnHelper.accessor("updatedAt", {
      header: "Updated",
      cell: (info) => new Date(info.getValue()).toLocaleString(),
    }),
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="d-flex justify-content-end gap-2">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => handleEditMeeting(row.original)}
          >
            Edit
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => handleDelete(row.original._id)}
          >
            Delete
          </button>
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
  ], [columnHelper, handleEditMeeting, handleDelete]);

  if (loading) return <p>Loading meetings…</p>;
  if (error) return <p>Error loading meetings.</p>;

  return (
    <div className="meetings-report">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Meetings</h2>
      </div>

      <GenericReportTable
        columns={columns}
        data={meetings}
        toolbarRight={
          <div className="d-flex gap-2">
            <ImportMeetingsButton />
            <button
              className="btn btn-success"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              Add Meeting
            </button>
          </div>
        }
      />

      {showForm && (
        <ModalForm
          title={editingMeeting ? "Edit Meeting" : "Add Meeting"}
          onClose={() => {
            setShowForm(false);
            resetForm();
          }}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                Save
              </button>
            </>
          }
        >
          <form className="mb-2" onSubmit={handleSubmit}>
            <div className="mb-2">
              <label className="form-label">Summary</label>
              <input
                className="form-control"
                value={formState.summary}
                onChange={(e) => setFormState((prev) => ({ ...prev, summary: e.target.value }))}
                placeholder="Meeting title"
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={formState.description}
                onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Rule Groups</label>
              <div className="border rounded p-2" style={{ maxHeight: 220, overflowY: "auto" }}>
                {constraintGroups.length === 0 ? (
                  <div className="text-muted">No rule groups available.</div>
                ) : (
                  constraintGroups.map((group) => (
                    <div className="form-check" key={group._id}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`cg-${group._id}`}
                        checked={formState.constraintGroupIds.includes(group._id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormState((prev) => {
                            const nextIds = checked
                              ? [...prev.constraintGroupIds, group._id]
                              : prev.constraintGroupIds.filter((id) => id !== group._id);
                            return { ...prev, constraintGroupIds: nextIds };
                          });
                        }}
                      />
                      <label className="form-check-label" htmlFor={`cg-${group._id}`}>
                        {group.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </form>
        </ModalForm>
      )}

    </div>
  );
}
