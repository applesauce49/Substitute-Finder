import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { ADD_JOB } from "../../utils/mutations";
import { QUERY_EVENTS, QUERY_ME, GET_USERS } from "../../utils/queries";

import CalendarListView from "../CalendarListView";

const JobForm = ({ onRefetch, onSuccess }) => {

  console.log("Rendering JobForm");
  const { data: userData } = useQuery(QUERY_ME);

  const calendarId = userData?.me?.admin ? "meetings@oplm.com" : "primary";

  const { data, loading: meetingsLoading } = useQuery(QUERY_EVENTS, {
    variables: { calendarId: calendarId },
  });

  const { data: usersData } = useQuery(GET_USERS);

  const users = usersData?.users ?? [];
  const userOptions = users?.map(u => ({
    value: u._id.toString(),
    label: u.username
  }));

  console.log(userOptions);

  const admin = userData?.me.admin || "";
  const meetings = data || [];
  const events = data?.googleEvents || [];

  console.log("Events from JobForm: ", events);
  const [jobText, setText] = useState({
    active: true,
    description: "",
    meetings: [], // note plural
  });
  const [characterCount, setCharacterCount] = useState(0);

  const [addJob, { error }] = useMutation(ADD_JOB, {
    fetchPolicy: "no-cache",
  });
  
  // const [addJob, { error }] = useMutation(ADD_JOB, {
  //   update(cache, { data }) {
  //     const payload = data?.addJob;
  //     if (!payload || payload.conflict || !payload.job) return;
  //   },
  // });

  const [formError, setFormError] = useState("");
  const [selectedEvents, setSelectedEvents] = useState(new Set());

  const [formData, setFormData] = useState({
    createdBy: "",
  });

  // Update state for textarea
  const handleChange = (event) => {
    const { name, value } = event.target;
    setText((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "description") {
      setCharacterCount(value.length);
    }
  };

  // Update state for textarea
  const handleSelectionChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleEventClick = (info) => {
    const id = info.event.id;
    const newSet = new Set(selectedEvents);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedEvents(newSet);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    // Default to current user
    let creator = userData?.me?._id;

    // Admins choose a user from the dropdown
    if (admin) {
      creator = formData.createdBy;

      if (!creator) {
        setFormError("You need to select a user before submitting the form.");
        return;
      }
    }

    const meetingsMap = new Map(events.map((e) => [e.id, e]));

    try {
      for (const eventId of selectedEvents) {
        const meeting = meetingsMap.get(eventId);
        const { data } = await addJob({
          variables: {
            description: jobText.description,
            createdBy: creator,
            meeting: meeting.id,
            calendarId: calendarId,
          },
        });

        if (data.addJob.conflict) {
          setFormError("This meeting conflicts with an existing one.");
          return; // stop here but don't reset form
        }
      }

      // Only reset after successful submission
      setText({ active: true, description: "", meetings: [] });
      setCharacterCount(0);
      setFormData({ createdBy: "" }); // clear dropdown only on success

      onSuccess?.();
      // await onRefetch();
      setTimeout(() => onRefetch(), 0);
    } catch (e) {
      console.error(e);
    }
  };

  if (meetingsLoading) return <p>Loading meetings...</p>;

  return (
    <>
      <form
        className="flex-row justify-center justify-space-between-md align-stretch"
        onSubmit={handleFormSubmit}
      >
        <div className="meeting-calendar d-flex justify-content-center align-items-center col-12 col-md-12">
          <CalendarListView
            meetings={meetings}
            selectedEvents={selectedEvents}
            onEventClick={handleEventClick}
          />
        </div>
        {(admin) && (
          <>
            <label className="text-dark pt-4">For:</label>
            <select
              name="createdBy"
              id="createdBy"
              className="form-input col-12 col-md-12"
              value={formData.createdBy}
              onChange={handleSelectionChange}
            >
              <option value="">-- Select user --</option>
              {userOptions.map((user) => (
                <option key={user.value} value={user.value}>
                  {user.label}
                </option>
              ))}
            </select>
            <br />
          </>
        )}

        <label className="text-dark pt-4">Notes:</label>
        <textarea
          placeholder="Any additional information you'd like to include."
          name="description"
          id="description"
          className="form-input col-12 col-md-12"
          onChange={handleChange}
          value={jobText.description}
        ></textarea>
        Character Count: {characterCount}/280<br />
        <p
          className={`m-0 ${formError ? "text-error" : ""}`}
        >
          {formError && <span className="ml-2">{formError}</span>}
          {error && <span className="ml-2">Something went wrong...</span>}
        </p>
        <div className="w-75 mr-auto ml-auto text-center">
          <br />
          <button
            className="btn no-border-btn btn-primary mt-0 col-12 w-100 text-center"
            type="submit"
            disabled={meetingsLoading || selectedEvents.size === 0}
          >
            {meetingsLoading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </>
  );
};

export default JobForm;