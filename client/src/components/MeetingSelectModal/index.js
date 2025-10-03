import React, { useState } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

const customStyles = {
  content: {
    top: "20%",
    left: "30%",
    right: "20%",
    bottom: "20%",
    marginRight: "-20%",
    transform: "translate(-20%, -20%)",
  },
};

const MeetingSelectModal = ({ isOpen, onClose, date, meetings, onConfirm }) => {
  const [selected, setSelected] = useState(new Set());

  const toggleSelect = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleConfirm = () => {
    const chosen = meetings.filter((m) => selected.has(m._id));
    onConfirm(chosen);
    setSelected(new Set());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel="Meeting Selection Modal"
    >
      <h2 className="text-dark">
        Select Meetings for {date}
      </h2>
      <form className="flex-column">
        {meetings.map((m) => (
          <div key={m._id} className="mb-2">
            <label>
              <input
                type="checkbox"
                checked={selected.has(m._id)}
                onChange={() => toggleSelect(m._id)}
                className="mr-2"
              />
              {m.title} (
              {new Date(m.startDateTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              )
            </label>
          </div>
        ))}
        <div className="mt-3">
          <button
            type="button"
            className="btn no-border-btn btn-success m-1"
            onClick={handleConfirm}
            disabled={selected.size === 0}
          >
            Confirm
          </button>
          <button
            type="button"
            className="btn no-border-btn btn-danger m-1"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MeetingSelectModal;