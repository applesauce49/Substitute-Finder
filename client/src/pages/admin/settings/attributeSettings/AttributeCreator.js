// client/src/pages/admin/settings/ConstraintsSettings.js
import React from "react";
import ModalForm from "../../../../components/Modal/ModalForm.js";
import { EditableEnumOptions } from "../../../../components/EditableEnumOptions";

import { AttributeTypes } from "../../../../utils/attributes/AttributeTypes";

export function AttributeCreator({
    title,
    onClose,
    onSubmit,
    newAttr,
    setNewAttr,
}) {


    const attributeTypes = Object.keys(AttributeTypes);

    return (
        <ModalForm
            title={title}
            onClose={onClose}
            onSubmit={onSubmit}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" onClick={onSubmit}>
                        Save
                    </button>
                </>
            }
        >
            <form className="mb-3" onSubmit={onSubmit}>
                <div className="row g-2">
                    <div className="col-8 d-flex flex-column">
                        <label className="form-label">Label</label>
                        <input
                            type="text"
                            className="form-control"
                            value={newAttr.label}
                            onChange={(e) =>
                                setNewAttr((prev) => ({ ...prev, label: e.target.value }))
                            }
                            placeholder="Short name of the attribute"
                        />
                    </div>
                    <div className="col-4 d-flex flex-column">
                        <label className="form-label">Type</label>
                        <select
                            className="form-select"
                            value={newAttr.type}
                            onChange={(e) =>
                                setNewAttr((prev) => ({ ...prev, type: e.target.value }))
                            }
                        >
                            {attributeTypes.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>
                    {newAttr.type === "ENUM" && (
                        <div className="col-12 mt-2">
                            <label className="form-label">Enum Options</label>

                            <EditableEnumOptions
                                options={newAttr.options}
                                setOptions={(updater) =>
                                    setNewAttr(prev => {
                                        const newOptions =
                                            typeof updater === "function"
                                                ? updater(prev.options) // apply functional update
                                                : updater;              // direct array update

                                        return { ...prev, options: newOptions };
                                    })
                                }
                            />
                        </div>
                    )}
                    <div className="col-12 mt-2">
                        <label className="form-label">Description</label>
                        <input
                            type="text"
                            className="form-control"
                            value={newAttr.description}
                            onChange={(e) =>
                                setNewAttr((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            placeholder="Optional description"
                        />
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={newAttr.userEditable}
                            onChange={(e) =>
                                setNewAttr(prev => ({ ...prev, userEditable: e.target.checked }))
                            }
                            id="userEditableToggle"
                        />
                        <label className="form-label" htmlFor="userEditableToggle">
                            Users can edit this in their profile
                        </label>
                    </div>
                </div>
            </form>

        </ModalForm>
    );
}