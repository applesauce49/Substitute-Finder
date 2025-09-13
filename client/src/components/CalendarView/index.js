import React from "react";
import { Calendar } from "react-multi-date-picker";
import "./CalendarView.css";

const CalendarView = ({
  value,
  onChange,
  meetings = [],
  multiple = false,
  minDate,
  maxDate,
  ...props
}) => {
  return (
    <div className="calendar-view">
      <Calendar
        multiple={multiple}
        value={value}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        mapDays={({ date }) => {
        const dateStr = date.toDate().toISOString().split("T")[0];
        const hasMeeting = meetings.some(
          (m) => m.startDateTime.split("T")[0] === dateStr
        );

        if (hasMeeting) {
          return {
            className: "meeting-day",
            style: { backgroundColor: "#0d6efd", color: "white", borderRadius: "50%" },
            onClick: () => {
              alert(
                meetings
                  .filter((m) => m.startDateTime.split("T")[0] === dateStr)
                  .map((m) => m.title)
                  .join("\n")
              );
            },
          };
        }
      }}
        {...props}
      />
    </div>
  );
};

export default CalendarView;
export { CalendarView };