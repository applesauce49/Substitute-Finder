import React, { useState, useEffect } from "react";
import { useQuery, useLazyQuery } from "@apollo/client";
import { QUERY_CALENDARS, QUERY_EVENTS } from "../../utils/queries";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import bootstrap5Plugin from "@fullcalendar/bootstrap5";

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import "./index.css";

const Calendar = () => {
  // const { data, loading, error } = useQuery(QUERY_MEETINGS);
  const { data: calendarsData, loading: calendarsLoading, error: calendarsError } = useQuery(QUERY_CALENDARS);
  const [fetchEvents] = useLazyQuery(QUERY_EVENTS);
  const [allEvents, setAllEvents] = useState([]);

  const handleDateClick = (info) => {
    alert(`Clicked on date: ${info.dateStr}`);
  };

  const handleEventClick = (info) => {
    alert(`Meeting: ${info.event.title}`);
  };

  useEffect(() => {
    if (calendarsLoading) return;
    if (calendarsError) {
      console.error("Error loading calendars:", calendarsError);
      return;
    }
    if (!calendarsData?.googleCalendars) return;

    const loadAll = async () => {
      const all = [];

      for (const cal of calendarsData.googleCalendars) {
        try {
          const { data } = await fetchEvents({
            variables: { calendarId: cal.id },
          });

          if (data?.googleEvents) {
            const colored = data.googleEvents.map((ev) => ({
              ...ev,
              title: `${ev.summary} (${cal.summary})`,
              backgroundColor: cal.backgroundColor || "#3788d8",
              borderColor: cal.backgroundColor || "#3788d8",
              textColor: cal.foregroundColor || "white",
            }));
            all.push(...colored);
          }
        } catch (err) {
          console.error(`Error loading events for ${cal.summary}:`, err);
        }
      }

      setAllEvents(all);
    };

    loadAll();
  }, [calendarsLoading, calendarsData, calendarsError, fetchEvents]);

  return (
    <div >
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, bootstrap5Plugin]}
        themeSystem="bootstrap5"
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={allEvents}
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
