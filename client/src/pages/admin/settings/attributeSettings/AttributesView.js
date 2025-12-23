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
    UPDATE_USER_ATTRIBUTE_DEFINITION,
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

    // Mutations
    const [createAttribute] =
        useMutation(CREATE_USER_ATTRIBUTE_DEFINITION, {
            onCompleted: () => refetchAttributes(),
        });

    const [deleteAttribute] = useMutation(DELETE_USER_ATTRIBUTE_DEFINITION, {
        onCompleted: () => refetchAttributes(),
    });

    const [updateAttribute] = useMutation(UPDATE_USER_ATTRIBUTE_DEFINITION, {
        onCompleted: () => refetchAttributes(),
    });

    const [editingAttr, setEditingAttr] = React.useState(null);

    // --- Local form state ---
    const [newAttr, setNewAttr] = React.useState({
        label: "",
        type: "STRING",
        description: "",
        options: [],
        userEditable: false,
    });

    const [showAttrForm, setShowAttrForm] = React.useState(false);

    const handleCloseCreateAttributeModal = React.useCallback(() => {
        setNewAttr({
            label: "",
            type: "STRING",
            description: "",
            options: [],
            userEditable: false,
        });
        setEditingAttr(null);
        setShowAttrForm(false);
    }, []);

    const handleEditAttribute = React.useCallback((attr) => {
        setEditingAttr(attr);
        setNewAttr({
            label: attr.label ?? "",
            type: attr.type ?? "STRING",
            description: attr.description ?? "",
            options: attr.options ?? [],
            userEditable: !!attr.userEditable,
        });
        setShowAttrForm(true);
    }, []);

    const handleSubmitAttribute = async (e) => {
        e.preventDefault();
        if (!newAttr.label) return;

        try {
            const derivedKey = editingAttr?.key ?? labelToKey(newAttr.label);
            const input = {
                key: derivedKey,
                label: newAttr.label.trim(),
                type: newAttr.type,
                description: newAttr.description || null,
                options: newAttr.type === "ENUM" ? newAttr.options : [],
                userEditable: !!newAttr.userEditable,
                active: true,
            };

            if (editingAttr?._id) {
                await updateAttribute({
                    variables: { id: editingAttr._id, input },
                });
            } else {
                await createAttribute({
                    variables: { input },
                });
            }
            handleCloseCreateAttributeModal();
        } catch (err) {
            console.error("Error saving attribute:", err);
        }
    };

    const handleDeleteAttribute = React.useCallback(
        async (id) => {
            if (!window.confirm("Delete this attribute? This may affect existing constraints.")) {
                return;
            }
            try {
                await deleteAttribute({ variables: { id } });
            } catch (err) {
                console.error("Error deleting attribute:", err);
            }
        },
        [deleteAttribute] // stable dependency
    );


    const attributeColumns = React.useMemo(() => [
        columnHelper.accessor("label", {
            header: "Label",
        }),
        columnHelper.accessor("type", {
            header: "Type",
        }),

        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
                const attr = row.original;
                return (
                    <div className="d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditAttribute(attr)}
                            disabled={attr.source === "SYSTEM"}
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteAttribute(attr._id)}
                            disabled={attr.source === "SYSTEM"}
                        >
                            Delete
                        </button>
                    </div>
                );
            },
            enableSorting: false,
            enableColumnFilter: false,
        }
    ], [columnHelper, handleDeleteAttribute, handleEditAttribute]);

    // const attributeTypes = Object.keys(AttributeTypes);

    const attributes = attributesData?.userAttributeDefinitions ?? [];

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

                    <button
                        className="btn btn-success"
                        onClick={() => {
                            setEditingAttr(null);
                            setNewAttr({
                                label: "",
                                type: "STRING",
                                description: "",
                                options: [],
                                userEditable: false,
                            });
                            setShowAttrForm(true);
                        }}
                    >
                        Add User Attribute
                    </button>
                }
            />

            {showAttrForm && (
                <AttributeCreator
                    title={editingAttr ? "Edit User Attribute" : "Add User Attribute"}
                    onClose={handleCloseCreateAttributeModal}
                    onSubmit={handleSubmitAttribute}
                    newAttr={newAttr}
                    setNewAttr={setNewAttr}
                    mode={editingAttr ? "edit" : "create"}
                />
            )}
        </div>
    );
}
