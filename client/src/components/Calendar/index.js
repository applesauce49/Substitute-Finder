import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// Demo meetings data
const initialMeetings = [
  {
    id: "1",
    title: "Team Standup",
    start: "2025-09-12T09:00:00",
    end: "2025-09-12T09:30:00",
  },
  {
    id: "2",
    title: "Client Call",
    start: "2025-09-13T13:00:00",
    end: "2025-09-13T14:00:00",
  },
  {
    id: "3",
    title: "Architecture Review",
    start: "2025-09-15T15:00:00",
    end: "2025-09-15T16:30:00",
  },
];

const Calendar = ({}) => {
  const [meetings, setMeetings] = useState(initialMeetings);

  const handleDateClick = (info) => {
    alert(`Clicked on date: ${info.dateStr}`);
  };

  const handleEventClick = (info) => {
    alert(`Meeting: ${info.event.title}`);
  };

  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={meetings}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        editable={true}
        selectable={true}
      />
    </div>
  );
}

export default Calendar;
