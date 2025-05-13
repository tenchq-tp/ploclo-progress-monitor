import { useState } from "react";
import axios from "./../axios";
import handleProgramExcelUpload from "./../EditProgram.jsx";
import handleProgramUploadClick from "./../EditProgram.jsx";
import excelData from "./../EditProgram.jsx";

export default function AddProgram({
  setAlert,
  selectedFaculty,
  setFilteredProgram,
  filteredProgram,
  setProgram,
  program,
}) {
  const [newProgram, setNewProgram] = useState({
    code: "",
    program_name: "",
    program_name_th: "",
    program_shortname_en: "",
    program_shortname_th: "",
  });

  // asdwad
  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
  };

  function handleNewProgramChange(e) {
    const { name, value } = e.target;
    setNewProgram({
      ...newProgram,
      [name]: value,
    });
  }

  const handleAddProgram = async () => {
    if (!newProgram.program_name || newProgram.program_name.trim() === "") {
      showAlert("กรุณากรอกชื่อหลักสูตร", "warning");
      return;
    }

    if (!selectedFaculty || selectedFaculty === "all") {
      showAlert("กรุณาเลือกคณะ", "warning");
      return;
    }

    if (!newProgram.year) {
      showAlert("กรุณากรอกปีของหลักสูตร", "warning");
      return;
    }

    const yearValue = parseInt(newProgram.year, 10);
    if (isNaN(yearValue) || yearValue < 1900 || yearValue > 2100) {
      showAlert("ปีของหลักสูตรต้องเป็นตัวเลขระหว่าง 1900-2100", "warning");
      return;
    }

    const programPayload = {
      code: newProgram.code,
      program_name: newProgram.program_name,
      program_name_th: newProgram.program_name_th || "",
      program_shortname_en: newProgram.program_shortname_en || "",
      program_shortname_th: newProgram.program_shortname_th || "",
      year: yearValue,
    };

    try {
      const response = await axios.post("/api/program", programPayload);
      console.log("✅ Program added successfully!", response.data);

      const newProgramId = response.data.program_id;
      if (!newProgramId) {
        throw new Error("❌ program_id is missing from response");
      }
      console.log("faculty ----> ", selectedFaculty);
      await axios.post("/api/university/program-faculty", {
        program_id: newProgramId,
        faculty_id: selectedFaculty,
      });

      const newProgramItem = {
        program_id: newProgramId,
        code: newProgram.code,
        program_name: newProgram.program_name,
        program_name_th: newProgram.program_name_th || "",
        program_shortname_en: newProgram.program_shortname_en || "",
        program_shortname_th: newProgram.program_shortname_th || "",
        year: yearValue,
      };

      // ✅ อัปเดต state
      setFilteredProgram([...filteredProgram, newProgramItem]);
      setProgram([...program, newProgramItem]);

      setNewProgram({
        code: "",
        program_name: "",
        program_name_th: "",
        program_shortname_en: "",
        program_shortname_th: "",
        year: "",
      });

      showAlert("เพิ่มหลักสูตรเรียบร้อยแล้ว", "success");
    } catch (error) {
      console.error("❌ Error adding program:", error.response?.data || error);

      if (error.response) {
        const errorMessage = error.response.data.errors
          ? error.response.data.errors.join(", ")
          : error.response.data.message || "เกิดข้อผิดพลาดในการเพิ่มหลักสูตร";

        showAlert(errorMessage, "danger");
      } else if (error.request) {
        showAlert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้", "danger");
      } else {
        showAlert("เกิดข้อผิดพลาดในการส่งข้อมูล", "danger");
      }
    }

  };

  return (

    <div className="mb-3">

      <h5 className="form-label text-start" style={{ marginBottom: "15px" }}>
        Add Program
      </h5>
      <div className="button-group ms-auto">
        <button
          onClick={() => document.getElementById("uploadProgramFile").click()}
          className="btn btn-primary"
          disabled={!selectedFaculty || selectedFaculty === "all"}

        >
          Upload Excel (Program)
        </button>
        <input
          type="file"
          id="uploadProgramFile"
          style={{ display: "none" }}
          accept=".xlsx, .xls"
          onChange={handleProgramExcelUpload}

        />
        <button
          onClick={handleProgramUploadClick}
          className="btn btn-success"
          disabled={!excelData || !selectedFaculty || selectedFaculty === "all"}>
          Submit Excel Data
        </button>
      </div>

      <div className="mb-2">
        <input
          type="text"
          className="form-control mb-2"
          placeholder="รหัสหลักสูตร"
          name="code"
          value={newProgram.code}
          onChange={handleNewProgramChange}
        />
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Program Name (English)"
          name="program_name"
          value={newProgram.program_name}
          onChange={handleNewProgramChange}
        />
        <input
          type="text"
          className="form-control mb-2"
          placeholder="ชื่อหลักสูตร (ภาษาไทย)"
          name="program_name_th"
          value={newProgram.program_name_th}
          onChange={handleNewProgramChange}
        />
        <div className="row mb-2">
          <div className="col">
            <input
              type="text"
              className="form-control"
              placeholder="Short Name (EN)"
              name="program_shortname_en"
              value={newProgram.program_shortname_en}
              onChange={handleNewProgramChange}
            />
          </div>
          <div className="col">
            <input
              type="text"
              className="form-control"
              placeholder="ชื่อย่อ (ไทย)"
              name="program_shortname_th"
              value={newProgram.program_shortname_th}
              onChange={handleNewProgramChange}
            />
          </div>
        </div>
        <div className="row mb-2">
          <div className="col">
            <input
              type="text"
              className="form-control"
              placeholder="Year (e.g., 2022)"
              name="year"
              value={newProgram.year}
              onChange={handleNewProgramChange}
            />
          </div>
          <div className="col d-flex justify-content-end">
            <button
              className="btn btn-primary"
              onClick={handleAddProgram}
              disabled={newProgram.program_name.trim() === ""}>
              Insert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
