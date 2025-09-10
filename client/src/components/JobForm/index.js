import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { useMutation } from "@apollo/client";
import { ADD_JOB } from "../../utils/mutations";
import { QUERY_JOBS, QUERY_ME } from "../../utils/queries";
import { Calendar } from "react-multi-date-picker";

const JobForm = () => {
  const { data: userData } = useQuery(QUERY_ME);
  const meeting = userData.me.meeting;
  const [jobText, setText] = useState({
    active: true,
    dates: [],
    description: "",
    meeting: meeting,
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
      // could potentially not exist yet, so wrap in a try/catch
      try {
        // update me array's cache
        const { me } = cache.readQuery({ query: QUERY_ME });

        cache.writeQuery({
          query: QUERY_ME,
          data: { me: { ...me, jobs: [...me.jobs, addJob] } },
        });
      } catch (e) {
        console.warn("First job insertion by user!");
      }

      // update job array's cache
      const { jobs } = cache.readQuery({ query: QUERY_JOBS });
      cache.writeQuery({
        query: QUERY_JOBS,
        data: { jobs: [addJob, ...jobs] },
      });
    },
  });

  // update state based on form input changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    setText({
      ...jobText,
      [name]: value,
    });
    console.log(jobText);
    if (document.getElementById("description").value.length <= 280) {
      setCharacterCount(document.getElementById("description").value.length);
    }
  };

  const handleDatesChange = (values) => {
    // values is an array of DateObjects from the picker
    const formatted = values.map((d) =>
      d.toDate().toISOString().split("T")[0]
    );
    setText((prev) => ({ ...prev, dates: formatted }));
  };

  // submit form
  const handleFormSubmit = async (event) => {
    event.preventDefault();

    try {
      for (const date of jobText.dates) {
        await addJob({
          variables: {
            ...jobText,
            dates: date,
          },
        });
      }

      // clear form value
      setText({
        active: true,
        dates: [],
        description: "",
        meeting: meeting,
      });
      setCharacterCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="text-center mb-3">
        <a href="#job-list">
          <button className="btn hide"> View Your Jobs</button>
        </a>
      </div>
      <div className="card">
        <h5 className="card-header">Create a new Job!</h5>
        <div className="card-body m-2">
          <form
            className="flex-row justify-center justify-space-between-md align-stretch"
            onSubmit={handleFormSubmit}
          >
            <label className="text-dark">Meeting:</label>
            <input
              type="text"
              id="meeting"
              name="meeting"
              placeholder="Enter meeting name"
              className="form-input col-12 col-md-12"
              value={jobText.meeting}
              onChange={handleChange}
            />
            <label className="text-dark">Dates:</label>
            <Calendar
              multiple
              value={jobText.dates}
              onChange={handleDatesChange}
              minDate={minDate}
              maxDate={maxDate}
            />

            <label className="text-dark">Description:</label>
            <textarea
              placeholder="Your responsibilities will be..."
              name="description"
              id="description"
              className="form-input col-12 col-md-12"
              onChange={handleChange}
            ></textarea>
            <p
              className={`m-0 ${characterCount === 280 || error ? "text-error" : ""
                }`}
            >
              Character Count: {characterCount}/280
              {error && <span className="ml-2">Something went wrong...</span>}
            </p>
            <div className="w-75 mr-auto ml-auto text-center">
              <br />
              <button className="btn no-border-btn btn-primary mt-0 col-12 w-100 text-center" type="submit">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default JobForm;
