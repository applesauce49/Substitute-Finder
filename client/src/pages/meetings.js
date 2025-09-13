import { useState } from "react";
import MeetingForm from "../components/MeetingForm";
import { QUERY_MEETINGS } from "../utils/queries";
import Calendar from "../components/Calendar";
import { useQuery } from "@apollo/client";

const Meetings = () => {
    const [showForm, setShowForm] = useState(false);
    const { data, loading } = useQuery(QUERY_MEETINGS);
    const meetings = data?.meetings || [];

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container py-4">
            <h1>Meetings</h1>
            <p>Here's where admins can create and manage meetings.</p>

            <button
                className="btn btn-primary mb-3"
                onClick={() => setShowForm(!showForm)}
            >
                {showForm ? "Cancel" : "Create New Meeting"}
            </button>

            {showForm && <MeetingForm onClose={() => setShowForm(false)} />}

            <div className="demos__container container container--wide">
                <h2 className="mb-3">Calendar</h2>
                <Calendar />
            </div>  
        </div>
    )
}

export default Meetings;
export { Meetings };