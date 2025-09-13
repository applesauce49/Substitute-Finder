import { useState, useEffect } from "react";
import { CalendarView } from "../CalendarView";

const MeetingForm = ( {onClose} ) => {
    const [form, setForm] = useState({
        title: '',
        description: '',
        startDateTime: '',
        repeat: "None",
    });

    const [minDate, setMinDate] = useState(null);
    const [maxDate, setMaxDate] = useState(null);

    useEffect(() => {
        const today = new Date();
        const sixMonthsLater = new Date(today);
        sixMonthsLater.setMonth(today.getMonth() + 6);

        setMinDate(today);
        setMaxDate(sixMonthsLater);
    }, []);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

  const handleDatesChange = (values) => {
    // values is an array of DateObjects from the picker
    const formatted = values.map((d) =>
      d.toDate().toISOString().split("T")[0]
    );
    setForm((prev) => ({ ...prev, dates: formatted }));
  };

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: wire up form submission
        console.log("Form Submitted:", form);

        setForm({
            title: '',
            description: '',
            startDateTime: '',
            repeat: "None",
        });

        if (onClose) onClose();
    };

    return (
        <form className="card p-3 mb-4" onSubmit={handleSubmit}>
            <label className="mb-2">
                Title:
                <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className="form-control"
                />
            </label>

            <label className="mb-2">
                Description:
                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="form-control"
                />
            </label>

            <label className="mb-2">
                Start Date:
                <CalendarView
                    multiple
                    value={form.dates}
                    onChange={handleDatesChange}
                    minDate={minDate}
                    maxDate={maxDate}
                />
            </label>

            <label className="mb-2">
                Repeat:
                <select
                    name="repeat"
                    value={form.repeat}
                    onChange={handleChange}
                    className="form-control"
    >
                    <option value="None">None</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                </select>
            </label>

            <div className="d-flex justify-content-end gap-2 mt-3">

                <button type="submit" className="btn btn-success" enabled={form.title && form.startDateTime}>
                    Create Meeting
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                    Cancel
                </button>
            </div>
        </form>
    )
};

export default MeetingForm;