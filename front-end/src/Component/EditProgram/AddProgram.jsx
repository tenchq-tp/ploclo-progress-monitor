import { useState } from "react";
import axios from "./../axios";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";


export default function AddProgram({
  setAlert,
  selectedFaculty,
  setFilteredProgram,
  filteredProgram,
  setProgram,
  program,
}) {
  const { t, i18n } = useTranslation();

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
    if (isNaN(yearValue)) {
      showAlert("ปีของหลักสูตรต้องเป็นตัวเลขที่ถูกต้อง", "warning");
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


  const handleProgramExcelUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // reset input เพื่อให้เลือกไฟล์ซ้ำได้

    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        console.log("Sheet Names:", workbook.SheetNames);
        console.log("Excel JSON Data:", jsonData);

        if (jsonData.length === 0) {
          showAlert("ไม่พบข้อมูลใน Excel", "warning");
          return;
        }

        const dataToUpload = jsonData.map(row => ({
          ...row,
          faculty_id: selectedFaculty,
        }));

        const response = await axios.post("/api/program/excel", dataToUpload);

        if (response.data.success) {
          // อัปเดต state ด้วยข้อมูลที่ได้จาก backend
          const newPrograms = response.data.programs;

          if (newPrograms && newPrograms.length > 0) {
            // เพิ่มข้อมูลใหม่เข้าไปใน state
            setFilteredProgram([...filteredProgram, ...newPrograms]);
            setProgram([...program, ...newPrograms]);
          }

          showAlert(`เพิ่มโปรแกรม ${newPrograms?.length || 0} รายการเรียบร้อยแล้ว`, "success");
        } else {
          showAlert("เกิดข้อผิดพลาด: " + response.data.message, "danger");
        }
      } catch (err) {
        console.error("Error reading Excel file:", err);

        if (err.response) {
          const errorMessage = err.response.data.message || "เกิดข้อผิดพลาดในการอัปโหลด Excel";
          showAlert(errorMessage, "danger");
        } else if (err.request) {
          showAlert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้", "danger");
        } else {
          showAlert("อ่านไฟล์ไม่สำเร็จ", "danger");
        }
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (

    <div className="mb-3">

      <h5 className="form-label text-start" style={{ marginBottom: "15px" }}>
        {t('Add Program')}
      </h5>




      <div className="mb-2">
        <input
          type="text"
          className="form-control mb-2"
          placeholder={t('รหัสหลักสูตร')}
          name="code"
          value={newProgram.code}
          onChange={handleNewProgramChange}
        />
        <input
          type="text"
          className="form-control mb-2"
          placeholder={t("Program Name")}
          name="program_name"
          value={newProgram.program_name}
          onChange={handleNewProgramChange}
        />
        <input
          type="text"
          className="form-control mb-2"
          placeholder={t("ชื่อหลักสูตร (ไทย)")}
          name="program_name_th"
          value={newProgram.program_name_th}
          onChange={handleNewProgramChange}
        />
        <div className="row mb-2">
          <div className="col">
            <input
              type="text"
              className="form-control"
              placeholder={t("Short Name")}
              name="program_shortname_en"
              value={newProgram.program_shortname_en}
              onChange={handleNewProgramChange}
            />
          </div>
          <div className="col">
            <input
              type="text"
              className="form-control"
              placeholder={t('ชื่อย่อ (ไทย)')}
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
              placeholder={t('Year')}
              name="year"
              value={newProgram.year}
              onChange={handleNewProgramChange}
            />
          </div>

          <div className="col d-flex justify-content-end" style={{ gap: "15px" }}>
            <button
              className="btn btn-primary"
              onClick={handleAddProgram}
              disabled={newProgram.program_name.trim() === "" || !selectedFaculty || selectedFaculty === "all"}>
              {t('Insert Program')}
            </button>
            <button
              onClick={() => document.getElementById("uploadProgramFile").click()}
              className="btn btn-primary"
              disabled={!selectedFaculty || selectedFaculty === "all"}

            >
              {t('Upload Excel (Program)')}
            </button>
            <input
              type="file"
              id="uploadProgramFile"
              style={{ display: "none" }}
              accept=".xlsx, .xls"
              onChange={handleProgramExcelUpload}

            />
          </div>
        </div>
      </div>
    </div>
  );
}
