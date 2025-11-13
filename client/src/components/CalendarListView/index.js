import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import bootstrap5Plugin from "@fullcalendar/bootstrap5";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./CalendarListView.css";

export default function FullCalendarList({
    meetings = new Map(),
    selectedEvents = new Set(),
    onEventClick,
}) {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (meetings?.googleEvents) {
            // Normalize to FullCalendar event format
            const fcEvents = meetings.googleEvents.map((e) => ({
                id: e.id,
                title: e.summary || "(No title)",
                start: e.start,
                end: e.end,
                description: e.description || "",
            }));
            setEvents(fcEvents);
        }
    }, [meetings]);

    return (
        <div className="container mt-4 calendar-wrapper small-calendar"
            style={{ paddingTop: 0 }}
        >
            <FullCalendar
                plugins={[listPlugin, interactionPlugin, bootstrap5Plugin]}
                themeSystem="bootstrap5"
                selectable="true"
                initialView="listMonth"
                listDayFormat={
                    { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                    }
                }
                height="400px"
                events={events}
                validRange={() => {
                    const now = new Date();
                    const endRange = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
                    return {
                        start: now.toISOString().split("T")[0],
                        end: endRange.toISOString().split("T")[0],
                    };
                }}
                eventClick={onEventClick}
                eventContent={(arg) => {
                    const isSelected = selectedEvents.has(arg.event.id);

                    return (
                        <div style={{ display: "flex", alignItems: "center" }}>
                            {isSelected && (
                                <i
                                    className="bi bi-check-lg text-success me-1"
                                    aria-hidden="true"
                                    title="Selected"
                                />
                            )}
                            <div>
                                {arg.event.title}
                                {arg.event.extendedProps.description && (
                                    <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                                        {arg.event.extendedProps.description}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }}
                headerToolbar={{
                    left: "prev,next",
                    center: "title",
                    right: "listMonth,listWeek",
                }}
                views={{
                    listMonth: { buttonText: "Month" },
                    listWeek: { buttonText: "Week" }
                }}
            />
        </div>
    );
}