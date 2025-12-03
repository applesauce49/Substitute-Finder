// client/src/pages/admin/settings/ConstraintsSettings.js
import React from "react";
import { GenericReportTable } from "../../../../components/reporting/GenericReportTable/GenericReportTable";
import { createColumnHelper } from "@tanstack/react-table";
import { useQuery, useMutation } from "@apollo/client";
import {
    QUERY_USER_ATTRIBUTE_DEFINITIONS,
} from "../../../../utils/graphql/constraints/queries";
import {
    CREATE_USER_ATTRIBUTE_DEFINITION,
    DELETE_USER_ATTRIBUTE_DEFINITION,
} from "../../../../utils/graphql/constraints/mutations";
import { AttributeCreator } from "./AttributeCreator";
import { labelToKey } from "../../../../utils/attributes/AttributeTypes";

export function AttributesView() {
    // Queries
    const {
        data: attributesData,
        loading: attributesLoading,
        error: attributesError,
        refetch: refetchAttributes,
    } = useQuery(QUERY_USER_ATTRIBUTE_DEFINITIONS);

    const columnHelper = createColumnHelper();

    const attributeColumns = React.useMemo(() => [
        columnHelper.accessor("label", {
            header: "Label",
        }),
        columnHelper.accessor("type", {
            header: "Type",
        }),

        // Actions column
        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
                const attr = row.original;
                return (
                    <div className="text-end">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteAttribute(attr._id)}
                        >
                            Delete
                        </button>
                    </div>
                );
            },
            enableSorting: false,
            enableColumnFilter: false,
        }
    ], [columnHelper]);

    // Mutations
    const [createAttribute, { loading: createAttrLoading }] =
        useMutation(CREATE_USER_ATTRIBUTE_DEFINITION, {
            onCompleted: () => refetchAttributes(),
        });

    const [deleteAttribute] = useMutation(DELETE_USER_ATTRIBUTE_DEFINITION, {
        onCompleted: () => refetchAttributes(),
    });

    // --- Local form state ---

    const [newAttr, setNewAttr] = React.useState({
        label: "",
        type: "STRING",
        description: "",
        options: [],
        userEditable: false,
    });

    // const attributeTypes = Object.keys(AttributeTypes);

    const attributes = attributesData?.userAttributeDefinitions ?? [];

    // --- Handlers ---

    const handleCreateAttribute = async (e) => {
        e.preventDefault();
        console.log("Submitting new attribute:", newAttr);
        if (!newAttr.label) return;

        try {
            console.log("Creating attribute:", newAttr);
            const derivedKey = labelToKey(newAttr.label);
            await createAttribute({
                variables: {
                    input: {
                        key: derivedKey,
                        label: newAttr.label.trim(),
                        type: newAttr.type,
                        description: newAttr.description || null,
                        options: newAttr.type === "ENUM" ? newAttr.options : [],
                        active: true,
                    },
                },
            });
            handleCloseCreateAttributeModal();
        } catch (err) {
            console.error("Error creating attribute:", err);
        }
    };

    const handleDeleteAttribute = async (id) => {
        if (!window.confirm("Delete this attribute? This may affect existing constraints.")) {
            return;
        }
        try {
            await deleteAttribute({ variables: { id } });
        } catch (err) {
            console.error("Error deleting attribute:", err);
        }
    };

    const handleCloseCreateAttributeModal = () => {
        setNewAttr({
            label: "",
            type: "STRING",
            description: "",
            options: [],
        });
        setShowAttrForm(false);
    };
    
    const [showAttrForm, setShowAttrForm] = React.useState(false);

    if (attributesLoading) {
        return <div>Loading Attributes...</div>;
    }

    if (attributesError) {
        console.error(attributesError);
    }

    return (
        <div className="mb-4">
            <GenericReportTable
                title="User Attribute Definitions"
                data={attributes}
                columns={attributeColumns}
                filterFns={{}}
                toolbarRight={

                    <button className="btn btn-success" onClick={() => setShowAttrForm((p) => !p)}>
                        Add User Attribute
                    </button>
                }
            />

            {showAttrForm && (
                <AttributeCreator
                    title="Add User Attribute"
                    onClose={handleCloseCreateAttributeModal}
                    onSubmit={handleCreateAttribute}
                    newAttr={newAttr}
                    setNewAttr={setNewAttr}
                />
            )}
        </div>
    );
}