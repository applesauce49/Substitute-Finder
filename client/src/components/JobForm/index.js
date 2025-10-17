import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { ADD_JOB } from "../../utils/mutations";
import { QUERY_EVENTS } from "../../utils/queries";
import CalendarListView from "../CalendarListView";

const JobForm = ({ onRefetch }) => {
  const { data, loading: meetingsLoading } = useQuery(QUERY_EVENTS, {
    variables: { calendarId: "primary" },
  });

  const meetings = data || [];

  console.log("QUERY_MEETINGS returned: ", meetings);

  const [jobText, setText] = useState({
    active: true,
    dates: [],
    description: "",
    meetings: [], // note plural
  });
  const [characterCount, setCharacterCount] = useState(0);

  const [{ error }] = useMutation(ADD_JOB, {
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

    if (!jobText.description.trim()) {
      setFormError(true);
      return;
    }
    else {
      setFormError(false);
    }

    try {
      console.log("jobText.meetings at submit: ", jobText.meetings);

      // for (const meeting of jobText.meetings) {
      //   console.log("Meeting info: ", meeting)
      //   const { data } = await addJob({
      //     variables: {
      //       dates: meeting.date,        // single string
      //       description: jobText.description,
      //       meeting: meeting.id,
      //     },
      //   });

      // if (data.addJob.conflict) {
      //   setPendingJob({
      //     newJob: {
      //       active: jobText.active,
      //       description: jobText.description,
      //       dates: [meeting.date],  // keep array shape consistent
      //       meeting: {
      //         id: meeting.id,
      //         date: meeting.date,
      //       },
      //     },
      //     existing: data.addJob.job,
      //   });
      //   setShowConflictModal(true);
      //   return;
      // }
      // }

      // reset
      setText({
        active: true,
        dates: [],
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