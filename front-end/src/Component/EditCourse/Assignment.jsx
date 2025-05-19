import axios from "./../../axios";
import { useEffect, useState } from "react";
import styles from "./styles/Assignment.module.css";
import EditAssignmentModal from "./assignment/EditAssignment";

export default function Assignment({
  selectedUniversity,
  selectedFaculty,
  selectedProgram,
  selectedYear,
  selectedSemester,
  activeTab,
}) {
  const [availableAssignments, setAvailableAssignmennts] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [error, setError] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [selectedCourseSection, setSelectedCourseSection] = useState();
  const [selectedProgramCourse, setSelectedProgramCourse] = useState();
  const [assignments, setAssignments] = useState([]);
  const [clos, setClos] = useState([]);
  const [editingAssignment, setEditingAssignment] = useState(null);

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
      const response = await axios.get("/api/course-clo/clo", {
        params: {
          course_id: selectedCourseName,
          year: selectedYear,
        },
      });
      setClos(response.data);
    } catch (error) {
      setError(error.message);
    }
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

  return (
    <>
      <SelectorCourses
        courses={availableCourses}
        setCourse={setSelectedCourseName}
        setSection={setSelectedCourseSection}
        setProgramCourse={setSelectedProgramCourse}
        programCourseId={selectedProgramCourse}
      />
      <button onClick={() => setShowAddModal(true)}>เพิ่ม</button>
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
      />
      {editingAssignment && (
        <EditAssignmentModal
          assignment={editingAssignment}
          clos={clos}
          setModal={() => setEditingAssignment(null)}
          refresh={fetchAssignments} // รีเฟรชข้อมูลหลังแก้ไข
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
          <label htmlFor="courseSelection">Choose a Course</label>
          <select
            id="courseSelection"
            onChange={handleCourseChange}
            className={styles.selector}>
            <option value="">-- Select Course --</option>
            {courseWithSections.map((course, index) => (
              <option key={index} value={course.course_id}>
                {course.course_name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filter_container}>
          <label htmlFor="sectionSelection">Choose a Section</label>
          <select
            id="sectionSelection"
            className={styles.selector}
            onChange={(e) => {
              setSection(e.target.value);
              setProgramCourse(e.target.value);
            }}
            value={programCourseId}>
            <option value="default">Select section</option>
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

function AssignmentTable({ assignments, onEdit, fetchAssignments }) {
  const [selectedFile, setSelectedFile] = useState(null);

  async function deleteAssignment(id) {
    try {
      const response = await axios.delete(`/api/assignment/${id}`);
      alert("ลบงานเสร็จสิ้น");
    } catch (error) {
      console.log(error.message);
    }
    fetchAssignments();
  }

  function handleFileUpload(e) {
    let fileTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    setSelectedFile(e.target.files[0]);
    console.log(e.target.files[0]);
  }

  return (
    <>
      <section className={styles.table_header}>
        <h1>Assignments</h1>
      </section>
      <section className={styles.table_body}>
        <table>
          <thead>
            <tr>
              <th> Id </th>
              <th> Name </th>
              <th> Description </th>
              <th> Total score </th>
              <th> Due date </th>
              <th> Action</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length > 0 ? (
              assignments.map((assignment, index) => (
                <tr key={index}>
                  <td> {assignment.assignment_id} </td>
                  <td> {assignment.assignment_name} </td>
                  <td> {assignment.description} </td>
                  <td> {assignment.total_score} </td>
                  <td> {assignment.due_date ? assignment.due_date : "-"} </td>
                  <td>
                    {/* <button onClick={() => onEdit(assignment)}>Edit</button> */}
                    <button
                      onClick={() =>
                        document.getElementById("uploadStudentFile").click()
                      }>
                      มอบหมายงาน
                    </button>
                    <input
                      type="file"
                      id="uploadStudentFile"
                      style={{ display: "none" }}
                      accept=".xlsx, .xls"
                      onChange={handleFileUpload}
                    />
                    <button
                      onClick={() =>
                        deleteAssignment(assignment.assignment_id)
                      }>
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <p>ยังไม่มีข้อมูลแสดง</p>
            )}
          </tbody>
        </table>
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
    console.log(selectedClos);
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
            {clos.map((clo, index) => (
              <div key={index}>
                <input
                  type="checkbox"
                  value={clo.course_clo_id}
                  checked={selectedClos.includes(clo.course_clo_id)}
                  onChange={() => toggleClo(clo.course_clo_id)}
                />
                <label>{`${clo.CLO_code} ${clo.CLO_name}`}</label>

                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="น้ำหนัก"
                  value={cloWeights[clo.course_clo_id] || ""}
                  onChange={(e) =>
                    onWeightChange(clo.course_clo_id, e.target.value)
                  }
                  disabled={!selectedClos.includes(clo.course_clo_id)}
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
