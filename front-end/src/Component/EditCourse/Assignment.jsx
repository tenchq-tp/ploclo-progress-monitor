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
      <SelectorCourses courses={availableCourses} />
      <AssignmentTable />
    </>
  );
}

function SelectorCourses({ courses }) {
  const [courseWithSections, setCourseWithSections] = useState([]);
  const [selectedCourseName, setSelectedCourseName] = useState("");
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
    setSelectedCourseName(selectedName);

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
            <option value="Test">-- Select Course --</option>
            {/* {courseWithSections.map((course, index) => (
              <option key={index} value={course.course_name}>
                {course.course_name}
              </option>
            ))} */}
            <option>แคลคูลัส 1</option>
            <option>ฟิสิกส์ 1</option>
          </select>
        </div>

        <div className={styles.filter_container}>
          <label htmlFor="sectionSelection">Choose a Section</label>
          <select id="sectionSelection" className={styles.selector}>
            <option value="Test">Select section</option>
            {/* {availableSections.map((sec, index) => (
              <option key={index} value={sec}>
                Section {sec}
              </option>
            ))} */}
            <option>1</option>
            <option>2</option>
            <option>3</option>
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
              <th>  </th>
              <th></th>
              <th></th>
            </tr>
          </thead>
        </table>
      </section>
    </>
  );
}
