// client/src/pages/admin/settings/ConstraintsSettings.js
import React from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
    QUERY_USER_ATTRIBUTE_DEFINITIONS,
    QUERY_CONSTRAINTS,
} from "../../../../utils/graphql/constraints/queries";
import {
    CREATE_CONSTRAINT,
    UPDATE_CONSTRAINT,
    DELETE_CONSTRAINT,
} from "../../../../utils/graphql/constraints/mutations";
import { GenericReportTable } from "../../../../components/reporting/GenericReportTable/GenericReportTable";
import { createColumnHelper } from "@tanstack/react-table";
import { ConstraintCreator } from "./ConstraintCreator";

export function ConstraintsView() {

    const {
        data: attributesData,
    } = useQuery(QUERY_USER_ATTRIBUTE_DEFINITIONS);

    const {
        data: constraintsData,
        loading: constraintsLoading,
        error: constraintsError,
        refetch: refetchConstraints,
    } = useQuery(QUERY_CONSTRAINTS);

    // Mutations
    const [createConstraint] = useMutation(CREATE_CONSTRAINT, {
        onCompleted: () => refetchConstraints(),
    });

    const [updateConstraint] = useMutation(UPDATE_CONSTRAINT, {
        onCompleted: () => refetchConstraints(),
    });

    const [deleteConstraint] = useMutation(DELETE_CONSTRAINT, {
        onCompleted: () => refetchConstraints(),
    });

    const [editingConstraint, setEditingConstraint] = React.useState(null);

    // --- Handlers ---
    const handleSubmitConstraint = async (e) => {
        e.preventDefault();
        console.log("Submitting constraint:", newConstraint);
        if (!newConstraint.name || !newConstraint.fieldKey || !newConstraint.operator) return;

        try {
            const payload = {
                name: newConstraint.name.trim(),
                description: newConstraint.description || null,
                fieldSource: "user",
                fieldKey: newConstraint.fieldKey,
                operator: newConstraint.operator,
                value: newConstraint.value ?? "",
                required: Boolean(newConstraint.required),
                active: true,
            };

            if (editingConstraint?._id) {
                await updateConstraint({
                    variables: { id: editingConstraint._id, input: payload },
                });
            } else {
                await createConstraint({
                    variables: { input: payload },
                });
            }
            handleCloseCreateConstraintModal();
        } catch (err) {
            console.error("Error saving constraint:", err);
        }
    };

    const handleDeleteConstraint = React.useCallback(async (id) => {
        if (!window.confirm("Delete this constraint?")) return;

        try {
            await deleteConstraint({ variables: { id } });
        } catch (err) {
            console.error("Error deleting constraint:", err);
        }
    }, [deleteConstraint]);


    const handleCloseCreateConstraintModal = React.useCallback(() => {
        setShowConstraintForm(false);
        setEditingConstraint(null);
        setNewConstraint({
            name: "",
            description: "",
            fieldKey: "",
            operator: "",
            value: "",
            required: false,
        });
    }, []);

    const handleEditConstraint = React.useCallback((constraint) => {
        setEditingConstraint(constraint);
        setNewConstraint({
            name: constraint.name ?? "",
            description: constraint.description ?? "",
            fieldKey: constraint.fieldKey ?? "",
            operator: constraint.operator ?? "",
            value: constraint.value ?? "",
            required: constraint.required ?? false,
        });
        setShowConstraintForm(true);
    }, []);

    const columnHelper = createColumnHelper();
    const constraintColumns = React.useMemo(() => [
        columnHelper.accessor("name", {
            header: "Name",
        }),
        columnHelper.accessor("fieldKey", {
            header: "Field",
        }),
        columnHelper.accessor("operator", {
            header: "Operator",
        }),
        columnHelper.accessor("value", {
            header: "Value",
        }),
        columnHelper.accessor("required", {
            header: "Required",
            cell: ({ getValue }) => getValue() ? "Yes" : "No",
        }),
        // Actions column
        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
                const constraint = row.original;
                return (
                    <div className="d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditConstraint(constraint)}
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteConstraint(constraint._id)}
                        >
                            Delete
                        </button>
                    </div>
                );
            },
            enableSorting: false,
            enableColumnFilter: false,
        }

    ], [columnHelper, handleDeleteConstraint, handleEditConstraint]);


    // --- Local form state ---
    const [newConstraint, setNewConstraint] = React.useState({
        name: "",
        description: "",
        fieldKey: "",
        operator: "EQUALS",
        value: "",
        required: false,
    });

    const constraints = constraintsData?.constraints ?? [];

    const attributes = attributesData?.userAttributeDefinitions ?? [];

    const [showConstraintForm, setShowConstraintForm] = React.useState(false);

    if (constraintsLoading) {
        return <div>Loading constraints...</div>;
    }

    if (constraintsError) {
        console.error(constraintsError);
    }

    return (
        <div className="mb-4">
            <GenericReportTable
                title="Rules"
                data={constraints}
                columns={constraintColumns}
                filterFns={{}}
                toolbarRight={

                    <button
                        className="btn btn-success"
                        onClick={() => {
                            setEditingConstraint(null);
                            setNewConstraint({
                                name: "",
                                description: "",
                                fieldKey: "",
                                operator: "",
                                value: "",
                                required: false,
                            });
                            setShowConstraintForm(true);
                        }}
                    >
                        Add Rule
                    </button>
                }
            />

            {showConstraintForm && (
                <ConstraintCreator
                    title={editingConstraint ? "Edit Rule" : "Add Rule"}
                    onClose={handleCloseCreateConstraintModal}
                    onSubmit={handleSubmitConstraint}
                    attributes={attributes}
                    newConstraint={newConstraint}
                    setNewConstraint={setNewConstraint}
                    mode={editingConstraint ? "edit" : "create"}
                />
            )}
        </div>
    );
}
