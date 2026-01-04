// JobReport.js (new)
import React from "react";
import { useQuery, useMutation } from "@apollo/client";
import { QUERY_ALL_JOBS } from "../utils/graphql/jobs/queries";
import { RUN_MATCH_ENGINE } from "../utils/graphql/jobs/mutations";
import { GenericReportTable } from "../components/reporting/GenericReportTable/GenericReportTable.js";
import SingleJobCard from "../components/SingleJobCard";
import { ModalForm } from "../components/Modal/ModalForm";
import { createColumnHelper } from "@tanstack/react-table";


export default function JobReport({ me }) {
    const { data } = useQuery(QUERY_ALL_JOBS);
    const [runMatchEngine] = useMutation(RUN_MATCH_ENGINE);
    const isAdmin = me?.admin;

    const jobs = React.useMemo(() => {
        return data?.jobs?.map(job => ({
            id: job._id,
            title: job.meetingSnapshot?.title,
            start: job.meetingSnapshot?.startDateTime,
            createdBy: job.createdBy?.username,
            assignedTo: job.assignedTo?.username,
            status: job.active ? "Open" : "Closed",
        })) || [];
    }, [data]);

    const filterFns = React.useMemo(() => ({
        equalsString: (row, columnId, filterValue) => {
            const rowValue = row.getValue(columnId);
            return String(rowValue).toLowerCase() === String(filterValue).toLowerCase();
        },
        equalsDate: (row, columnId, value) => {
            const rowDate = new Date(row.getValue(columnId)).setHours(0, 0, 0, 0);
            const filterDate = new Date(value).setHours(0, 0, 0, 0);
            return rowDate === filterDate;
        },
        beforeDate: (row, columnId, value) => {
            return new Date(row.getValue(columnId)) < new Date(value);
        },
        afterDate: (row, columnId, value) => {
            return new Date(row.getValue(columnId)) > new Date(value);
        },
        betweenDate: (row, columnId, range) => {
            const d = new Date(row.getValue(columnId));
            return d >= new Date(range.start) && d <= new Date(range.end);
        }
    }), []);

    const columnHelper = React.useMemo(() => createColumnHelper(), []);

    const columns = React.useMemo(() => [
        columnHelper.accessor("title", { header: "Meeting", filterFn: "includesString" }),
        columnHelper.accessor("start", {
            id: "date",
            header: "Date",
            meta: { type: "date" },
            filterFn: (row, columnId, filterValue, table) => {
                if (!filterValue) return true;

                if (filterValue.fn) {
                    return filterFns[filterValue.fn](
                        row,
                        columnId,
                        filterValue.value
                    );
                }

                return true; // no automatic filtering
            },
            cell: info => new Date(info.getValue()).toLocaleString([], {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        }),
        columnHelper.accessor("start", {
            id: "time",
            header: "Time",
            enableColumnFilter: false,
            disableFilters: true,
            cell: info => {
                const date = new Date(info.getValue());
                return date.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                });
            },
        }),
        columnHelper.accessor("createdBy", { header: "Peer Parent", filterFn: "includesString" }),
        columnHelper.accessor("assignedTo", { header: "Assigned To", filterFn: "includesString" }),
        columnHelper.accessor("status", { header: "Status", filterFn: "equalsString" }),
    ], [columnHelper, filterFns]);


    const today = new Date().toISOString().slice(0, 10);
    const initialFilters = [
        { id: "date", value: { fn: "afterDate", value: today } }
    ];

    const [selectedJob, setSelectedJob] = React.useState(null);

    return (
        <>
            <GenericReportTable
                data={jobs}
                columns={columns}
                filterFns={filterFns}
                initialFilters={initialFilters}
                onRowClick={(job) => setSelectedJob(job)}
                toolbarRight={
                    isAdmin && (
                        <button className="btn btn-info" onClick={runMatchEngine}>
                            Run Match Engine
                        </button>
                    )
                }
            />

            {selectedJob && (
                <ModalForm title="Sub Request Details" onClose={() => setSelectedJob(null)}>
                    <SingleJobCard me={me} jobId={selectedJob.id} />
                </ModalForm>
            )}
        </>
    );
}