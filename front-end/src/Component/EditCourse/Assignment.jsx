import axios from "./../../axios";
import { useEffect, useState } from "react";
import styles from "./styles/Assignment.module.css";
import EditAssignmentModal from "./assignment/EditAssignment";
import * as XLSX from "xlsx";
import StudentExcel from "./assignment/StudentExcel";
import StudentScore from "./assignment/StudentScore";
import ExcelDataDisplay from "../Excel/DataDisplay";
import { useTranslation } from "react-i18next"

export default function Assignment({
  selectedUniversity,
  selectedFaculty,
  selectedProgram,
  selectedYear,
  selectedSemester,
  activeTab,
}) {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [error, setError] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [selectedCourseSection, setSelectedCourseSection] = useState();
  const [selectedProgramCourse, setSelectedProgramCourse] = useState();
  const [assignments, setAssignments] = useState([]);
  const [clos, setClos] = useState([]);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [students, setStudents] = useState([]);
  const [showStudents, setShowStudents] = useState(false);
  const [selectedAssignmentStudent, setSelectedAssignmentStudent] = useState();
  const [showScores, setShowScores] = useState(false);

  // Excel Assignment
  const [assignmentExcel, setAssignmentExcel] = useState([]);
  const [showAssignTable, setShowAssignTable] = useState(false);

  // Student score excel
  const [studentScoreExcel, setStudentScoreExcel] = useState([]);
  const [showStudentScoreTable, setShowStudentScoreTable] = useState(false);

   const { t, i18n } = useTranslation();

  async function fetchCourses() {
    try {
      const response = await axios.get("/api/program-course/filter", {
        params: {
          program_id: selectedProgram,
          semester_id: selectedSemester,
          year: selectedYear,
        },
      });
      setAvailableCourses(response.data.data);
    } catch (error) {
      setAvailableCourses([]);
      setError(error.message);
    }
  }

  async function fetchAssignments() {
    try {
      const response = await axios.get(
        `/api/assignment/${selectedProgramCourse}`
      );
      setAssignments(response.data);
    } catch (error) {
      setError(error.message);
    }
  }

  async function fetchClo() {
    try {
      const response = await axios.get("/api/clo/course", {
        params: {
          course_id: selectedCourseName,
          year: selectedYear,
        },
      });
      setClos(response.data.data);
    } catch (error) {
      setError(error.message);
    }
  }

  async function uploadAssignExcel(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    e.target.value = "";

    reader.onload = (event) => {
      const data = event.target.result;
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      setAssignmentExcel(jsonData);
    };

    reader.readAsArrayBuffer(file);
  }

  async function uploadScoreStudentExcel(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    e.target.value = "";

    reader.onload = (event) => {
      const data = event.target.result;
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      setStudentScoreExcel(jsonData);
    };

    reader.readAsArrayBuffer(file);
  }

  useEffect(() => {
    if (
      activeTab === 4 &&
      selectedUniversity &&
      selectedFaculty &&
      selectedProgram &&
      selectedYear &&
      selectedSemester
    ) {
      fetchCourses();
    }
  }, [activeTab, selectedSemester]);

  useEffect(() => {
    fetchAssignments();
    fetchClo();
  }, [selectedProgramCourse]);

  useEffect(() => {
    if (assignmentExcel.length > 0) {
      setShowAssignTable(true);
    } else {
      setShowAssignTable(false);
    }
  }, [assignmentExcel]);

  useEffect(() => {
    if (studentScoreExcel.length > 0) {
      setShowStudentScoreTable(true);
    } else {
      setShowStudentScoreTable(false);
    }
  }, [studentScoreExcel]);

  async function confirmAssign() {
    const payload = {
      assignment_id: selectedAssignmentStudent,
      students: students,
    };

    try {
      await axios.post("/api/assignment/assign", payload);
      alert("มอบหมายงานเสร็จสิ้น");
    } catch (error) {
      console.error(error);
    }
  }

  async function handleAddAssignmentExcel() {
    const payload = {
      program_course_id: selectedProgramCourse,
      university_id: selectedUniversity,
      faculty_id: selectedFaculty,
      assignments: assignmentExcel,
    };

    try {
      const response = await axios.post("/api/assignment/excel", payload);

      alert(response.data.message);
      fetchAssignments();
      setAssignmentExcel([]);
    } catch (error) {
      alert("An unexpected error occurred.");
      console.error("Fetch Error:", error);
    }
  }

  async function handleAddStudentScoreExcel() {
    const payload = {
      program_course_id: selectedProgramCourse,
      student_score: studentScoreExcel,
    };

    try {
      const response = await axios.post(
        "/api/assignment/student-score-excel",
        payload
      );

      alert(response.data.message);
      setStudentScoreExcel([]);
    } catch (error) {
      alert("An unexpected error occurred.");
      console.error("Fetch Error: ", error);
    }
  }

  return (
    <>
      <SelectorCourses
        courses={availableCourses}
        setCourse={setSelectedCourseName}
        setSection={setSelectedCourseSection}
        setProgramCourse={setSelectedProgramCourse}
        programCourseId={selectedProgramCourse}
      />
      <div className={styles.btn_wrap}>
        <button
          className={styles.btn_submit}
          onClick={() => setShowAddModal(true)}>
          {t("Add")}
        </button>
        <button
          className={styles.btn_submit}
          onClick={() => document.getElementById("input-excel").click()}>
          {t("Add assignments from excel")}
        </button>
        <button
          className={styles.btn_submit}
          onClick={() =>
            document.getElementById("input-student-score-excel").click()
          }>
          {t("Add student score from excel")}
        </button>
        <input
          type="file"
          accept=".xlsx, .xls"
          style={{ display: "none" }}
          id="input-excel"
          onChange={uploadAssignExcel}
        />
        <input
          type="file"
          accept=".xlsx, .xls"
          style={{ display: "none" }}
          id="input-student-score-excel"
          onChange={uploadScoreStudentExcel}
        />
      </div>
      {showAddModal && (
        <AddAssignmentModal
          setModal={setShowAddModal}
          programCourseId={selectedProgramCourse}
          programCourse={selectedProgramCourse}
          faculty={selectedFaculty}
          university={selectedUniversity}
          clos={clos}
          fetchAssignments={fetchAssignments}
        />
      )}
      <AssignmentTable
        assignments={assignments}
        onEdit={(assignment) => setEditingAssignment(assignment)}
        fetchAssignments={fetchAssignments}
        setStudents={setStudents}
        setShowStudents={setShowStudents}
        setSelectedAssignmentStudent={setSelectedAssignmentStudent}
        setShowScores={setShowScores}
        selectedCourseId={selectedCourseName}
      />
      {editingAssignment && (
        <EditAssignmentModal
          assignment={editingAssignment}
          clos={clos}
          setModal={() => setEditingAssignment(null)}
          refresh={fetchAssignments} // รีเฟรชข้อมูลหลังแก้ไข
        />
      )}

      {showAssignTable && (
        <ExcelDataDisplay
          onClose={() => setShowAssignTable(false)}
          dataArray={assignmentExcel}
          onAdd={() => {
            handleAddAssignmentExcel();
            setShowAssignTable(false);
          }}
        />
      )}

      {showStudentScoreTable && (
        <ExcelDataDisplay
          onClose={() => setShowStudentScoreTable(false)}
          dataArray={studentScoreExcel}
          onAdd={handleAddStudentScoreExcel}
        />
      )}

      {showStudents && (
        <StudentExcel
          students={students}
          selectedAssignmentStudent={selectedAssignmentStudent}
          onClose={() => setShowStudents(false)}
          onSubmit={confirmAssign}
        />
      )}
      {showScores && (
        <StudentScore
          assignment_id={selectedAssignmentStudent}
          onClose={() => setShowScores(false)}
        />
      )}
    </>
  );
}

function SelectorCourses({
  courses,
  setCourse,
  setSection,
  setProgramCourse,
  programCourseId,
}) {
     const { t, i18n } = useTranslation();
  const [courseWithSections, setCourseWithSections] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);

  useEffect(() => {
    const groupedCourses = [];

    courses.forEach((course) => {
      const existing = groupedCourses.find(
        (c) => c.course_id === course.course_id
      );
      if (existing) {
        existing.section.push({
          section: course.section_id,
          id: course.program_course_id,
        });
      } else {
        groupedCourses.push({
          course_id: course.course_id,
          course_name: course.course_name,
          section: [
            { section: course.section_id, id: course.program_course_id },
          ],
        });
      }
    });
    setCourseWithSections(groupedCourses);
  }, [courses]);

  const handleCourseChange = (e) => {
    const selectedName = e.target.value;
    setCourse(selectedName);
    setSection();
    setProgramCourse("default");
    const course = courseWithSections.find((c) => {
      return c.course_id == selectedName;
    });
    setAvailableSections(course ? course.section : []);
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.filter_container}>
          <label htmlFor="courseSelection">{t("Choose a Course")}</label>
          <select
            id="courseSelection"
            onChange={handleCourseChange}
            className={styles.selector}>
            <option value="">-- {t("Select Course")} --</option>
            {courseWithSections.map((course, index) => (
              <option key={index} value={course.course_id}>
                {course.course_name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filter_container}>
          <label htmlFor="sectionSelection">{t("Choose a Section")}</label>
          <select
            id="sectionSelection"
            className={styles.selector}
            onChange={(e) => {
              setSection(e.target.value);
              setProgramCourse(e.target.value);
            }}
            value={programCourseId}>
            <option value="default">{t("Select Section")}</option>
            {availableSections.map((sec, index) => (
              <option key={index} value={sec.id}>
                Section {sec.section}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}

function AssignmentTable({
  assignments,
  onEdit,
  fetchAssignments,
  setStudents,
  setShowStudents,
  setSelectedAssignmentStudent,
  setShowScores,
  selectedCourseId,
}) {
  const { t, i18n } = useTranslation();
  const [studentData, setStudentData] = useState(null);

  async function deleteAssignment(id) {
    try {
      const response = await axios.delete(`/api/assignment/${id}`);
      alert("ลบงานเสร็จสิ้น");
    } catch (error) {
      console.log(error.message);
    }
    fetchAssignments();
  }

  async function fetchStudent() {
    try {
      const response = await axios.get(
        `/api/students/course/${selectedCourseId}/students`
      );
      const students = response.data;
      setStudents(students);
      setShowStudents(true);
      setStudentData(students);
    } catch (error) {
      console.error(error.message);
    }
  }

  return (
    <>
      <section className={styles.table_header}>
        <h1>{t("Assignment")}</h1>
      </section>

      <section className={styles.table_body_wrapper}>
        <div className={styles.table_scroll_container}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.column_wrap}>
                <th className={styles.column_table}>No.</th>
                <th className={styles.column_table}>Name</th>
                <th className={styles.column_table}>Description</th>
                <th className={styles.column_table}>Total score</th>
                <th className={styles.column_table}>Due date</th>
                <th className={styles.column_table}>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length > 0 ? (
                assignments.map((assignment, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{assignment.assignment_name}</td>
                    <td>{assignment.description}</td>
                    <td>{assignment.total_score}</td>
                    <td>{assignment.due_date || "-"}</td>
                    <td>
                      <button
                        className={styles.btn_submit}
                        onClick={() => {
                          setSelectedAssignmentStudent(
                            assignment.assignment_id
                          );
                          setShowScores(true);
                        }}>
                        กรอกคะแนน
                      </button>
                      <button
                        className={styles.btn_submit}
                        onClick={() => {
                          setSelectedAssignmentStudent(
                            assignment.assignment_id
                          );
                          fetchStudent();
                        }}>
                        มอบหมายงาน
                      </button>
                      <button
                        className={styles.btn_delete}
                        onClick={() =>
                          deleteAssignment(assignment.assignment_id)
                        }>
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function AddAssignmentModal({
  programCourse,
  faculty,
  university,
  setModal,
  clos,
  fetchAssignments,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxScore, setMaxScore] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [activeTab, setActiveTab] = useState("assignment");
  const [selectedClos, setSelectedClos] = useState([]);
  const [cloWeights, setCloWeights] = useState({});

  async function addAssignment() {
    try {
      const closPayload = selectedClos.map((id) => ({
        id,
        weight: parseFloat(cloWeights[id] || 0),
      }));

      const respones = await axios.post("/api/assignment", {
        program_course_id: programCourse,
        name,
        description,
        max_score: maxScore,
        due_date: dueDate,
        faculty_id: faculty,
        university_id: university,
        clos: closPayload,
      });
      alert("เพิ่มงานสำเร็จ!");
      setModal(false);
      fetchAssignments();
    } catch (error) {
      console.error(error);
    }
  }

  function toggleClo(id) {
    setSelectedClos((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function onWeightChange(id, value) {
    setCloWeights((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  return (
    <div className={styles.modal_container}>
      <div className={styles.modal}>
        <h2 className={styles.modal_title}>เพิ่มงานใหม่</h2>

        <div className={styles.tab_menu}>
          <button
            className={activeTab === "assignment" ? styles.active_tab : ""}
            onClick={() => setActiveTab("assignment")}>
            รายละเอียดการบ้าน
          </button>
          <button
            className={activeTab === "clo" ? styles.active_tab : ""}
            onClick={() => setActiveTab("clo")}>
            จัดการ CLO
          </button>
        </div>

        {activeTab === "assignment" && (
          <div>
            <div className={styles.input_text_section}>
              <label className={styles.input_label}>ชื่อ</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                name="title"
                placeholder="ชื่องาน"
                className={styles.input_field}
              />
            </div>

            <div className={styles.input_text_section}>
              <label className={styles.input_label}>รายละเอียด</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                name="description"
                placeholder="รายละเอียดของงาน"
                className={styles.input_field}
                rows="3"
              />
            </div>

            <div className={styles.input_text_section}>
              <label className={styles.input_label}>คะแนนเต็ม</label>
              <input
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                type="number"
                name="score"
                placeholder="เช่น 100"
                className={styles.input_field}
              />
            </div>

            <div className={styles.input_text_section}>
              <label className={styles.input_label}>กำหนดส่ง</label>
              <input
                type="date"
                name="due_date"
                className={styles.input_field}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === "clo" && (
          <div>
            {clos.map((clo) => (
              <div key={clo.CLO_id}>
                <input
                  type="checkbox"
                  value={clo.CLO_id}
                  checked={selectedClos.includes(clo.CLO_id)}
                  onChange={() => toggleClo(clo.CLO_id)}
                />
                <label>{`${clo.CLO_code} ${clo.CLO_name}`}</label>

                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="น้ำหนัก"
                  value={cloWeights[clo.CLO_id] || ""}
                  onChange={(e) => onWeightChange(clo.CLO_id, e.target.value)}
                  disabled={!selectedClos.includes(clo.CLO_id)}
                />
              </div>
            ))}
          </div>
        )}

        <div className={styles.button_group}>
          <button className={styles.modal_save_btn} onClick={addAssignment}>
            บันทึก
          </button>
          <button
            className={styles.modal_close_btn}
            onClick={() => setModal(false)}>
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
