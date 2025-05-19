import styles from "./StudentExcel.module.css";

export default function StudentExcel({
  students,
  onClose,
  selectedAssignmentStudent,
}) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.header}>รายชื่อนักเรียนจาก Excel</h2>
        <div className={styles.studentTableWrapper}>
          <table className={styles.studentTable}>
            <thead>
              <tr>
                <th>รหัสนักศึกษา</th>
                <th>ชื่อ</th>
                <th>นามสกุล</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, index) => (
                <tr key={index}>
                  <td>{s.student_id}</td>
                  <td>{s.ชื่อ}</td>
                  <td>{s.นามสกุล}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          ปิด
        </button>
      </div>
    </div>
  );
}
