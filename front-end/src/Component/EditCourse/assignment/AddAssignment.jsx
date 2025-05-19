import { useState } from "react";
import styles from "./../styles/Assignment.module.css";
import axios from "./../../axios";

export default function AddAssignmentModal({
  programCourse,
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
