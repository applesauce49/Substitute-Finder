import React from "react";
import { Calendar } from "react-multi-date-picker";
import "./CalendarView.css";
import { formatDateLocal } from "../../utils/dateUtils";

const CalendarView = ({
  value,
  onChange,
  meetings = new Map(),
  multiple = false,
  minDate,
  maxDate,
  ...props
}) => {
  return (
    <div className="calendar-view big-calendar">
      <Calendar
        mainPosition="bottom"
        relativePosition="center"
        multiple={multiple}
        color="red"
        value={value}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        mapDays={({ date }) => {
          const dateStr = formatDateLocal(date.toDate()); // use local format

          const meetingInfo = meetings.get(dateStr);

          if (meetingInfo) {
            const tooltipText = Array.isArray(meetingInfo)
              ? meetingInfo.map(m => m.title || "Untitled").join("\n")
              : "Meeting scheduled";
            
            return {
              className: "meeting-day",
              title: tooltipText,
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