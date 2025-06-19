import axios from "../axios";
import { useEffect, useState } from "react";

export default function CloMapping({ selectedCourseId }) {
  const [cloData, setCloData] = useState([]);
  const [courseItem, setCourseItem] = useState({});

  useEffect(() => {
    fetchCloMapping();
  }, [selectedCourseId]);

  async function fetchCloMapping() {
    try {
      const response = await axios.get(
        `/api/clo/clo-mapping/${selectedCourseId}`
      );
      if (response.data.success) {
        setCloData(response.data.data);
        if (response.data.data.length > 0) {
          const { course_id, course_name } = response.data.data[0];
          setCourseItem({ course_id, course_name });
        }
      }
    } catch (error) {
      console.error("Error fetching CLO mapping:", error);
      setCloData([]);
      setCourseItem({});
    }
  }

  return (
    <>
      <h2 className="mt-3">Course-CLO Mapping (View Only)</h2>
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
            <th rowSpan="2" style={styles.cell}>
              Course
            </th>
            <th
              colSpan={cloData.length}
              style={{ ...styles.cell, backgroundColor: "#f2f2f2" }}>
              CLO
            </th>
            <th rowSpan="2" style={styles.cell}>
              Total (100)
            </th>
          </tr>
          <tr>
            {cloData.map((clo) => (
              <th key={clo.CLO_id} style={styles.cell}>
                {clo.CLO_code}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={styles.cell}>
              {courseItem.course_id} {courseItem.course_name}
            </td>
            {cloData.map((clo) => (
              <td
                key={clo.CLO_id}
                style={{ ...styles.cell, textAlign: "center" }}>
                {parseFloat(clo.clo_weight_percent).toFixed(2)}
              </td>
            ))}
            <td
              style={{
                ...styles.cell,
                textAlign: "center",
                fontWeight: "bold",
              }}>
              {cloData
                .reduce(
                  (sum, clo) => sum + parseFloat(clo.clo_weight_percent),
                  0
                )
                .toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

const styles = {
  cell: {
    border: "1px solid black",
    padding: "10px",
    textAlign: "center",
  },
};
