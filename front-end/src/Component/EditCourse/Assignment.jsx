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
      <h1>Assignment</h1>
      <SelectorCourses courses={availableCourses} />

      <dl>
        <dt>University</dt>
        <dd>{selectedUniversity}</dd>
        <dt>Faculty</dt>
        <dd>{selectedFaculty}</dd>
        <dt>Program</dt>
        <dd>{selectedProgram}</dd>
        <dt>Year</dt>
        <dd>{selectedYear}</dd>
        <dt>Semester</dt>
        <dd>{selectedSemester}</dd>
      </dl>
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
    console.log(selectedCourseName);
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
      <div>
        <label htmlFor="courseSelection">Choose a course</label>
        <select id="courseSelection" onChange={handleCourseChange}>
          <option value="">-- Select Course --</option>
          {courseWithSections.map((course, index) => (
            <option key={index} value={course.course_name}>
              {course.course_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="sectionSelection">Choose a section</label>
        <select id="sectionSelection" disabled={!availableSections.length}>
          <option value="">-- Select Section --</option>
          {availableSections.map((sec, index) => (
            <option key={index} value={sec}>
              Section {sec}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
