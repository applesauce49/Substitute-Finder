import React from "react";
import { useQuery } from "@apollo/client";
import { useMutation } from "@apollo/client";
import {
    RUN_MATCH_ENGINE,
} from "../utils/mutations";
import { QUERY_ME, QUERY_ALL_JOBS } from "../utils/queries";
import {
    useReactTable,
    createColumnHelper,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
    getFilteredRowModel,
} from "@tanstack/react-table";
import 'bootstrap-icons/font/bootstrap-icons.css';
import FilterPill from "../components/FilterPill";
import FilterModal from "../components/FilterModal/FilterModal";
import ActiveFilters from "../components/filters/ActiveFilters";

function JobReport() {
    const { loading, data, error, refetch } = useQuery(QUERY_ALL_JOBS);
    const { data: meData } = useQuery(QUERY_ME);
    const me = meData?.me || {};
    const isAdmin = me?.admin === true;

    const [runMatchEngine] = useMutation(RUN_MATCH_ENGINE);

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const [columnFilters, setColumnFilters] = React.useState([
        {
            id: "date",
            value: {
                fn: "afterDate",
                value: today
            }
        }
    ]);
    const [filterModalOpen, setFilterModalOpen] = React.useState(false);

    const handleApplyFilter = (filter) => {
        const col = table.getColumn(filter.id);
        if (!col) return;

        const columnDef = col.columnDef;
        const isDateColumn = columnDef?.meta?.type === "date";

        if (isDateColumn) {
            if (filter.operator === "equals") {
                col.setFilterValue({ fn: "equalsDate", value: filter.value });
            }
            if (filter.operator === "after") {
                col.setFilterValue({ fn: "afterDate", value: filter.value });
            }
            if (filter.operator === "before") {
                col.setFilterValue({ fn: "beforeDate", value: filter.value });
            }
            if (filter.operator === "between") {
                col.setFilterValue({ fn: "betweenDate", value: filter.value });
            }
            return;
        }

        // Non-date fallback
        if (filter.operator === "contains") {
            col.setFilterValue(filter.value);
        } else if (filter.operator === "equals") {
            col.setFilterValue(filter.value);
        }
    };

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

    const columnHelper = React.useMemo(() => createColumnHelper(), []);
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

    const [sorting, setSorting] = React.useState(
        [
            { id: "date", desc: false }, // 👈 sort by 'start' ascending
        ]
    );

    const table = useReactTable({
        data: jobs,
        columns,
        state: { sorting, columnFilters },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        filterFns,
    });

    const [reloading, setReloading] = React.useState(false);

    const handleRunMatchEngine = async (event) => {
        event.preventDefault();
        setReloading(true);
        try {
            await runMatchEngine();
            await refetch();
        } finally {
            setReloading(false);
        }
    };

    const getUniqueValues = (columnId) => {
        const col = table.getColumn(columnId);
        if (!col) return [];

        const values = table
            .getPreFilteredRowModel()
            .flatRows.map(row => row.getValue(columnId));

        return [...new Set(values.filter(v => v != null))];
    };

    if (loading) return <div><h1>Loading...</h1></div>;
    if (reloading) return <div><h1>Loading...</h1></div>;
    if (error) return <div><h1>Error loading job report.</h1></div>;

    return (
        <div className="my-4">
            <h2>Master Sub List</h2>
            <div className="google-toolbar">
                <div className="d-flex justify-content-start align-items-center gap-2">
                <ActiveFilters
                    filters={columnFilters}
                    columns={table.getAllColumns()}
                    onRemove={(id) => {
                        const col = table.getColumn(id);
                        if (col) col.setFilterValue(undefined); // clear filter
                    }}
                />
                <FilterPill onClick={() => setFilterModalOpen(true)} />
                </div>
                <div className="flex-grow-1" />

                {isAdmin && (
                    <div className="d-flex justify-content-end align-items-center gap-2">
                        <form onSubmit={handleRunMatchEngine}>
                            <button
                                className="btn no-border-btn btn-info"
                                type="submit"
                            >
                                Run Match Engine
                            </button>
                        </form>
                    </div>
                )}
            </div>
            <FilterModal
                open={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                onApply={handleApplyFilter}
                columns={table.getAllColumns()}
                getUniqueValues={getUniqueValues}
            />

            {/* ✅ Table */}
            <table className="table table-striped" style={{ fontFamily: 'Roboto, sans-serif' }}>
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