import axios from "./axios";
import { transformAssessmentData } from "./utils/transformAssessmentData";
import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Bar, Pie, Doughnut } from "react-chartjs-2";

// ลงทะเบียน Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

function ViewChart() {
  // สร้าง state เพื่อเก็บข้อมูลจากเซิร์ฟเวอร์
  const [courseData, setCourseData] = useState({});
  const [studentPLOData, setStudentPLOData] = useState({});
  const [courseList, setCourseList] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // เพิ่ม state สำหรับการเลือกนักเรียน
  const [studentList, setStudentList] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentCourses, setStudentCourses] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentCourses();
      fetchDashboard();
    }
  }, [selectedStudent]);

  // ฟังก์ชันดึงรายชื่อนักเรียนทั้งหมด
  async function fetchStudents() {
    setLoadingStudents(true);
    try {
      const result = await axios.get("/api/students/program?program_id=1");
      const students = result.data;
      setStudentList(students);

      // ตั้งค่านักเรียนคนแรกเป็นค่าเริ่มต้น
      if (students.length > 0) {
        setSelectedStudent(students[0].student_id);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("ไม่สามารถดึงรายชื่อนักเรียนได้");
    } finally {
      setLoadingStudents(false);
    }
  }

  // ฟังก์ชันดึงรายวิชาที่นักเรียนลงทะเบียน
  async function fetchStudentCourses() {
    if (!selectedStudent) return;

    try {
      const result = await axios.get(
        `/api/student-course/course/${selectedStudent}`
      );
      setStudentCourses(result.data);
    } catch (error) {
      console.error("Error fetching student courses:", error);
      setStudentCourses([]);
    }
  }

  async function fetchDashboard() {
    if (!selectedStudent) return;

    setLoading(true);
    setError(null);
    try {
      const result = await axios.get(
        `/api/dashboard/${selectedStudent}/clo-report`
      );
      const raw_report = result.data;
      const { courses, courseCLOData, ploData, coursePLOMatrix } =
        transformAssessmentData(raw_report);

      setCourseList(courses);
      setCourseData(courseCLOData);
      setStudentPLOData({ ploList: ploData, coursePLOMatrix: coursePLOMatrix });

      // ตั้งค่ารายวิชาเริ่มต้นถ้ามีข้อมูล
      if (courses.length > 0) {
        setSelectedCourse(courses[0].id);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  // สร้างข้อมูลกราฟ CLO ตามรายวิชาที่เลือก
  const getCLOChartData = () => {
    if (!selectedCourse || !courseData[selectedCourse]) return null;

    const cloList = courseData[selectedCourse];

    return {
      labels: cloList.map((clo) => clo.clo_id),
      datasets: [
        {
          label: "ผลสัมฤทธิ์ CLO (%)",
          data: cloList.map((clo) => clo.percent),
          backgroundColor: cloList.map((clo) =>
            clo.passed ? "rgba(75, 192, 120, 0.8)" : "rgba(255, 99, 132, 0.8)"
          ),
          borderColor: cloList.map((clo) =>
            clo.passed ? "rgba(75, 192, 120, 1)" : "rgba(255, 99, 132, 1)"
          ),
          borderWidth: 1,
        },
      ],
    };
  };

  // สร้างข้อมูลกราฟ PLO Coverage
  const getPLOCoverageChartData = () => {
    if (!studentPLOData.ploList || studentPLOData.ploList.length === 0)
      return null;

    const passed = studentPLOData.ploList.filter((plo) => plo.passed).length;
    const notPassed = studentPLOData.ploList.length - passed;

    return {
      labels: ["ผ่านแล้ว", "ยังไม่ผ่าน"],
      datasets: [
        {
          label: "สัดส่วน PLO",
          data: [passed, notPassed],
          backgroundColor: [
            "rgba(75, 192, 120, 0.8)",
            "rgba(255, 99, 132, 0.8)",
          ],
          borderColor: ["rgba(75, 192, 120, 1)", "rgba(255, 99, 132, 1)"],
          borderWidth: 1,
        },
      ],
    };
  };

  // สร้างข้อมูลกราฟ PLO Per Course
  const getPLOBarChartData = () => {
    if (!studentPLOData.ploList || studentPLOData.ploList.length === 0)
      return null;

    return {
      labels: studentPLOData.ploList.map((plo) => plo.plo_id),
      datasets: [
        {
          label: "เปอร์เซ็นต์ความสำเร็จ",
          data: studentPLOData.ploList.map((plo) => plo.percent),
          backgroundColor: studentPLOData.ploList.map((plo) =>
            plo.passed ? "rgba(75, 192, 120, 0.8)" : "rgba(255, 99, 132, 0.8)"
          ),
          borderColor: studentPLOData.ploList.map((plo) =>
            plo.passed ? "rgba(75, 192, 120, 1)" : "rgba(255, 99, 132, 1)"
          ),
          borderWidth: 1,
        },
      ],
    };
  };

  // สร้างข้อมูลกราฟ Progress to Graduation
  const getProgressToGraduationData = () => {
    if (!studentPLOData.ploList || studentPLOData.ploList.length === 0)
      return null;

    const passedPLOs = studentPLOData.ploList.filter(
      (plo) => plo.passed
    ).length;
    const totalPLOs = studentPLOData.ploList.length;
    const percentComplete = Math.round((passedPLOs / totalPLOs) * 100);
    const percentRemaining = 100 - percentComplete;

    return {
      labels: [`ผ่านแล้ว ${percentComplete}%`, `ยังเหลือ ${percentRemaining}%`],
      datasets: [
        {
          label: "ความก้าวหน้าในการสำเร็จการศึกษา",
          data: [percentComplete, percentRemaining],
          backgroundColor: [
            "rgba(75, 192, 120, 0.8)",
            "rgba(220, 220, 220, 0.8)",
          ],
          borderColor: ["rgba(75, 192, 120, 1)", "rgba(220, 220, 220, 1)"],
          borderWidth: 1,
          cutout: "70%",
        },
      ],
    };
  };

  // สร้างตาราง Heat Map สำหรับ PLO per Course Matrix
  const renderPLOMatrix = () => {
    if (
      !studentPLOData.coursePLOMatrix ||
      !courseList ||
      courseList.length === 0
    )
      return null;

    // คิดข้อมูล PLO ที่มีในทุกรายวิชา
    const allPLOs = new Set();
    Object.values(studentPLOData.coursePLOMatrix).forEach((courseData) => {
      Object.keys(courseData).forEach((plo) => allPLOs.add(plo));
    });
    const ploArray = Array.from(allPLOs).sort();

    if (ploArray.length === 0) {
      return <div className="text-center">ไม่มีข้อมูล PLO Matrix</div>;
    }

    return (
      <div className="plo-matrix-container mt-4">
        <h5 className="text-center mb-3">PLO Matrix แยกตามรายวิชา</h5>
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>รายวิชา</th>
                {ploArray.map((plo) => (
                  <th key={plo}>{plo}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courseList.map((course) => (
                <tr key={course.id}>
                  <td>{course.name}</td>
                  {ploArray.map((plo) => {
                    const value =
                      studentPLOData.coursePLOMatrix[course.id]?.[plo] || 0;

                    // คำนวณสีตามค่า value
                    let cellStyle = {};
                    if (value > 0) {
                      // คำนวณสีเขียวถึงแดงตามค่า 0-100
                      const intensity = value / 100;
                      const red = Math.floor((1 - intensity) * 255);
                      const green = Math.floor(intensity * 255);
                      cellStyle = {
                        backgroundColor: `rgba(${red}, ${green}, 100, 0.7)`,
                        color: value > 50 ? "black" : "white",
                        fontWeight: "bold",
                      };
                    }

                    return (
                      <td key={`${course.id}-${plo}`} style={cellStyle}>
                        {value > 0 ? `${value}%` : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ตัวเลือกสำหรับกราฟแท่ง CLO
  const cloChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "CLO Completion per Course",
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.raw}% (${context.raw >= 70 ? "ผ่าน" : "ไม่ผ่าน"})`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "ร้อยละความสำเร็จ (%)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Course Learning Outcomes",
        },
      },
    },
  };

  // ตัวเลือกสำหรับกราฟวงกลม PLO Coverage
  const ploCoverageOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
      },
      title: {
        display: true,
        text: "PLO Coverage",
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const dataset = context.dataset;
            const total = dataset.data.reduce((acc, data) => acc + data, 0);
            const currentValue = dataset.data[context.dataIndex];
            const percentage = Math.round((currentValue / total) * 100);
            return `${context.label}: ${currentValue} PLOs (${percentage}%)`;
          },
        },
      },
    },
  };

  // ตัวเลือกสำหรับกราฟแท่ง PLO per Course
  const ploBarOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "PLO Achievement",
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.raw}% (${context.raw >= 70 ? "ผ่าน" : "ไม่ผ่าน"})`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "ร้อยละความสำเร็จ (%)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Program Learning Outcomes",
        },
      },
    },
  };

  // ตัวเลือกสำหรับกราฟโดนัท Progress to Graduation
  const progressOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
      },
      title: {
        display: true,
        text: "Progress to Graduation",
        font: { size: 16 },
      },
    },
  };

  // ฟังก์ชันแสดงผลกราฟโดนัทพร้อมข้อความตรงกลาง
  const renderProgressWithCenter = () => {
    if (!studentPLOData.ploList || studentPLOData.ploList.length === 0)
      return null;

    const passedPLOs = studentPLOData.ploList.filter(
      (plo) => plo.passed
    ).length;
    const totalPLOs = studentPLOData.ploList.length;
    const percentComplete = Math.round((passedPLOs / totalPLOs) * 100);

    return (
      <div className="donut-container position-relative">
        <div className="position-absolute top-50 start-50 translate-middle text-center">
          <h2 style={{ fontSize: "24px", margin: 0 }}>{percentComplete}%</h2>
          <p style={{ fontSize: "14px", margin: 0 }}>
            ({passedPLOs}/{totalPLOs} PLOs)
          </p>
        </div>
        <Doughnut
          data={getProgressToGraduationData()}
          options={progressOptions}
        />
      </div>
    );
  };

  // แสดงผลการโหลด
  if (loadingStudents) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">กำลังโหลดรายชื่อนักเรียน...</span>
        </div>
        <p className="mt-2">กำลังโหลดรายชื่อนักเรียน...</p>
      </div>
    );
  }

  // แสดงผล error
  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger text-center" role="alert">
          <h4 className="alert-heading">เกิดข้อผิดพลาด!</h4>
          <p>{error}</p>
          <button
            className="btn btn-outline-danger"
            onClick={() => {
              if (selectedStudent) {
                fetchDashboard();
              } else {
                fetchStudents();
              }
            }}>
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // แสดงผลเมื่อไม่มีนักเรียน
  if (studentList.length === 0) {
    return (
      <div className="container py-4">
        <div className="alert alert-info text-center" role="alert">
          <h4 className="alert-heading">ไม่มีข้อมูล</h4>
          <p>ไม่พบรายชื่อนักเรียนในระบบ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">ระบบติดตามความก้าวหน้า PLO/CLO</h1>

      {/* ส่วนเลือกนักเรียน */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <label htmlFor="studentSelect" className="form-label">
                    <strong>เลือกนักเรียน:</strong>
                  </label>
                  <select
                    id="studentSelect"
                    className="form-select"
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}>
                    <option value="">-- เลือกนักเรียน --</option>
                    {studentList.map((student) => (
                      <option
                        key={student.student_id}
                        value={student.student_id}>
                        {student.student_id} - {student.first_name}{" "}
                        {student.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  {selectedStudent && (
                    <div className="mt-3 mt-md-0">
                      <strong>รายวิชาที่ลงทะเบียน:</strong>
                      <div className="mt-1">
                        {studentCourses.length > 0 ? (
                          <span className="badge bg-info me-1">
                            {studentCourses.length} รายวิชา
                          </span>
                        ) : (
                          <span className="text-muted">
                            ไม่มีรายวิชาที่ลงทะเบียน
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* แสดงสถานะการโหลดข้อมูล dashboard */}
      {loading && selectedStudent && (
        <div className="text-center p-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">กำลังโหลดข้อมูล...</span>
          </div>
          <p className="mt-2">กำลังโหลดข้อมูลของนักเรียน...</p>
        </div>
      )}

      {/* แสดงข้อความเมื่อยังไม่ได้เลือกนักเรียน */}
      {!selectedStudent && (
        <div className="alert alert-info text-center" role="alert">
          <h5 className="alert-heading">กรุณาเลือกนักเรียน</h5>
          <p className="mb-0">
            เลือกนักเรียนจากรายการด้านบนเพื่อดูข้อมูล PLO/CLO
          </p>
        </div>
      )}

      {/* แสดงข้อมูลเมื่อไม่มีรายวิชา */}
      {selectedStudent && !loading && courseList.length === 0 && (
        <div className="alert alert-warning text-center" role="alert">
          <h5 className="alert-heading">ไม่มีข้อมูล</h5>
          <p className="mb-0">นักเรียนคนนี้ยังไม่มีข้อมูล PLO/CLO ในระบบ</p>
        </div>
      )}

      {/* แสดงกราฟและข้อมูลเมื่อมีข้อมูล */}
      {selectedStudent && !loading && courseList.length > 0 && (
        <>
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <div className="mb-3">
                    <label htmlFor="courseSelect" className="form-label">
                      เลือกรายวิชา:
                    </label>
                    <select
                      id="courseSelect"
                      className="form-select"
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}>
                      {courseList.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {getCLOChartData() ? (
                    <Bar data={getCLOChartData()} options={cloChartOptions} />
                  ) : (
                    <div className="text-center text-muted">
                      ไม่มีข้อมูล CLO สำหรับรายวิชานี้
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-5">
                      {getPLOCoverageChartData() ? (
                        <Pie
                          data={getPLOCoverageChartData()}
                          options={ploCoverageOptions}
                        />
                      ) : (
                        <div className="text-center text-muted">
                          ไม่มีข้อมูล PLO Coverage
                        </div>
                      )}
                    </div>
                    <div className="col-md-7">
                      {getPLOBarChartData() ? (
                        <Bar
                          data={getPLOBarChartData()}
                          options={ploBarOptions}
                        />
                      ) : (
                        <div className="text-center text-muted">
                          ไม่มีข้อมูล PLO Achievement
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body text-center">
                  {renderProgressWithCenter()}
                  <div className="mt-3">
                    {studentPLOData.ploList &&
                      studentPLOData.ploList.length > 0 && (
                        <>
                          <p className="mb-1">
                            <strong>จำนวน PLO ที่ผ่านแล้ว:</strong>{" "}
                            {
                              studentPLOData.ploList.filter((plo) => plo.passed)
                                .length
                            }
                            /{studentPLOData.ploList.length}
                          </p>
                          <p className="mb-1">
                            <strong>เกณฑ์การสำเร็จการศึกษา:</strong>{" "}
                            ผ่านอย่างน้อย 70% ของ PLO ทั้งหมด
                          </p>
                          <p
                            className={`alert ${studentPLOData.ploList.filter((plo) => plo.passed).length >= studentPLOData.ploList.length * 0.7 ? "alert-success" : "alert-warning"} mt-2 p-2`}>
                            {studentPLOData.ploList.filter((plo) => plo.passed)
                              .length >=
                            studentPLOData.ploList.length * 0.7
                              ? "ผ่านเกณฑ์การสำเร็จการศึกษาแล้ว"
                              : "ยังไม่ผ่านเกณฑ์การสำเร็จการศึกษา"}
                          </p>
                        </>
                      )}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-8">
              <div className="card h-100">
                <div className="card-body">{renderPLOMatrix()}</div>
              </div>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">คำแนะนำในการลงทะเบียนเรียน</h5>
                </div>
                <div className="card-body">
                  {studentPLOData.ploList &&
                  studentPLOData.ploList.length > 0 ? (
                    <>
                      <p>
                        จากผลการวิเคราะห์ PLO ที่ยังไม่ผ่าน
                        ควรพัฒนาทักษะในด้านต่อไปนี้:
                      </p>
                      <ul>
                        {studentPLOData.ploList
                          .filter((plo) => !plo.passed)
                          .map((plo, index) => (
                            <li key={index}>
                              <strong>{plo.plo_id}:</strong> {plo.name} (
                              {plo.percent.toFixed(1)}%)
                            </li>
                          ))}
                      </ul>
                      {studentPLOData.ploList.filter((plo) => !plo.passed)
                        .length === 0 && (
                        <p className="text-success">
                          <strong>ยินดีด้วย!</strong> คุณผ่าน PLO ทั้งหมดแล้ว
                        </p>
                      )}
                    </>
                  ) : (
                    <p>ไม่มีข้อมูลสำหรับการแนะนำ</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ViewChart;
