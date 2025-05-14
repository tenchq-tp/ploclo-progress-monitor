import axios from "../axios";
import { useEffect, useState } from "react";

export default function CloMapping({
  handleEditToggle,
  editingScores,
  courseClo,
  selectedCourseId,
  courses,
  weightEachCourse,
  handleEditWeightEachCourse,
}) {
  const id_array = useState(initCourseClo());
  const [weightValues, setWeightValues] = useState([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // อัปเดต id_array และ weightValues เมื่อ courseClo หรือ weightEachCourse เปลี่ยน
  useEffect(() => {
    initCourseClo();
  }, [courseClo, weightEachCourse]);
  
  // fetch ข้อมูลใหม่เมื่อ selectedCourseId, selectedSemesterId, หรือ selectedYear เปลี่ยน
  useEffect(() => {
    if (selectedCourseId && selectedSemesterId && selectedYear) {
      fetchWeightData();
    }
  }, [selectedCourseId, selectedSemesterId, selectedYear]);

  // คำนวณ total weight เมื่อ weightValues เปลี่ยน
  useEffect(() => {
    calculateTotalWeight();
  }, [weightValues]);

  // ฟังก์ชันดึงข้อมูล weight
  async function fetchWeightData() {
    setLoading(true);
    try {
      const response = await axios.get("/api/clo-mapping/weight", {
        params: {
          course_id: selectedCourseId,
          semester_id: selectedSemesterId,
          year: selectedYear,
        },
      });
      
      if (response.data && Array.isArray(response.data)) {
        // บันทึก id array และ weight array จากข้อมูลที่ได้
        const ids = response.data.map(data => data.course_clo_id);
        const weights = response.data.map(data => data.weight || 0);
        
        setIdArray(ids);
        setWeightValues(weights);
        console.log("Weight data fetched successfully:", response.data);
      } else {
        console.warn("No weight data received or invalid format");
        setIdArray([]);
        setWeightValues([]);
      }
    } catch (error) {
      console.error("Error fetching weight data:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleOnChange(newValue, index) {
    const updatedWeights = [...weightValues]; // สร้าง copy ใหม่แบบ shallow
    updatedWeights[index] = parseFloat(newValue) || 0; // ตรวจสอบค่า
    setWeightValues(updatedWeights);

  }

  function calculateTotalWeight() {
    let total = 0;
    for (let i = 0; i < weightValues.length; i++) {
      total += parseInt(weightValues[i] || 0);
    }
    setTotalWeight(total);
  }

  function initCourseClo() {
    if (!Array.isArray(courseClo) || courseClo.length === 0) {
      setIdArray([]);
      setWeightValues([]);
      return;
    }
    
    const ids = courseClo.map(data => data.course_clo_id);
    const weights = courseClo.map(data => data.weight || 0);
    
    setIdArray(ids);
    setWeightValues(weights);
  }

  async function handleSubmit() {
    // ตรวจสอบว่ามีข้อมูลให้อัปเดตหรือไม่
    if (id_array.length === 0 || weightValues.length === 0) {
      console.warn("No data to update");
      return;
    }
    
    // สร้างข้อมูลที่จะส่งไปอัปเดต
    let updates = [];
    for (let i = 0; i < Math.min(id_array.length, weightValues.length); i++) {
      updates.push({
        id: id_array[i],
        score: parseInt(weightValues[i] || 0),
      });
    }

    setLoading(true);
    try {
      const response = await axios.put("/api/clo-mapping/weight", {
        updates: [...updates],
      });      
      // Refetch data after successful update
      await fetchWeightData();
      
      // Toggle editing mode off
      handleEditToggle();
    } catch (error) {
      console.error("Error during update:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h3 className="mt-3">Course-CLO Mapping</h3>
      <div className="action-buttons mb-3" style={{ marginTop: "15px" }}>
        <button onClick={handleEditToggle} className="btn btn-primary me-2" disabled={loading}>
          {editingScores ? "Cancel Edit" : "Edit Course-CLO Mapping"}
        </button>

        <button
          onClick={handleSubmit}
          disabled={!editingScores || loading}
          className="btn"
          style={{ backgroundColor: "#FF8C00", color: "white" }}>
          {loading ? "กำลังบันทึก..." : "Submit Course-CLO Scores"}
        </button>
      </div>

      {loading ? (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">กำลังโหลดข้อมูล...</span>
          </div>
          <p className="mt-2">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <table
          className="table table-bordered"
          style={{
            borderCollapse: "collapse",
            width: "100%",
            marginTop: "15px",
            border: "2px solid black",
          }}>
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid black",
                  padding: "10px",
                  textAlign: "center",
                }}
                rowSpan="2">
                Course
              </th>
              <th
                style={{
                  border: "1px solid black",
                  padding: "10px",
                  textAlign: "center",
                  backgroundColor: "#f2f2f2",
                }}
                colSpan={courseClo.length}>
                CLO
              </th>
              <th
                style={{
                  border: "1px solid black",
                  padding: "10px",
                  textAlign: "center",
                }}
                rowSpan="2">
                Total(100)
              </th>
            </tr>
            <tr>
              {courseClo.map((clo) => (
                <th
                  key={`header-${clo.CLO_code}`}
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    textAlign: "center",
                  }}>
                  {clo.CLO_code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map(
              (courseItem) =>
                courseItem.course_id == selectedCourseId && (
                  <tr key={courseItem.course_id}>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "10px",
                      }}>
                      {courseItem.course_id} {courseItem.course_name}
                    </td>
                    {weightValues.map((weight, index) => (
                      <td
                        key={index}
                        style={{
                          border: "1px solid black",
                          padding: "10px",
                          textAlign: "center",
                        }}>
                        {editingScores ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={weight || 0}
                            style={{
                              width: "60px",
                              padding: "5px",
                              textAlign: "center",
                            }}
                            onChange={(e) =>
                              handleOnChange(e.target.value, index)
                            }
                          />
                        ) : (
                          weight || 0
                        )}
                      </td>
                    ))}
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "10px",
                        textAlign: "center",
                        fontWeight: "bold",
                        color: totalWeight === 100 ? "green" : "red",
                      }}>
                      {totalWeight}
                      
                    </td>
                  </tr>
                )
            )}
          </tbody>
        </table>
      )}
    </>
  );
}