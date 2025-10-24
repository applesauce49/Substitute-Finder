import React from "react";
import { useQuery } from "@apollo/client";
import { QUERY_ALL_JOBS } from "../utils/queries";
import {
    useReactTable,
    createColumnHelper,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
} from "@tanstack/react-table";
import 'bootstrap-icons/font/bootstrap-icons.css';

function JobReport() {
    const { loading, data, error } = useQuery(QUERY_ALL_JOBS);


    const jobs = React.useMemo(() => {
        // Transform the data into a flat, table-friendly format
        return data?.jobs?.map((job) => ({
            id: job._id,
            title: job.meetingSnapshot?.title || "Untitled",
            start: job.meetingSnapshot?.startDateTime,
            end: job.meetingSnapshot?.endDateTime,
            createdBy: job.createdBy?.username || "Unknown",
            assignedTo: job.assignedTo?.username || "Unassigned",
            status: job.active ? "Open" : "Closed",
            applicationCount: job.applications?.length || 0,
            createdAt: job.createdAt,
        })) || [];
    }, [data]);

    const meetings = React.useMemo(() => {
        const titles = jobs.map((job) => job.title || "Untitled");
        return ["all", ...new Set(titles)];
    }, [jobs]);

    const columnHelper = React.useMemo(() => createColumnHelper(), []);

    const columns = React.useMemo(() => [
        columnHelper.accessor("title", { header: "Meeting" }),
        columnHelper.accessor("start", {
            header: "Date",
            cell: info => new Date(info.getValue()).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric' })
        }),
        columnHelper.accessor("start", {
            header: "Time",
            cell: info => {
                const date = new Date(info.getValue());
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            },
        }),
        columnHelper.accessor("createdBy", { header: "Created By" }),
        columnHelper.accessor("assignedTo", { header: "Assigned To" }),
        columnHelper.accessor("applicationCount", { header: "Applications" }),
        columnHelper.accessor("status", { header: "Status" }),
        // columnHelper.accessor("createdAt", { header: "Created At" }),
    ], [columnHelper]);

    const [statusFilter, setStatusFilter] = React.useState("all");
    const [meetingFilter, setMeetingFilter] = React.useState("all");
    const [sorting, setSorting] = React.useState([]);


    const filteredJobs = React.useMemo(() => {
        return jobs.filter((job) => {
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "open" && job.status === "Open") ||
                (statusFilter === "closed" && job.status === "Closed");

            const matchesMeeting =
                meetingFilter === "all" ||
                job.title === meetingFilter;

            return matchesStatus && matchesMeeting; // && matchesSearch;
        });
    }, [jobs, statusFilter, meetingFilter]);

    const table = useReactTable({
        data: filteredJobs,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error loading job report.</div>;

    return (
        <div className="container my-4">
            <h2>Sub Report</h2>
            <div className="d-flex gap-3 mb-3">
                <div>
                    <label className="form-label">Meeting</label>
                    <select
                        className="form-select"
                        value={meetingFilter}
                        onChange={(e) => setMeetingFilter(e.target.value)}
                    >
                        {meetings.map((meeting) => (
                            <option key={meeting} value={meeting}>
                                {meeting === "all" ? "All" : meeting}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="form-label">Status</label>
                    <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
            </div>

            {/* ✅ Table */}
            <table className="table table-striped">
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    onClick={header.column.getToggleSortingHandler()}
                                    style={{ cursor: "pointer", userSelect: "none" }}
                                >
                                    {flexRender(header.column.columnDef.header, header.getContext())}

                                    {header.column.getIsSorted() === "asc" && (
                                        <i className="bi bi-caret-up-fill ms-2"></i>
                                    )}

                                    {header.column.getIsSorted() === "desc" && (
                                        <i className="bi bi-caret-down-fill ms-2"></i>
                                    )}

                                    {!header.column.getIsSorted() &&
                                        header.column.getCanSort() && (
                                            <i className="bi bi-caret-expand ms-2 text-muted"></i>
                                        )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default JobReport;