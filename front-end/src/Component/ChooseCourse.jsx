import styles from "./styles/ChooseCourse.module.css";

export default function ChooseCourse({ courseArray, onChange }) {
  return (
    <div className={styles.container}>
      <label className={styles.label}>Choose a course</label>
      <select className={styles.selector} onChange={onChange}>
        <option value={0}>--- select a course ---</option>
        {Array.from(
          new Map(courseArray.map((course) => [course.course_name, course])).values()
        ).map((courses) => (
          <option key={courses.course_id} value={courses.course_id}>
            {`${courses.course_id} ${courses.course_name} (${courses.course_engname})`}
          </option>
        ))}
      </select>
    </div>
  );
}
