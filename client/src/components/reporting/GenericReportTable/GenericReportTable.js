import React from "react";
import { flexRender } from "@tanstack/react-table";
import FilterBar from "./FilterBar.js";
import { useReportTable } from "./useReportTable.js";

export function GenericReportTable({
    title,
    data,
    columns,
    filterFns,
    initialFilters,
    initialSorting,
    onRowClick,
    toolbarRight,
    // getUniqueValues,
}) {
    const { table } = useReportTable({
        data,
        columns,
        filterFns,
        initialFilters,
        initialSorting,
    });

    const getUniqueValues = (columnId) => {
        const col = table.getColumn(columnId);
        if (!col) return [];

        const values = table
            .getPreFilteredRowModel()
            .flatRows.map(row => row.getValue(columnId));

        return [...new Set(values.filter(v => v != null))];
    };



    return (
        <div className="app-font my-4">
            <h4>{title}</h4>
            {/* ✅ Toolbar */}
            { (filterFns || toolbarRight) && (
                <FilterBar
                table={table}
                columnFilters={table.getState().columnFilters}
                toolbarRight={toolbarRight}
                getUniqueValues={getUniqueValues}
            />)}

            {/* ✅ Table */}
            <table className="app-font table table-striped">
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                const sorted = header.column.getIsSorted();

                                return (
                                    <th
                                        key={header.id}
                                        onClick={header.column.getToggleSortingHandler()}
                                        style={{ cursor: "pointer", userSelect: "none" }}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}

                                        {sorted === "asc" && <i className="bi bi-caret-up-fill ms-2"></i>}
                                        {sorted === "desc" && <i className="bi bi-caret-down-fill ms-2"></i>}
                                        {!sorted && header.column.getCanSort() && (
                                            <i className="bi bi-caret-expand ms-2 text-muted"></i>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>

                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} onClick={() => onRowClick?.(row.original)}>
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
