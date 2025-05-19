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

  return (
    <>
      <SelectorCourses
        courses={availableCourses}
        setCourse={setSelectedCourseName}
        setSection={setSelectedCourseSection}
      />
      <button onClick={() => setShowAddModal(true)}>Add Assignment</button>
      {showAddModal && <AddAssignmentModal setModal={setShowAddModal} />}
      <AssignmentTable />
    </>
  );
}

function SelectorCourses({ courses, setCourse, setSection }) {
  const [courseWithSections, setCourseWithSections] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);

  useEffect(() => {
    const groupedCourses = [];

    courses.forEach((course) => {
      const existing = groupedCourses.find(
        (c) => c.course_id === course.course_id
      );
      if (existing) {
        existing.section.push(course.section_id);
      } else {
        groupedCourses.push({
          course_id: course.course_id,
          course_name: course.course_name,
          section: [course.section_id],
        });
      }
    });
    setCourseWithSections(groupedCourses);
  }, [courses]);

  const handleCourseChange = (e) => {
    const selectedName = e.target.value;
    setCourse(selectedName);
    setSection();
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
            onChange={(e) => setSection(e.target.value)}>
            <option value="">Select section</option>
            {availableSections.map((sec, index) => (
              <option key={index} value={sec}>
                Section {sec}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}

function AssignmentTable({ assignments }) {
  return (
    <>
      <section className={styles.table_header}>
        <h1>Assignments</h1>
      </section>
      <section className={styles.table_body}>
        <table>
          <thead>
            <tr>
              <th> id </th>
              <th> name </th>
              <th> description </th>
              <th> total score </th>
              <th> due date </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td> 1 </td>
              <td> การบ้าน 1 </td>
              <td> แก้โจทย์ปัญหาในห้องเรียน </td>
              <td> 10 </td>
              <td> 1/1/2029 </td>
            </tr>
            <tr>
              <td> 1 </td>
              <td> การบ้าน 1 </td>
              <td> แก้โจทย์ปัญหาในห้องเรียน </td>
              <td> 10 </td>
              <td> 1/1/2029 </td>
            </tr>
            <tr>
              <td> 1 </td>
              <td> การบ้าน 1 </td>
              <td> แก้โจทย์ปัญหาในห้องเรียน </td>
              <td> 10 </td>
              <td> 1/1/2029 </td>
            </tr>
          </tbody>
        </table>
      </section>
    </>
  );
}

function AddAssignmentModal({
  course,
  section,
  faculty,
  university,
  setModal,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxScore, setMaxScore] = useState(0);
  const [dueDate, setDueDate] = useState("");
  async function addAssignment() {
    try {
      const respones = await axios.post();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className={styles.modal_container}>
      <div className={styles.modal}>
        <h2 className={styles.modal_title}>เพิ่มงานใหม่</h2>

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
