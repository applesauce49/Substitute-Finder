import React from "react";
import { useParams } from "react-router-dom";
import SingleJob from "../components/SingleJob";

export default function JobPage({ me }) {
    const { jobId } = useParams();

    return (
        <div className="container my-4">
            <SingleJob me={me} jobId={jobId} />
        </div>
    );
}