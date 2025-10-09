import React from "react";
import { useQuery } from "@apollo/client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { QUERY_MEETINGS } from "../../utils/queries";
import { formatDateLocal } from "../../utils/dateUtils";


const Calendar = () => {
  const { data, loading, error } = useQuery(QUERY_MEETINGS);

  if (loading) return <p>Loading your meetings...</p>
  if (error) return <p>Error: {error.message}</p>

  console.log("Data: ", data);
  // const eventSources = [];

  // // Primary calendar (with events)
  // if (data?.meetings) {
  //   eventSources.push({
  //     events: data?.meetings?.map(ev => ({
  //       _id: ev._id,
  //       title: ev.summary,
  //       start: ev.start?.dateTime || ev.start?.date,
  //       end: ev.end?.dateTime || ev.end?.date,
  //     })),
  //     color: "blue",
  //     textColor: "white"
  //   });

  const events = data.meetings.map((m) => ({
    id: m._id,
    title: m.title,
    start: formatDateLocal(m.startDateTime, true),
    end: formatDateLocal(m.endDateTime, true),
    extendedProps: {
      description: m.description,
      gcalEventId: m.gcalEventId,
    },
    color: "blue",
    textColor: "white"
  }));

  console.log("Events: ", events);

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
        events={events}
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
