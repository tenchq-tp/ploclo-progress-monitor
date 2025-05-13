import { useState } from "react";

export default function EditProgramModal({ initialValue, onSave, onCancel }) {
  const [editValue, setEditValue] = useState(initialValue);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditValue((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Program</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            <div className="mb-2">
              <label>Code</label>
              <input
                type="text"
                name="code"
                className="form-control"
                value={editValue.code}
                onChange={handleChange}
              />
            </div>
            <div className="mb-2">
              <label>Program Name (EN)</label>
              <input
                type="text"
                name="program_name"
                className="form-control"
                value={editValue.program_name}
                onChange={handleChange}
              />
            </div>
            <div className="mb-2">
              <label>Program Name (TH)</label>
              <input
                type="text"
                name="program_name_th"
                className="form-control"
                value={editValue.program_name_th}
                onChange={handleChange}
              />
            </div>
            <div className="mb-2">
              <label>Short Name (EN)</label>
              <input
                type="text"
                name="program_shortname_en"
                className="form-control"
                value={editValue.program_shortname_en}
                onChange={handleChange}
              />
            </div>
            <div className="mb-2">
              <label>Short Name (TH)</label>
              <input
                type="text"
                name="program_shortname_th"
                className="form-control"
                value={editValue.program_shortname_th}
                onChange={handleChange}
              />
            </div>
            <div className="mb-2">
              <label>Year</label>
              <input
                type="text"
                name="year"
                className="form-control"
                value={editValue.year}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn btn-primary"
              onClick={() => onSave(editValue)}>
              Save
            </button>
            <button className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
