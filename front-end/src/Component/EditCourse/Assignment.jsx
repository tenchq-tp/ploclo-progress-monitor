import axios from "./../../axios";
import { useEffect, useState } from "react";
import styles from "./styles/Assignment.module.css";

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
      console.log("assignment ----> ", response);
      setAssignments(response.data);
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
      <button onClick={() => setShowAddModal(true)}>Add Assignment</button>
      {showAddModal && (
        <AddAssignmentModal
          setModal={setShowAddModal}
          programCourseId={selectedProgramCourse}
          programCourse={selectedProgramCourse}
          faculty={selectedFaculty}
          university={selectedUniversity}
        />
      )}
      <AssignmentTable assignments={assignments} />
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
    const course = courseWithSections.find(
      (c) => c.course_name === selectedName
    );
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
              <option key={index} value={course.course_name}>
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

function AssignmentTable({ assignments, programCourseId }) {
  return (
    <>
      <section className={styles.table_header}>
        <h1>Assignments {programCourseId}</h1>
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
                    <button>Edit</button>
                    <button>Delete</button>
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

function AddAssignmentModal({ programCourse, faculty, university, setModal }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxScore, setMaxScore] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [activeTab, setActiveTab] = useState("assignment");
  async function addAssignment() {
    try {
      const respones = await axios.post("/api/assignment", {
        program_course_id: programCourse,
        name,
        description,
        max_score: maxScore,
        due_data: dueDate,
        faculty_id: faculty,
        university_id: university,
      });
      alert("เพิ่มงานสำเร็จ!");
      setModal(false);
    } catch (error) {
      console.error(error);
    }
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
            <div>
              <input type="checkbox" value={"CLO1"} />
              <label>CLO1 การทำงานเป็นทีม</label>
            </div>
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
