import React from "react";
import { useQuery, useMutation } from "@apollo/client";
import { QUERY_MEETINGS } from "../../../utils/graphql/meetings/queries.js";
import { QUERY_EVENTS, QUERY_EVENTS_FOR_CALENDARS } from "../../../utils/graphql/gcal/queries.js";
import { QUERY_CONSTRAINTS_GROUPS } from "../../../utils/graphql/constraints/queries.js";
import { GET_USERS } from "../../../utils/graphql/users/queries.js";
import {
  UPDATE_MEETING,
  CREATE_MEETING,
  DELETE_MEETING,
  SYNC_MEETING_ASSIGNMENTS_FROM_CALENDAR,
} from "../../../utils/graphql/meetings/mutations.js";
import { GenericReportTable } from "../../../components/reporting/GenericReportTable/GenericReportTable.js";
import { createColumnHelper } from "@tanstack/react-table";
import ImportMeetingsButton from "./UserSettings/ImportMeetingsButton.js";
import ModalForm from "../../../components/Modal/ModalForm";

const DEFAULT_ADMIN_CALENDAR_ID = "meetings@oplm.com";

function toRecurringBaseId(eventId) {
  if (!eventId || typeof eventId !== "string") return "";
  const recurringMarker = "_R";
  const markerIndex = eventId.indexOf(recurringMarker);
  return markerIndex > -1 ? eventId.slice(0, markerIndex) : eventId;
}

function formatEventStartLabel(start) {
  if (!start) return "Unknown start";

  const date = new Date(start);
  if (Number.isNaN(date.getTime())) return "Unknown start";

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function MeetingsSettings() {
  const { loading, error, data, refetch } = useQuery(QUERY_MEETINGS);
  const {
    data: groupsData,
  } = useQuery(QUERY_CONSTRAINTS_GROUPS);
  const {
    data: usersData,
  } = useQuery(GET_USERS);

  const [updateMeeting] = useMutation(UPDATE_MEETING, { onCompleted: () => refetch() });
  const [createMeeting] = useMutation(CREATE_MEETING, { onCompleted: () => refetch() });
  const [deleteMeeting] = useMutation(DELETE_MEETING, { onCompleted: () => refetch() });
  const [syncMeetingAssignments, { loading: syncMeetingAssignmentsLoading }] = useMutation(
    SYNC_MEETING_ASSIGNMENTS_FROM_CALENDAR
  );

  const [showForm, setShowForm] = React.useState(false);
  const [showLinkForm, setShowLinkForm] = React.useState(false);
  const [editingMeeting, setEditingMeeting] = React.useState(null);
  const [linkMeeting, setLinkMeeting] = React.useState(null);
  const [saveError, setSaveError] = React.useState("");
  const [linkSaveError, setLinkSaveError] = React.useState("");
  const [formState, setFormState] = React.useState({
    summary: "",
    description: "",
    constraintGroupIds: [],
    workloadBalanceWindowDays: "",
  });
  const [linkFormState, setLinkFormState] = React.useState({
    calendarId: DEFAULT_ADMIN_CALENDAR_ID,
    gcalEventId: "",
    gcalRecurringEventId: "",
  });

  const meetings = React.useMemo(() => data?.meetings ?? [], [data]);
  const constraintGroups = groupsData?.constraintGroups ?? [];
  const users = usersData?.users ?? [];
  const columnHelper = createColumnHelper();

  const calendarIdsForValidation = React.useMemo(
    () => Array.from(new Set(meetings.map((meeting) => (meeting.calendarId || "").trim()).filter(Boolean))),
    [meetings]
  );
  const {
    data: validationEventsData,
    loading: validationEventsLoading,
    refetch: refetchValidationEvents,
  } = useQuery(QUERY_EVENTS_FOR_CALENDARS, {
    variables: { calendarIds: calendarIdsForValidation },
    skip: calendarIdsForValidation.length === 0,
    fetchPolicy: "network-only",
  });
  const validationEvents = React.useMemo(
    () => validationEventsData?.googleEventsForCalendars ?? [],
    [validationEventsData]
  );
  const calendarEventLookup = React.useMemo(() => {
    const map = new Map();

    for (const eventItem of validationEvents) {
      const calendarId = (eventItem.calendarId || "").trim();
      if (!calendarId) continue;

      if (!map.has(calendarId)) {
        map.set(calendarId, new Set());
      }

      const ids = map.get(calendarId);
      if (eventItem.id) ids.add(eventItem.id);
      if (eventItem.recurringEventId) ids.add(eventItem.recurringEventId);
    }

    return map;
  }, [validationEvents]);

  const selectedLinkCalendarId = (linkFormState.calendarId || "").trim();
  const {
    data: eventsData,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useQuery(QUERY_EVENTS, {
    variables: { calendarId: selectedLinkCalendarId, parentOnly: true },
    skip: !showLinkForm || !selectedLinkCalendarId,
    fetchPolicy: "network-only",
  });
  const googleEvents = React.useMemo(() => eventsData?.googleEvents ?? [], [eventsData]);
  const selectedLinkGoogleEvent = React.useMemo(
    () => googleEvents.find((eventItem) => eventItem.id === linkFormState.gcalEventId),
    [googleEvents, linkFormState.gcalEventId]
  );
  const hasMissingLinkedEvent = !!linkFormState.gcalEventId && !selectedLinkGoogleEvent;

  React.useEffect(() => {
    if (!showLinkForm) return;

    if (eventsError) {
      const errorMessage = eventsError?.message || String(eventsError);
      console.error("[MeetingSettings][FixLink] googleEvents error", {
        calendarId: selectedLinkCalendarId,
        error: errorMessage,
      });
      
      // Check if it's an auth error
      if (errorMessage.includes("authentication") || errorMessage.includes("OAuth") || errorMessage.includes("credential")) {
        console.error("[MeetingSettings][FixLink] Auth error detected - user may need to re-authenticate with Google");
      }
      return;
    }

    if (eventsLoading) return;

    const payloadPreview = googleEvents.map((eventItem) => ({
      id: eventItem.id,
      recurringEventId: eventItem.recurringEventId || null,
      summary: eventItem.summary || "(Untitled)",
      start: eventItem.start || null,
      end: eventItem.end || null,
      calendarId: eventItem.calendarId || selectedLinkCalendarId,
    }));

    console.log("[MeetingSettings][FixLink] googleEvents response", {
      calendarId: selectedLinkCalendarId,
      parentOnly: true,
      eventCount: payloadPreview.length,
      selectedEventId: linkFormState.gcalEventId || null,
      events: payloadPreview,
    });
  }, [
    showLinkForm,
    eventsError,
    eventsLoading,
    googleEvents,
    selectedLinkCalendarId,
    linkFormState.gcalEventId,
  ]);

  const resetForm = React.useCallback(() => {
    setFormState({
      summary: "",
      description: "",
      constraintGroupIds: [],
      zoomMeetingUrl: "",
      hostId: "",
      coHostId: "",
      alternateHostId: "",
      workloadBalanceWindowDays: "",
      linkedJobIds: [],
    });
    setSaveError("");
    setEditingMeeting(null);
  }, []);

  const handleEditMeeting = React.useCallback((meeting) => {
    setEditingMeeting(meeting);
    setSaveError("");
    setFormState({
      summary: meeting.summary ?? "",
      description: meeting.description ?? "",
      constraintGroupIds: meeting.constraintGroupIds ?? [],
      zoomMeetingUrl: meeting.zoomMeetingUrl ?? "",
      hostId: meeting.host?._id ?? "",
      coHostId: meeting.coHost?._id ?? "",
      alternateHostId: meeting.alternateHost?._id ?? "",
      workloadBalanceWindowDays: meeting.workloadBalanceWindowDays ?? "",
      linkedJobIds: meeting.linkedJobIds ?? [],
    });
    setShowForm(true);
  }, []);

  const handleSubmit = React.useCallback(async (e) => {
    e.preventDefault();
    setSaveError("");
    const workloadDays = formState.workloadBalanceWindowDays ? parseInt(formState.workloadBalanceWindowDays, 10) : null;
    const payload = {
      summary: formState.summary.trim(),
      description: formState.description,
      constraintGroupIds: formState.constraintGroupIds,
      zoomMeetingUrl: formState.zoomMeetingUrl.trim(),
      hostId: formState.hostId || null,
      coHostId: formState.coHostId || null,
      alternateHostId: formState.alternateHostId || null,
      workloadBalanceWindowDays: (workloadDays && workloadDays > 0) ? workloadDays : null,
      linkedJobIds: formState.linkedJobIds,
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
      const duplicateError = err?.message?.includes("duplicate key");
      if (duplicateError) {
        setSaveError("That Google Calendar event is already linked to another meeting.");
      } else {
        setSaveError("Unable to save meeting. Please try again.");
      }
    }
  }, [formState, editingMeeting, updateMeeting, createMeeting, resetForm]);

  const handleGoogleEventChange = React.useCallback((eventId) => {
    const selectedEvent = googleEvents.find((eventItem) => eventItem.id === eventId);
    const recurringBaseId = selectedEvent?.recurringEventId || "";
    setLinkFormState((prev) => ({
      ...prev,
      // Use recurring master ID when available so links survive instance turnover.
      gcalEventId: recurringBaseId || eventId,
      gcalRecurringEventId: recurringBaseId,
    }));
  }, [googleEvents]);

  const openFixLinkDialog = React.useCallback((meeting) => {
    setLinkMeeting(meeting);
    setLinkSaveError("");
    setLinkFormState({
      calendarId: meeting.calendarId ?? DEFAULT_ADMIN_CALENDAR_ID,
      gcalEventId: "",
      gcalRecurringEventId: "",
    });
    setShowLinkForm(true);
  }, []);

  const closeFixLinkDialog = React.useCallback(() => {
    setShowLinkForm(false);
    setLinkMeeting(null);
    setLinkSaveError("");
    setLinkFormState({
      calendarId: DEFAULT_ADMIN_CALENDAR_ID,
      gcalEventId: "",
      gcalRecurringEventId: "",
    });
  }, []);

  const handleFixLinkSave = React.useCallback(async () => {
    if (!linkMeeting?._id) {
      setLinkSaveError("No meeting selected.");
      return;
    }

    const calendarId = (linkFormState.calendarId || "").trim();
    if (!calendarId) {
      setLinkSaveError("Calendar ID is required.");
      return;
    }

    if (!linkFormState.gcalEventId) {
      setLinkSaveError("Please select a Google event to link.");
      return;
    }

    // Check if the selected event is already linked to a different meeting
    const targetEventId = linkFormState.gcalEventId;
    const otherMeetingWithEvent = meetings.find(
      (m) => m._id !== linkMeeting._id
        && m.calendarId === calendarId
        && (m.gcalEventId === targetEventId || m.gcalRecurringEventId === targetEventId)
    );
    if (otherMeetingWithEvent) {
      setLinkSaveError(
        `This Google event is already linked to another meeting: "${otherMeetingWithEvent.summary || "(Untitled)"}". ` +
        "Please unlink it from that meeting first, or select a different event."
      );
      return;
    }

    setLinkSaveError("");

    const payload = {
      summary: linkMeeting.summary ?? "",
      description: linkMeeting.description ?? "",
      constraintGroupIds: linkMeeting.constraintGroupIds ?? [],
      zoomMeetingUrl: linkMeeting.zoomMeetingUrl ?? "",
      hostId: linkMeeting.host?._id ?? null,
      coHostId: linkMeeting.coHost?._id ?? null,
      alternateHostId: linkMeeting.alternateHost?._id ?? null,
      workloadBalanceWindowDays: linkMeeting.workloadBalanceWindowDays ?? null,
      linkedJobIds: linkMeeting.linkedJobIds ?? [],
      source: "google",
      calendarId,
      gcalEventId: linkFormState.gcalEventId,
      gcalRecurringEventId: linkFormState.gcalRecurringEventId || null,
    };

    try {
      await updateMeeting({
        variables: {
          id: linkMeeting._id,
          input: payload,
        },
      });

      // Refresh both meetings and link-validation datasets so status pills update immediately.
      await refetch();
      const nextCalendarIds = Array.from(new Set([...calendarIdsForValidation, calendarId].filter(Boolean)));
      if (nextCalendarIds.length > 0) {
        await refetchValidationEvents({ calendarIds: nextCalendarIds });
      }

      closeFixLinkDialog();
    } catch (err) {
      console.error("Error fixing meeting link:", err);
      const duplicateError = err?.message?.includes("duplicate key");
      if (duplicateError) {
        setLinkSaveError("That Google Calendar event is already linked to another meeting.");
      } else {
        setLinkSaveError("Unable to update meeting link. Please try again.");
      }
    }
  }, [
    linkMeeting,
    linkFormState,
    updateMeeting,
    closeFixLinkDialog,
    refetch,
    calendarIdsForValidation,
    refetchValidationEvents,
    meetings,
  ]);

  const handleDelete = React.useCallback(async (id) => {
    if (!window.confirm("Delete this meeting?")) return;
    try {
      await deleteMeeting({ variables: { id } });
    } catch (err) {
      console.error("Error deleting meeting:", err);
    }
  }, [deleteMeeting]);

  const handleSyncAssignments = React.useCallback(async (meeting) => {
    if (!meeting?._id) return;

    try {
      const { data: syncData } = await syncMeetingAssignments({
        variables: {
          meetingId: meeting._id,
          dryRun: false,
        },
      });

      const result = syncData?.syncMeetingAssignmentsFromCalendar;
      if (!result) {
        window.alert("Sync completed, but no details were returned.");
        await refetch();
        return;
      }

      const warningSuffix = result.warnings?.length
        ? `\n\nWarnings:\n- ${result.warnings.join("\n- ")}`
        : "";

      window.alert(
        `Assignment sync complete for ${meeting.summary || "meeting"}.\n\n` +
        `Reviewed: ${result.reviewedJobs}\n` +
        `Updated: ${result.updatedJobs}\n` +
        `Assigned: ${result.assignedJobs}\n` +
        `Unassigned: ${result.unassignedJobs}\n` +
        `Skipped (ambiguous): ${result.skippedAmbiguousJobs}` +
        warningSuffix
      );

      await refetch();
    } catch (err) {
      console.error("Error syncing meeting assignments:", err);
      window.alert(err?.message || "Failed to sync assignments from Google Calendar.");
    }
  }, [syncMeetingAssignments, refetch]);

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
    columnHelper.accessor(row => {
      const daysOfWeek = row.recurrence?.daysOfWeek;
      if (!daysOfWeek || daysOfWeek.length === 0) return "—";
      
      // Map day codes to readable names
      const dayCodeMap = {
        'MO': 'Monday',
        'TU': 'Tuesday',
        'WE': 'Wednesday',
        'TH': 'Thursday',
        'FR': 'Friday',
        'SA': 'Saturday',
        'SU': 'Sunday'
      };
      
      // Map day numbers to readable names (Monday = 0)
      const dayNumberMap = {
        0: 'Monday',
        1: 'Tuesday',
        2: 'Wednesday',
        3: 'Thursday',
        4: 'Friday',
        5: 'Saturday',
        6: 'Sunday'
      };
      
      return daysOfWeek.map(d => {
        // Check if it's a number or string
        if (typeof d === 'number' || !isNaN(d)) {
          return dayNumberMap[Number(d)] || d;
        }
        return dayCodeMap[d] || d;
      }).join(', ');
    }, {
      id: "daysOfWeek",
      header: "Days of Week",
    }),
    columnHelper.accessor(row => (row.constraintGroups ? row.constraintGroups.length : 0), {
      id: "constraintGroupCount",
      header: "Rule Groups",
    }),
    columnHelper.accessor("workloadBalanceWindowDays", {
      header: "Workload Balance",
      cell: (info) => {
        const days = info.getValue();
        return days ? (
          <span className="badge text-bg-info" title={`Balances workload over ${days} days`}>
            {days} days
          </span>
        ) : (
          <span className="text-muted">—</span>
        );
      }
    }),
    columnHelper.accessor((row) => row.gcalEventId, {
      id: "googleLinkStatus",
      header: "Google Link",
      cell: (info) => {
        const gcalEventId = info.getValue();
        const meetingName = info.row.original?.summary || "(Untitled)";
        const meetingCalendarId = (info.row.original?.calendarId || "").trim();
        const meetingRecurringEventId = info.row.original?.gcalRecurringEventId;
        const normalizedMeetingEventId = toRecurringBaseId(gcalEventId);
        const meetingRow = info.row.original;

        if (!gcalEventId) {
          return (
            <button
              type="button"
              className="badge text-bg-secondary border-0"
              onClick={() => openFixLinkDialog(meetingRow)}
              title="Click to add or fix Google link"
            >
              Not linked
            </button>
          );
        }

        if (validationEventsLoading) {
          return (
            <button
              type="button"
              className="badge text-bg-secondary border-0"
              onClick={() => openFixLinkDialog(meetingRow)}
              title="Click to review or fix Google link"
            >
              Checking...
            </button>
          );
        }

        const knownIdsForCalendar = meetingCalendarId
          ? calendarEventLookup.get(meetingCalendarId)
          : null;
        const isVerified = knownIdsForCalendar
          ? knownIdsForCalendar.has(gcalEventId)
            || knownIdsForCalendar.has(normalizedMeetingEventId)
            || (meetingRecurringEventId ? knownIdsForCalendar.has(meetingRecurringEventId) : false)
          : false;

        // Check if this event is linked to another meeting (duplicate link)
        const otherMeetingWithEvent = meetings?.find(
          (m) => m._id !== meetingRow._id
            && m.calendarId === meetingCalendarId
            && (m.gcalEventId === gcalEventId || m.gcalRecurringEventId === gcalEventId)
        );

        if (otherMeetingWithEvent) {
          return (
            <button
              type="button"
              className="badge text-bg-info border-0"
              onClick={() => openFixLinkDialog(meetingRow)}
              title={`This Google event is already linked to another meeting: "${otherMeetingWithEvent.summary || '(Untitled)'}" (${otherMeetingWithEvent.calendarId}). Click to change the link.`}
            >
              Linked to another
            </button>
          );
        }

        if (isVerified) {
          return (
            <button
              type="button"
              className="badge text-bg-success border-0"
              onClick={() => openFixLinkDialog(meetingRow)}
              title={`Linked meeting: ${meetingName}. Click to update link.`}
            >
              Linked
            </button>
          );
        }

        if (!meetingCalendarId) {
          return (
            <button
              type="button"
              className="badge text-bg-warning border-0"
              onClick={() => openFixLinkDialog(meetingRow)}
              title="Linked event exists, but calendar ID is missing so link cannot be validated. Click to fix."
            >
              Unverified
            </button>
          );
        }

        return (
          <button
            type="button"
            className="badge text-bg-danger border-0"
            onClick={() => openFixLinkDialog(meetingRow)}
            title="Linked event was not found in Google for this calendar. Click to fix."
          >
            Broken link
          </button>
        );
      },
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
            className="btn btn-sm btn-outline-secondary"
            onClick={() => handleSyncAssignments(row.original)}
            disabled={syncMeetingAssignmentsLoading || !row.original?.gcalEventId}
            title={!row.original?.gcalEventId ? "Link this meeting to Google first" : "Sync local assignee from Google attendees"}
          >
            Sync Assignee
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
  ], [
    columnHelper,
    handleEditMeeting,
    handleSyncAssignments,
    openFixLinkDialog,
    handleDelete,
    validationEventsLoading,
    calendarEventLookup,
    syncMeetingAssignmentsLoading,
  ]);

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
                setSaveError("");
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
              <label className="form-label">Zoom Meeting URL</label>
              <input
                className="form-control"
                type="url"
                value={formState.zoomMeetingUrl}
                onChange={(e) => setFormState((prev) => ({ ...prev, zoomMeetingUrl: e.target.value }))}
                placeholder="https://zoom.us/j/..."
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Host</label>
              <select
                className="form-select"
                value={formState.hostId}
                onChange={(e) => setFormState((prev) => ({ ...prev, hostId: e.target.value }))}
              >
                <option value="">-- Select Host --</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label className="form-label">Co-Host</label>
              <select
                className="form-select"
                value={formState.coHostId}
                onChange={(e) => setFormState((prev) => ({ ...prev, coHostId: e.target.value }))}
              >
                <option value="">-- Select Co-Host --</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label className="form-label">Alternate Host</label>
              <select
                className="form-select"
                value={formState.alternateHostId}
                onChange={(e) => setFormState((prev) => ({ ...prev, alternateHostId: e.target.value }))}
              >
                <option value="">-- Select Alternate Host --</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label className="form-label">Workload Balance Window (days)</label>
              <input
                className="form-control"
                type="number"
                min="1"
                max="365"
                value={formState.workloadBalanceWindowDays}
                onChange={(e) => setFormState((prev) => ({ ...prev, workloadBalanceWindowDays: e.target.value }))}
                placeholder="Leave empty to disable workload balancing"
              />
              <div className="form-text">
                When set, applicants with fewer substitute jobs in the last N days will be favored. 
                Leave empty to use standard ranking without workload considerations.
              </div>
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

            {saveError && (
              <div className="alert alert-danger py-2" role="alert">
                {saveError}
              </div>
            )}
          </form>
        </ModalForm>
      )}

      {showLinkForm && (
        <ModalForm
          title={linkMeeting ? `Fix Google Link: ${linkMeeting.summary || "(Untitled)"}` : "Fix Google Link"}
          onClose={closeFixLinkDialog}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={closeFixLinkDialog}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleFixLinkSave}>
                Save Link
              </button>
            </>
          }
        >
          <div className="mb-3 border rounded p-3 bg-light-subtle">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label fw-semibold mb-0">Google Calendar Link</label>
              <span
                className={`badge ${linkFormState.gcalEventId ? "text-bg-success" : "text-bg-secondary"}`}
              >
                {linkFormState.gcalEventId ? "Linked" : "Not linked"}
              </span>
            </div>

            <div className="mb-2">
              <label className="form-label">Calendar ID</label>
              <div className="input-group">
                <input
                  className="form-control"
                  value={linkFormState.calendarId}
                  onChange={(e) => setLinkFormState((prev) => ({
                    ...prev,
                    calendarId: e.target.value,
                    gcalEventId: "",
                    gcalRecurringEventId: "",
                  }))}
                  placeholder="meetings@oplm.com"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={!selectedLinkCalendarId || eventsLoading}
                  onClick={() => refetchEvents()}
                >
                  {eventsLoading ? "Refreshing..." : "Refresh Events"}
                </button>
              </div>
            </div>

            <div className="mb-1">
              <label className="form-label">Linked Event</label>
              <select
                className="form-select"
                value={linkFormState.gcalEventId}
                onChange={(e) => handleGoogleEventChange(e.target.value)}
                disabled={!selectedLinkCalendarId || eventsLoading}
              >
                <option value="">-- Select Google event --</option>
                {googleEvents.map((eventItem) => {
                  const startsAt = formatEventStartLabel(eventItem.start);
                  return (
                    <option key={eventItem.id} value={eventItem.id}>
                      {eventItem.summary || "(Untitled)"} - {startsAt}
                    </option>
                  );
                })}
              </select>
            </div>

            {eventsError && (
              <div className="alert alert-danger py-2 mt-2 mb-0" role="alert">
                <strong>Unable to load Google events:</strong> {" "}
                {eventsError?.message?.includes("authentication") || 
                 eventsError?.message?.includes("credential") ||
                 eventsError?.message?.includes("OAuth")
                  ? "Your Google Calendar authentication has expired. Please re-authenticate in your account settings, or contact your administrator if the issue persists."
                  : "Failed to load events for this calendar. Please check your calendar selection or try again."}
              </div>
            )}

            {!eventsLoading && !eventsError && selectedLinkCalendarId && googleEvents.length === 0 && (
              <div className="form-text text-muted">
                No events found for this calendar in the configured import window.
              </div>
            )}

            {!!linkFormState.gcalEventId && (
              <>
                {selectedLinkGoogleEvent && (
                  <div className="form-text text-success mt-2">
                    {`This meeting will be linked to: ${selectedLinkGoogleEvent.summary || "(Untitled)"}${selectedLinkGoogleEvent.start ? ` (${formatEventStartLabel(selectedLinkGoogleEvent.start)})` : ""}`}
                  </div>
                )}
                {hasMissingLinkedEvent && (
                  <div className="alert alert-warning py-2 mt-2 mb-0" role="alert">
                    <strong>Linked event not found in current list.</strong>{" "}
                    This usually means the event is outside the current query window, on a different calendar, or was removed from Google Calendar.
                  </div>
                )}
              </>
            )}

            {linkSaveError && (
              <div className="alert alert-danger py-2 mt-2 mb-0" role="alert">
                {linkSaveError}
              </div>
            )}
          </div>
        </ModalForm>
      )}

    </div>
  );
}
