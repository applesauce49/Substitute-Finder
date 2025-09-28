import React from "react";
import { useQuery } from "@apollo/client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { QUERY_MY_CALENDARS } from "../../utils/queries";


const Calendar = () => {
  const { data, loading, error } = useQuery(QUERY_MY_CALENDARS);

  if (loading) return <p>Loading your meetings...</p>
  if (error) return <p>Error: {error.message}</p>

  const eventSources = [];

  // Primary calendar (with events)
  if (data?.myCalendars?.primary) {
    eventSources.push({
      events: data.myCalendars.primary.events.map(ev => ({
        _id: ev._id,
        title: ev.summary,
        start: ev.start?.dateTime || ev.start?.date,
        end: ev.end?.dateTime || ev.end?.date,
      })),
      color: "blue",
      textColor: "white"
    });
  }

  // Other calendars (metadata only for now)
  (data?.myCalendars?.others || []).forEach(cal => {
    eventSources.push({
      url: `/google-api-proxy/${cal._id}`,  // placeholder: later you can fetch via Google API
      color: cal.color || "gray",
      textColor: "white"
    });
  });

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
        eventSources={eventSources}
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
