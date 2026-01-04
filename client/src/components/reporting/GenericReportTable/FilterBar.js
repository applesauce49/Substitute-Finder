import React from "react";
import { ActiveFilters, FilterPill, FilterModal } from "../Filtering";
import "../../../css/google-toolbar.css";

export default function FilterBar({ table, columnFilters, toolbarRight, getUniqueValues }) {
    const [filterModalOpen, setFilterModalOpen] = React.useState(false);

    return (
        <div className="app-font google-toolbar">
            <div className="d-flex align-items-center gap-2">

                {columnFilters && (
                    <>
                        <ActiveFilters
                            filters={columnFilters}
                            columns={table.getAllColumns()}
                            onRemove={(id) => {
                                const col = table.getColumn(id);
                                if (col) col.setFilterValue(undefined); // clear filter
                            }}
                        />
                    </>
                )}
                <FilterPill onClick={() => setFilterModalOpen(true)} />
            </div>
            <div className="flex-grow-1" />

            {toolbarRight && <div className="d-flex gap-2">{toolbarRight}</div>}

            <FilterModal
                open={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                onApply={(f) => {
                    const col = table.getColumn(f.id);
                    if (col) col.setFilterValue(f);
                }}
                columns={table.getAllColumns()}
                getUniqueValues={getUniqueValues}
            />
        </div>
    );
}
