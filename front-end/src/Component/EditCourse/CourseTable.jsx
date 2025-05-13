import React, { useState } from "react";
import axios from "../axios"; // ให้แน่ใจว่าเส้นทางการนำเข้า axios ถูกต้องตามโครงสร้างโปรเจค
import { useTranslation } from "react-i18next";

export default function CourseTable({
  course_list,
  deleteCourse,
  onCourseUpdated,
}) {
        const { t, i18n } = useTranslation();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState({
    course_id: "",
    course_name: "",
    course_engname: "",
    section_id: "",
    program_id: "",
    year: "",
    semester_id: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ฟังก์ชันเปิด Modal และตั้งค่าข้อมูลคอร์สที่จะแก้ไข
  const openEditModal = (course) => {
    setEditingCourse({
      course_id: course.course_id,
      course_name: course.course_name,
      course_engname: course.course_engname,
      section_id: course.section_id || course.section,
      program_id: course.program_id,
      year: course.year,
      semester_id: course.semester_id,
    });
    setErrorMessage(""); // รีเซ็ตข้อความผิดพลาด
    setShowEditModal(true);
  };

  // ฟังก์ชันอัพเดตข้อมูลที่กำลังแก้ไข
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingCourse((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ฟังก์ชันบันทึกการแก้ไขโดยเรียกใช้ API endpoint โดยตรง
  const saveEdit = async () => {
    // เตรียมข้อมูลที่จะส่งไปยัง API
    const updateData = {
      course_name: editingCourse.course_name,
      course_engname: editingCourse.course_engname,
      // ถ้ามีการเปลี่ยน course_id ให้ส่ง new_course_id ไปด้วย
      // new_course_id: editingCourse.new_course_id, // ถ้ามีฟิลด์นี้ในฟอร์ม
      // ถ้าต้องการส่ง program_id และ semester_id ด้วย
      program_id: editingCourse.program_id,
      semester_id: editingCourse.semester_id,
    };

    try {
      setIsLoading(true);

      // เรียกใช้ API endpoint สำหรับอัพเดตรายวิชา
      const response = await axios.put(
        `/api/program-course/${editingCourse.course_id}`,
        updateData
      );

      console.log("Course updated successfully:", response.data);

      // ถ้ามีการส่ง callback function มาจากคอมโพเนนต์หลัก
      if (typeof onCourseUpdated === "function") {
        onCourseUpdated(); // เรียกใช้เพื่อให้โหลดข้อมูลใหม่
      } else {
        // ถ้าไม่มี callback สามารถรีโหลดหน้าหรือใช้วิธีอื่นได้
        window.location.reload(); // รีโหลดหน้าเพื่อแสดงข้อมูลใหม่
      }

      // แจ้งเตือนผู้ใช้
      alert("อัพเดตรายวิชาสำเร็จ");

      // ปิด Modal
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating course:", error);

      // แสดงข้อความผิดพลาด
      if (error.response && error.response.data) {
        setErrorMessage(
          error.response.data.message || "เกิดข้อผิดพลาดในการอัพเดตรายวิชา"
        );
      } else {
        setErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h4>{t('Course List')}</h4>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>{t('Course ID')}</th>
            <th>{t('Course Name')}</th>
            <th>{t('Course engName')}</th>
            <th>{t('Section')}</th>
            <th>{t('Actions')}</th>
          </tr>
        </thead>
        <tbody>
  {course_list && course_list.length > 0 &&
    course_list.map((courseItem) => (
      <tr key={`${courseItem.course_id}_${courseItem.section_id}`}>
        <td>{courseItem.course_id}</td>
        <td>{courseItem.course_name}</td>
        <td>{courseItem.course_engname}</td>
        <td>{courseItem.section_id}</td>
        <td>
          <button
            onClick={() => openEditModal(courseItem)}
            className="btn btn-warning btn-sm me-2"
          >
            {t('Edit')}
          </button>
          <button
            onClick={() =>
              deleteCourse(courseItem.course_id, courseItem.section_id)
            }
            className="btn btn-danger btn-sm"
          >
            {t('Delete')}
          </button>
        </td>
      </tr>
    ))}
</tbody>

      </table>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">แก้ไขรายวิชา</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"></button>
              </div>
              <div className="modal-body">
                {errorMessage && (
                  <div className="alert alert-danger">{errorMessage}</div>
                )}
                <div className="mb-3">
                  <label htmlFor="course_id" className="form-label">
                    รหัสวิชา
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="course_id"
                    name="course_id"
                    value={editingCourse.course_id}
                    onChange={handleInputChange}
                    disabled
                  />
                  <small className="text-muted">
                    รหัสวิชาไม่สามารถแก้ไขได้
                  </small>
                </div>
                <div className="mb-3">
                  <label htmlFor="course_name" className="form-label">
                    ชื่อวิชา (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="course_name"
                    name="course_name"
                    value={editingCourse.course_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="course_engname" className="form-label">
                    ชื่อวิชา (ภาษาอังกฤษ)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="course_engname"
                    name="course_engname"
                    value={editingCourse.course_engname}
                    onChange={handleInputChange}
                  />
                </div>
                {/* อาจมีฟิลด์เพิ่มเติมตามที่ API endpoint รองรับ */}
                <div className="mb-3">
                  <label htmlFor="section_id" className="form-label">
                    เซคชัน
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="section_id"
                    name="section_id"
                    value={editingCourse.section_id}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={isLoading}>
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveEdit}
                  disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"></span>
                      กำลังบันทึก...
                    </>
                  ) : (
                    "บันทึกการแก้ไข"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay ทำให้พื้นหลังเป็นสีเข้มเมื่อเปิด Modal */}
      {showEditModal && (
        <div
          className="modal-backdrop fade show"
          onClick={() => !isLoading && setShowEditModal(false)}></div>
      )}
    </div>
  );
}
