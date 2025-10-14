import React, { useState, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { ADD_JOB, CANCEL_JOB } from "../../utils/mutations";
import { QUERY_MEETINGS } from "../../utils/queries";
import { CalendarView } from "../CalendarView";
import { formatDateLocal } from "../../utils/dateUtils";
import MeetingSelectModal from "../MeetingSelectModal";

const JobForm = ({ onRefetch }) => {
  const { loading: meetingsLoading, data: meetingsData } = useQuery(QUERY_MEETINGS);

  const meetings = meetingsData?.meetings || [];

  const meetingsByDate = new Map();

  for (const m of meetings) {
    const date = formatDateLocal(m.startDateTime);
    if (!meetingsByDate.has(date)) {
      meetingsByDate.set(date, []);
    }
    meetingsByDate.get(date).push(m);
  }
  const meetingDates = new Set(meetingsByDate.keys());

  console.log(`meetingDates:`, meetingDates);

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

  const NEW_JOB_FRAGMENT = gql`
  fragment NewJob on Job {
    __typename
    _id
    active
    description
    dates
    createdAt
    createdBy {
      __typename
      _id
      username
      email
    }
    meeting {
      __typename
      _id
      title
      startDateTime
    }
    applicationCount
  }
`;

  const [addJob, { error }] = useMutation(ADD_JOB, {
    update(cache, { data }) {
      const payload = data?.addJob;
      if (!payload || payload.conflict || !payload.job) return;

      const newJob = payload.job;

      // // 1) Append to the global jobs list (QUERY_JOBS) if it's in the cache
      // try {
      //   cache.updateQuery({ query: QUERY_JOBS }, (prev) => {
      //     if (!prev?.jobs) return prev;
      //     if (prev.jobs.some(j => j._id === newJob._id)) return prev;
      //     return { ...prev, jobs: [...prev.jobs, newJob] };
      //   });
      // } catch {
      //   // QUERY_JOBS might not be in cache yet; that's fine.
      // }

      // // 2) Append to me.jobs if the creator is the current user and 'me' is in cache
      // try {
      //   cache.updateQuery({ query: QUERY_ME }, (prev) => {
      //     if (!prev?.me) return prev;
      //     if (newJob.createdBy?._id !== prev.me._id) return prev;
      //     const already = (prev.me.jobs || []).some(j => j._id === newJob._id);
      //     if (already) return prev;
      //     return { ...prev, me: { ...prev.me, jobs: [...(prev.me.jobs || []), newJob] } };
      //   });
      // } catch {
      //   // QUERY_ME not in cache; ignore.
      // }

      // 3) (Optional) Also normalize a ref so later reads are consistent
      cache.writeFragment({
        data: newJob,
        fragment: NEW_JOB_FRAGMENT,
      });
    },
  });

  const [cancelJob] = useMutation(CANCEL_JOB);

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

  const [modalState, setModalState] = useState({
    open: false,
    date: null,
    meetings: [],
  });

  const [formError, setFormError] = useState(false);


  const openMeetingSelectModal = ({ date, meetings }) => {
    setModalState({ open: true, date, meetings });
  };

  const handleDatesChange = (values) => {
    console.log("Got values: ", values);

    // Normalize selected dates
    const selectedDates = values.map((d) =>
      formatDateLocal(d)
    );
    console.log("sselectedDates: ", selectedDates);
    console.log("meetingsByDate: ", meetingsByDate);

    const selectedMeetings = [];

    for (const date of selectedDates) {
      const meetingsOnDate = meetingsByDate.get(date) || [];

      if (meetingsOnDate.length === 1) {
        // ✅ exactly one — auto select it
        selectedMeetings.push({ id: meetingsOnDate[0]._id, date });
      } else if (meetingsOnDate.length > 1) {
        // 🚨 multiple — show modal here
        openMeetingSelectModal({ date, meetings: meetingsOnDate });
      }
    }

    console.log("Selected Meetings: ", selectedMeetings);
    setText((prev) => ({
      ...prev,
      dates: selectedDates,
      meetings: selectedMeetings,
    }));
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

      for (const meeting of jobText.meetings) {
        console.log("Meeting info: ", meeting)
        const { data } = await addJob({
          variables: {
            dates: meeting.date,        // single string
            description: jobText.description,
            meeting: meeting.id,
          },
        });

        if (data.addJob.conflict) {
          setPendingJob({
            newJob: {
              active: jobText.active,
              description: jobText.description,
              dates: [meeting.date],  // keep array shape consistent
              meeting: {
                id: meeting.id,
                date: meeting.date,
              },
            },
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
      <div className="card">
        <h5 className="card-header">Create a new Job!</h5>
        <div className="card-body m-2">
          <form
            className="flex-row justify-center justify-space-between-md align-stretch"
            onSubmit={handleFormSubmit}
          >
            <label className="text-dark">Dates:</label>
            <div className="meeting-calendar d-flex justify-content-center align-items-center col-12 col-md-12">
              <CalendarView
                multiple
                meetings={meetingsByDate}
                onChange={handleDatesChange}
                minDate={minDate}
                maxDate={maxDate}
              />
            </div>
            <label className="text-dark">Reason:</label>
            <textarea
              placeholder="Required"
              name="description"
              id="description"
              className="form-input col-12 col-md-12"
              onChange={handleChange}
              value={jobText.description}
            ></textarea>
            <p
              className={`m-0 ${characterCount === 280 || formError ? "text-error" : ""}`}
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
                disabled={meetingsLoading || !jobText.dates || jobText.dates.length === 0}
              >
                {meetingsLoading ? "Submitting..." : "Submit"}
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
                        await cancelJob({
                          variables: { jobId: pendingJob.existing._id, active: false },
                        });

                        await addJob({
                          variables: {
                            active: pendingJob.newJob.active,
                            dates: [pendingJob.newJob.meeting.date],   // ensure single date
                            description: pendingJob.newJob.description,
                            meeting: pendingJob.newJob.meeting.id,     // meeting id
                          },
                        });

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
      <MeetingSelectModal
        isOpen={modalState.open}
        date={modalState.date}
        meetings={modalState.meetings}
        onClose={() => setModalState({ open: false, date: null, meetings: [] })}
        onConfirm={(chosenMeetings) => {
          setText((prev) => ({
            ...prev,
            dates: [
              ...prev.dates,
              ...chosenMeetings.map(() => modalState.date), // one date per meeting
            ],
            meetings: [
              ...prev.meetings,
              ...chosenMeetings.map((m) => ({ id: m._id, date: modalState.date })),
            ],
          }));
          setModalState({ open: false, date: null, meetings: [] });
        }}
      />

    </>
  );
};

export default JobForm;