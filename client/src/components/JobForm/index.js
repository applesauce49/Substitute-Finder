import React, { useState, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { ADD_JOB, DEACTIVATE_JOB } from "../../utils/mutations";
import { QUERY_MY_EVENTS } from "../../utils/queries";
import { CalendarView } from "../CalendarView";
import { formatDateLocal } from "../../utils/dateUtils";

const JobForm = () => {
  const { loading: meetingsLoading, data: meetingsData } = useQuery(QUERY_MY_EVENTS);

  const myEvents = meetingsData?.myEvents || [];

  const meetingDates = new Set(
    myEvents.map(m => {
      const start = m.start?.dateTime || m.start?.date;
      return formatDateLocal(start);
    })
  );

  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingJob, setPendingJob] = useState(null);

  const [jobText, setText] = useState({
    active: true,
    dates: [],
    description: "",
    meetings: [], // note plural
  });
  const [characterCount, setCharacterCount] = useState(0);

  const [minDate, setMinDate] = useState(null);
  const [maxDate, setMaxDate] = useState(null);

  useEffect(() => {
    const today = new Date();
    const sixMonthsLater = new Date(today);
    sixMonthsLater.setMonth(today.getMonth() + 6);

    setMinDate(today);
    setMaxDate(sixMonthsLater);
  }, []);

  const [addJob, { error }] = useMutation(ADD_JOB, {
    update(cache, { data: { addJob } }) {
      if (addJob.conflict) return;
      const newJob = addJob.job;

      cache.modify({
        fields: {
          jobs(existingJobs = [], { args }) {
            if (!args?.username || args.username === newJob.createdBy.username) {
              const newJobRef = cache.writeFragment({
                data: newJob,
                fragment: gql`
                  fragment NewJob on Job {
                    _id
                    description
                    meeting
                    dates
                    active
                    createdBy {
                      _id
                      username
                      email
                    }
                  }
                `,
              });
              return [...existingJobs, newJobRef];
            }
            return existingJobs;
          },
        },
      });
    },
  });

  const [deactivateJob] = useMutation(DEACTIVATE_JOB);

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

    const handleDatesChange = (values) => {
    // values is an array of DateObjects from the picker
    const formatted = values.map((d) =>
      d.toDate().toISOString().split("T")[0]
    );
    setText((prev) => ({ ...prev, dates: formatted }));
  };

  // Handle FullCalendar event click (toggle meeting selection)
  // const handleEventClick = (info) => {
  //   const meetingId = info.event.id;
  //   setText((prev) => {
  //     const already = prev.meetings.includes(meetingId);
  //     return {
  //       ...prev,
  //       meetings: already
  //         ? prev.meetings.filter((id) => id !== meetingId)
  //         : [...prev.meetings, meetingId],
  //     };
  //   });
  // };

  // submit form
  const handleFormSubmit = async (event) => {
    event.preventDefault();

    try {
      for (const meetingId of jobText.meetings) {
        const { data } = await addJob({
          variables: {
            active: jobText.active,
            dates: jobText.dates, // adapt if you want per-meeting date
            description: jobText.description,
            meeting: meetingId,
          },
        });

        if (data.addJob.conflict) {
          setPendingJob({
            newJob: { ...jobText, meeting: meetingId },
            existing: data.addJob.job,
          });
          setShowConflictModal(true);
          return;
        }
      }

      // reset
      setText({
        active: true,
        dates: [],
        description: "",
        meetings: [],
      });
      setCharacterCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  if (meetingsLoading) return <p>Loading meetings...</p>;

  // transform meetings → FullCalendar events
  // const events = meetings.map((m) => ({
  //   id: m._id,
  //   title: m.title,
  //   start: m.startDateTime, // ensure ISO date string
  //   end: m.endDateTime,
  //   allDay: m.allDay || false,
  // }));

  return (
    <>
      <div className="card">
        <h5 className="card-header">Create a new Job!</h5>
        <div className="card-body m-2">
          <form
            className="flex-row justify-center justify-space-between-md align-stretch"
            onSubmit={handleFormSubmit}
          >
            <label className="text-dark">Dates:</label>
             <div className="meeting-calendar col-12 col-md-12">
            <CalendarView
              multiple
              meetings={meetingDates}
              onChange={handleDatesChange}
              minDate={minDate}
              maxDate={maxDate}
            />
             </div>
            <label className="text-dark">Description:</label>
            <textarea
              placeholder="Your responsibilities will be..."
              name="description"
              id="description"
              className="form-input col-12 col-md-12"
              onChange={handleChange}
              value={jobText.description}
            ></textarea>
            <p
              className={`m-0 ${characterCount === 280 || error ? "text-error" : ""}`}
            >
              Character Count: {characterCount}/280
              {error && <span className="ml-2">Something went wrong...</span>}
            </p>
            <div className="w-75 mr-auto ml-auto text-center">
              <br />
              <button
                className="btn no-border-btn btn-primary mt-0 col-12 w-100 text-center"
                type="submit"
              >
                Submit
              </button>
            </div>
          </form>

          {/* Conflict modal remains unchanged */}
          {showConflictModal && (
            <div className="modal show d-block" tabIndex="-1" role="dialog">
              <div className="modal-dialog" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Job Conflict</h5>
                    <button
                      type="button"
                      className="close"
                      onClick={() => setShowConflictModal(false)}
                    >
                      <span>&times;</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    <p>
                      You already have a job for this meeting.
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowConflictModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={async () => {
                        await deactivateJob({
                          variables: { jobId: pendingJob.existing._id, active: false },
                        });
                        await addJob({ variables: pendingJob.newJob });
                        setShowConflictModal(false);
                        setPendingJob(null);
                      }}
                    >
                      Replace Job
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default JobForm;