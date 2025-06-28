import styles from "./styles/ChooseCourse.module.css";
import { useTranslation } from "react-i18next";

export default function ChooseCourse({ courseArray, onChange }) {
   const { t, i18n } = useTranslation();
  return (
    <div className={styles.container}>
      <label className={styles.label}>{t("Choose a Course")}</label>
      <select className={styles.selector} onChange={onChange}>
        <option value={0}>--- {t("Select Course")} ---</option>
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
