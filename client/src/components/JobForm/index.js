import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { ADD_JOB } from "../../utils/mutations";
import { QUERY_EVENTS, QUERY_ME } from "../../utils/queries";

import CalendarListView from "../CalendarListView";

const JobForm = ({ onRefetch }) => {
  const { data, loading: meetingsLoading } = useQuery(QUERY_EVENTS, {
    variables: { calendarId: "primary" },
  });
  const { data: userData } = useQuery(QUERY_ME);

  const admin = userData?.me.admin || "";
  const meetings = data || [];
  const events = data?.googleEvents || [];

  console.log ("Events from JobForm: ", events);
  const [jobText, setText] = useState({
    active: true,
    description: "",
    meetings: [], // note plural
  });
  const [characterCount, setCharacterCount] = useState(0);

  const [addJob, { error }] = useMutation(ADD_JOB, {
    update(cache, { data }) {
      const payload = data?.addJob;
      if (!payload || payload.conflict || !payload.job) return;
    },
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

  const [formError, setFormError] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState(new Set());

  const handleEventClick = (info) => {
    const id = info.event.id;
    const newSet = new Set(selectedEvents);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedEvents(newSet);
  };

  // submit form
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setFormError(false);
    const meetingsMap = new Map(events.map(e => [e.id, e]));
    try {
      console.log("jobText.meetings at submit: ", jobText.meetings);

      for (const event of selectedEvents) {
        console.log("Adding job with meeting data ", meetingsMap.get(event));
        const meeting = meetingsMap.get(event);

        const { data } = await addJob({
          variables: {
            description: jobText.description,
            meeting: meeting.id,
          },
        });

        if (data.addJob.conflict) {
          alert("Meeting conflict");
          return;
        }
      }

      // reset
      setText({
        active: true,
        description: "",
        meetings: [], // stays an array of {id, date}, just emptied
      });
      setCharacterCount(0);
    } catch (e) {
      console.error(e);
    }
    onRefetch();
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
              onChange={handleChange}
            >
              <option value={userData?.me._id}>{userData?.me.username}</option>
            </select>
            <br/>
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
        <p
          className={`m-0 ${formError ? "text-error" : ""}`}
        >
          Character Count: {characterCount}/280<br />
          {formError && <span className="ml-2">Reason is required...</span>}
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