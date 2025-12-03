import React from "react";
import { useQuery } from "@apollo/client";
import { QUERY_MEETINGS } from "../../../utils/graphql/meetings/queries.js";
import { GenericReportTable } from "../../../components/reporting/GenericReportTable/GenericReportTable.js";
import { createColumnHelper } from "@tanstack/react-table";
import ImportMeetingsButton from "./UserSettings/ImportMeetingsButton.js";

export default function MeetingsSettings() {
  const { loading, error, data } = useQuery(QUERY_MEETINGS);

  const meetings = data?.meetings || [];

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor("summary", {
      header: "Summary",
      cell: (info) => info.getValue() || "—"
    }),
    columnHelper.accessor("description", {
      header: "description",
      cell: info => {
        const html = info.getValue(); // your HTML string
        console.log("Rendering description HTML:", html);
        return (
          <div
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      },
    }),
    columnHelper.accessor("gcalRecurringEventId", {
      header: "Series ID",
      cell: (info) => info.getValue() || "—"
    }),
    columnHelper.accessor(row => row.constraints.length, {
      id: "constraintCount",
      header: "Constraints",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("updatedAt", {
      header: "Updated",
      cell: (info) => new Date(info.getValue()).toLocaleString(),
    }),
  ];

  if (loading) return <p>Loading meetings…</p>;
  if (error) return <p>Error loading meetings.</p>;

  return (
    <div className="meetings-report">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Meetings</h2>
      </div>

      <GenericReportTable 
        columns={columns} 
        data={meetings} 
        toolbarRight={
          <ImportMeetingsButton />
        }  
      />

    </div>
  );
}