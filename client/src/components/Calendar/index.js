import React from "react";
import { useQuery } from "@apollo/client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { QUERY_MY_EVENTS } from "../../utils/queries";

// import "@fullcalendar/daygrid/index.css";
// import "@fullcalendar/timegrid/index.css";

const Calendar = ({ }) => {
  const { data, loading, error } = useQuery(QUERY_MY_EVENTS);

  if (loading) return <p>Loading your meetings...</p>
  if (error) return <p>Error: {error.message}</p>

    // GraphQL returns start/end as objects (dateTime, timeZone), so pass them through
    const meetings = (data?.myEvents || []).map(ev => ({
        id: ev.id,
        title: ev.summary,
        start: ev.start?.dateTime || ev.start?.date,
        end: ev.end?.dateTime || ev.end?.date,
    }));

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
        editable={false}
        selectable={true}
        height="auto"
      />
    </div>
  );
}

export default Calendar;
