// client/src/pages/admin/settings/ConstraintsSettings.js
import React from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
    QUERY_USER_ATTRIBUTE_DEFINITIONS,
    QUERY_CONSTRAINTS,
} from "../../../../utils/graphql/constraints/queries";
import {
    CREATE_CONSTRAINT,
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
    const [createConstraint] =
        useMutation(CREATE_CONSTRAINT, {
            onCompleted: () => refetchConstraints(),
        });

    const [deleteConstraint] = useMutation(DELETE_CONSTRAINT, {
        onCompleted: () => refetchConstraints(),
    });

    // --- Handlers ---
    const handleCreateConstraint = async (e) => {
        e.preventDefault();
        console.log("Submitting constraint:", newConstraint);
        if (!newConstraint.name || !newConstraint.fieldKey || !newConstraint.operator) return;

        try {
            console.log("Creating constraint with:", newConstraint);
            await createConstraint({
                variables: {
                    input: {
                        name: newConstraint.name.trim(),
                        description: newConstraint.description || null,
                        fieldSource: "user",
                        fieldKey: newConstraint.fieldKey,
                        operator: newConstraint.operator,
                        value: newConstraint.value ?? "",
                        active: true,
                    },
                },
            });
            handleCloseCreateConstraintModal();
        } catch (err) {
            console.error("Error creating constraint:", err);
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


    const handleCloseCreateConstraintModal = () => {
        setShowConstraintForm(false);
        setNewConstraint({
            name: "",
            description: "",
            fieldKey: "",
            operator: "",
            value: "",
        });
    };

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
        // Actions column
        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
                const constraint = row.original;
                return (
                    <div className="text-end">
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

    ], [columnHelper, handleDeleteConstraint]);


    // --- Local form state ---
    const [newConstraint, setNewConstraint] = React.useState({
        name: "",
        description: "",
        fieldKey: "",
        operator: "EQUALS",
        value: "",
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
                title="User Constraints"
                data={constraints}
                columns={constraintColumns}
                filterFns={{}}
                toolbarRight={

                    <button className="btn btn-success" onClick={() => setShowConstraintForm((p) => !p)}>
                        Add Constraint
                    </button>
                }
            />

            {showConstraintForm && (
                <ConstraintCreator
                    title="Add Constraint"
                    onClose={handleCloseCreateConstraintModal}
                    onSubmit={handleCreateConstraint}
                    attributes={attributes}
                    newConstraint={newConstraint}
                    setNewConstraint={setNewConstraint}
                />
            )}
        </div>
    );
}