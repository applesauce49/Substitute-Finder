// client/src/pages/admin/settings/ConstraintsSettings.js
import React from "react";
import { useQuery, useMutation } from "@apollo/client";
import { createColumnHelper } from "@tanstack/react-table";

import { QUERY_CONSTRAINTS_GROUPS, QUERY_CONSTRAINTS } from "../../../../utils/graphql/constraints/queries";
import {
    CREATE_CONSTRAINT_GROUP,
    UPDATE_CONSTRAINT_GROUP,
    DELETE_CONSTRAINT_GROUP,
} from "../../../../utils/graphql/constraints/mutations";

import { GenericReportTable } from "../../../../components/reporting/GenericReportTable/GenericReportTable";
import { ConstraintGroupCreator } from "./ConstraintGroupCreator";

export function ConstraintGroupsView() {
    // --- Queries ---
    const {
        data: groupsData,
        loading: groupsLoading,
        error: groupsError,
        refetch: refetchGroups,
    } = useQuery(QUERY_CONSTRAINTS_GROUPS);

    const {
        data: constraintsData,
        loading: constraintsLoading,
        error: constraintsError,
    } = useQuery(QUERY_CONSTRAINTS);

    // --- Mutations ---
    const [createConstraintGroup] = useMutation(CREATE_CONSTRAINT_GROUP, {
        onCompleted: () => refetchGroups(),
    });

    const [updateConstraintGroup] = useMutation(UPDATE_CONSTRAINT_GROUP, {
        onCompleted: () => refetchGroups(),
    });

    const [deleteConstraintGroup] = useMutation(DELETE_CONSTRAINT_GROUP, {
        onCompleted: () => refetchGroups(),
    });

    // --- Local state ---
    const [showConstraintGroupForm, setShowConstraintGroupForm] = React.useState(false);
    const [editingGroup, setEditingGroup] = React.useState(null);

    const [newRulesGroup, setNewRulesGroup] = React.useState({
        name: "",
        constraintIds: [],
    });

    const groups = groupsData?.constraintGroups ?? groupsData?.constraintsGroups ?? [];
    const constraints = constraintsData?.constraints ?? [];

    // --- Handlers ---
    const handleCloseCreateConstraintGroupModal = React.useCallback(() => {
        console.log("Closing constraint group modal");
        setShowConstraintGroupForm(false);
        setEditingGroup(null);
        setNewRulesGroup({
            name: "",
            constraintIds: [],
        });
    }, []);

    const handleSubmitConstraintGroup = React.useCallback(
        async (e) => {
            e.preventDefault();

            console.log("Submitting constraint group:", newRulesGroup);

            const trimmedName = newRulesGroup.name.trim();
            if (!trimmedName || !newRulesGroup.constraintIds?.length) return;

            try {
                if (editingGroup?._id) {
                    await updateConstraintGroup({
                        variables: {
                            id: editingGroup._id,
                            input: {
                                name: trimmedName,
                                constraintIds: newRulesGroup.constraintIds,
                            },
                        },
                    });
                } else {
                    await createConstraintGroup({
                        variables: {
                            input: {
                                name: trimmedName,
                                constraintIds: newRulesGroup.constraintIds,
                            },
                        },
                    });
                }

                handleCloseCreateConstraintGroupModal();
            } catch (err) {
                console.error("Error saving constraint group:", err);
            }
        },
        [createConstraintGroup, updateConstraintGroup, editingGroup, newRulesGroup, handleCloseCreateConstraintGroupModal]
    );

    const handleEditConstraintGroup = React.useCallback(
        (group) => {
            console.log("Editing constraint group:", group);
            setEditingGroup(group);
            setNewRulesGroup({
                name: group.name ?? "",
                constraintIds: group.constraintIds ?? group.constraints?.map((c) => c._id) ?? [],
            });
            setShowConstraintGroupForm(true);
        },
        []
    );

    const handleDeleteConstraintGroup = React.useCallback(
        async (id) => {
            if (!window.confirm("Delete this constraint group?")) return;

            try {
                await deleteConstraintGroup({ variables: { id } });
            } catch (err) {
                console.error("Error deleting constraint group:", err);
            }
        },
        [deleteConstraintGroup]
    );

    // --- Table columns ---
    const columnHelper = createColumnHelper();

    const groupColumns = React.useMemo(
        () => [
            columnHelper.accessor("name", { header: "Name" }),
            columnHelper.accessor(
                (row) => row.constraints?.length ?? 0,
                { id: "constraintCount", header: "# Constraints" }
            ),
            columnHelper.accessor((row) => {
                const names = row.constraints?.map((c) => c.name) ?? [];
                return names.join(", ");
            }, {
                id: "constraints",
                header: "Constraints",
                cell: ({ getValue }) => getValue() || "—",
            }),
            {
                id: "actions",
                header: "",
                cell: ({ row }) => (
                    <div className="d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditConstraintGroup(row.original)}
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteConstraintGroup(row.original._id)}
                        >
                            Delete
                        </button>
                    </div>
                ),
                enableSorting: false,
                enableColumnFilter: false,
            },
        ],
        [columnHelper, handleDeleteConstraintGroup, handleEditConstraintGroup]
    );

    // --- Loading/errors ---
    if (groupsLoading || constraintsLoading) return <div>Loading…</div>;
    if (groupsError) console.error(groupsError);
    if (constraintsError) console.error(constraintsError);

    return (
        <div className="mb-4">
            <GenericReportTable
                title="Constraint Groups"
                data={groups}
                columns={groupColumns}
                filterFns={{}}
                toolbarRight={
                    <button
                        className="btn btn-success"
                        onClick={() => {
                            setEditingGroup(null);
                            setNewRulesGroup({ name: "", constraintIds: [] });
                            setShowConstraintGroupForm(true);
                        }}
                    >
                        Add Constraint Group
                    </button>
                }
            />

            {showConstraintGroupForm && (
                <ConstraintGroupCreator
                    title={editingGroup ? "Edit Constraint Group" : "Add Constraint Group"}
                    onClose={handleCloseCreateConstraintGroupModal}
                    onSubmit={handleSubmitConstraintGroup}
                    constraints={constraints}
                    newRulesGroup={newRulesGroup}
                    setNewRulesGroup={setNewRulesGroup}
                    mode={editingGroup ? "edit" : "create"}
                />
            )}
        </div>
    );
}
