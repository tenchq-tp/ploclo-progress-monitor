import { useEffect, useState } from "react";
import ChooseCourse from "../ChooseCourse";
import styles from "./styles/CloPloMapping.module.css";
import axios from "./../axios";

export default function CloPloMapping({
  selectedProgram,
  selectedYear,
  selectedSemester,
}) {
  const [courseArray, setCourseArray] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(0);
  const [plos, setPlos] = useState([]);
  const [clos, setClos] = useState([]);
  const [mappingState, setMappingState] = useState({});
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [selectedSemester]);

  useEffect(() => {
    setMappingState({});
    fetchClos();
    fetchPlos();
    if (selectedCourse) {
      fetchMapping(); // ✅ ดึง mapping ด้วย
    }
  }, [selectedCourse]);

  useEffect(() => {
    console.log(mappingState);
  }, [mappingState]);

  async function fetchMapping() {
    try {
      const response = await axios.get("/api/plo/mapping", {
        params: {
          course_id: selectedCourse,
          year: selectedYear,
        },
      });

      const mappings = {};
      response.data.forEach(({ clo_id, plo_id, weight }) => {
        mappings[clo_id] = {
          ploId: plo_id,
          weight: weight,
        };
      });
      setMappingState(mappings); // ✅ preload mapping เข้า checkbox
    } catch (error) {
      console.error("Error loading CLO-PLO mappings:", error);
    }
  }

  async function fetchCourses() {
    try {
      const response = await axios.get("/api/program-course/detail", {
        params: {
          program_id: selectedProgram,
          year: selectedYear,
        },
      });
      setCourseArray(response.data);
    } catch (error) {
      setCourseArray([]);
      console.error(error);
    }
  }

  async function fetchPlos() {
    try {
      const response = await axios.get("/api/plo", {
        params: { program_id: selectedProgram, year: selectedYear },
      });
      setPlos(response.data);
    } catch (error) {
      setPlos([]);
      console.error(error);
    }
  }

  async function fetchClos() {
    try {
      const response = await axios.get("/api/clo/course", {
        params: {
          course_id: selectedCourse,
          year: selectedYear,
        },
      });
      setClos(response.data.data);
    } catch (error) {
      setClos([]);
      console.error(error);
    }
  }

  function handleToggleCheckbox(ploId, cloId) {
    setMappingState((prev) => {
      const current = prev[cloId];
      if (current?.ploId === ploId) {
        const newState = { ...prev };
        delete newState[cloId];
        return newState;
      }
      return {
        ...prev,
        [cloId]: {
          ploId: ploId,
          weight: current?.weight || 0,
        },
      };
    });
  }

  function handleWeightChange(cloId, value) {
    setMappingState((prev) => ({
      ...prev,
      [cloId]: {
        ...prev[cloId],
        weight: parseInt(value) || 0,
      },
    }));
  }

  async function handleSubmit() {
    const payload = Object.entries(mappingState).map(
      ([cloId, { ploId, weight }]) => ({
        clo_id: parseInt(cloId),
        plo_id: ploId,
        weight: weight,
      })
    );

    const isValid = payload.every((item) => item.weight > 0);
    if (!isValid) {
      alert("Please enter a weight greater than 0 for each mapping.");
      return;
    }

    try {
      const response = await axios.post("/api/plo/save", {
        year: selectedYear, // ✅ ส่ง year ด้วย
        mappings: payload,
      });

      if (response.status === 200) {
        alert("Mapping saved successfully!");
      } else {
        alert("Something went wrong while saving mappings.");
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert("Error saving mappings. Please try again.");
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.selector}>
        <ChooseCourse
          courseArray={courseArray}
          onChange={(e) => setSelectedCourse(e.target.value)}
        />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.mappingTable}>
          <thead>
            <tr>
              <th></th>
              {clos.map((clo, index) => (
                <th key={index}>{clo.CLO_code}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plos.map((plo, index) => (
              <tr key={index}>
                <th>{plo.PLO_code}</th>
                {clos.map((clo) => {
                  const key = `${plo.PLO_id}_${clo.CLO_id}`;
                  const isChecked =
                    mappingState[clo.CLO_id]?.ploId === plo.PLO_id;
                  return (
                    <td key={key} className={styles.mappingCell}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          handleToggleCheckbox(plo.PLO_id, clo.CLO_id)
                        }
                      />
                      {isChecked && (
                        <input
                          type="number"
                          className={styles.weightInput}
                          placeholder="%"
                          value={mappingState[clo.CLO_id]?.weight || ""}
                          onChange={(e) =>
                            handleWeightChange(clo.CLO_id, e.target.value)
                          }
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.submitWrapper}>
        <button onClick={handleSubmit} className={styles.submitButton}>
          Submit
        </button>
      </div>
    </div>
  );
}
