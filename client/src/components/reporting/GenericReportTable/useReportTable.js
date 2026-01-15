import React from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
} from "@tanstack/react-table";

export function useReportTable({ data, columns, filterFns, initialFilters, initialSorting }) {
    const [sorting, setSorting] = React.useState(initialSorting || []);
    const [columnFilters, setColumnFilters] = React.useState(initialFilters || []);

    const table = useReactTable({
        data,
        columns,
        state: { sorting, columnFilters },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        filterFns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return { table, sorting, setSorting, columnFilters, setColumnFilters };
}