import React from "react";
import { useParams } from "react-router-dom";
import SingleJob from "../components/SingleJob";

export default function JobPage() {
    const { jobId } = useParams();

    return (
        <div className="container my-4">
            <SingleJob jobId={jobId} />
        </div>
    );
}