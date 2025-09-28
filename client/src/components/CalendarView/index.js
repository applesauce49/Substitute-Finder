import React from "react";
import { Calendar } from "react-multi-date-picker";
import "./CalendarView.css";
import { formatDateLocal } from "../../utils/dateUtils";

const CalendarView = ({
  value,
  onChange,
  meetings = new Set(),
  multiple = false,
  minDate,
  maxDate,
  ...props
}) => {
  return (
    <div className="calendar-view big-calendar">
      <Calendar
        multiple={multiple}
        value={value}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        mapDays={({ date }) => {
          const dateStr = formatDateLocal(date.toDate()); // use local format
          if (meetings.has(dateStr)) {
            return {
              className: "meeting-day",
              onClick: () => {
                alert(`Meetings available on ${dateStr}`);
              }
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