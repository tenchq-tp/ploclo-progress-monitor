import React, { useState, useEffect } from "react";
import axios from "./axios";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";

export default function Program() {
  const [program, setProgram] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [filteredProgram, setFilteredProgram] = useState([]);
  const [newProgram, setNewProgram] = useState({
    program_name: "",
    program_name_th: "",
    program_shortname_en: "",
    program_shortname_th: "",
  });
  const [editProgram, setEditProgram] = useState(null);
  const [editFormData, setEditFormData] = useState({
    program_name: "",
    program_name_th: "",
    program_shortname_en: "",
    program_shortname_th: "",
    year: "",
  });
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("all");
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState("all");
  const [facultys, setFacultys] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("all");
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [activeTab, setActiveTab] = useState(0);
  const { t, i18n } = useTranslation();

  // PLO Management states
  const [programs, setPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [plos, setPlos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [scores, setScores] = useState({});
  const [weights, setWeights] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPreviousYear, setSelectedPreviousYear] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [newPlo, setNewPlo] = useState({
    PLO_code: "",
    PLO_name: "",
    PLO_engname: "",
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedPlo, setSelectedPlo] = useState(null);
  const [editingScores, setEditingScores] = useState(false);
  const [excelData, setExcelData] = useState(null);
  const [typeError, setTypeError] = useState(null);
  const [allFiltersSelected, setAllFiltersSelected] = useState(false);
  const [showLoadPreviousPLOModal, setShowLoadPreviousPLOModal] = useState(false);
  const [previousYearPLOs, setPreviousYearPLOs] = useState([]);
  const [showPasteArea, setShowPasteArea] = useState(false);


  // Fetch universities when the component loads
  useEffect(() => {
    axios
      .get("/university")
      .then((response) => setUniversities(response.data))
      .catch((error) => {
        console.error("Error fetching universities:", error);
        showAlert("ไม่สามารถโหลดรายชื่อมหาวิทยาลัยได้", "danger");
      });
  }, []);

  // Fetch facultys when university changes
  useEffect(() => {
    if (!selectedUniversity || selectedUniversity === "all") {
      setFacultys([]);
      setSelectedFaculty("all");
      return;
    }

    axios
      .get(`/faculty?university_id=${selectedUniversity}`)
      .then((response) => {
        const facultyData = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setFacultys(facultyData);

        if (
          facultyData.length > 0 &&
          !facultyData.some((f) => f.faculty_id.toString() === selectedFaculty)
        ) {
          setSelectedFaculty("all");
        }
      })
      .catch((error) => {
        console.error("Error fetching facultys:", error);
        showAlert("ไม่สามารถโหลดคณะได้", "danger");
        setFacultys([]);
        setSelectedFaculty("all");
      });
  }, [selectedUniversity]);

  // แก้ไข useEffect ที่ทำงานเมื่อ selectedFaculty เปลี่ยน
  useEffect(() => {
    if (!selectedFaculty || selectedFaculty === "all") {
      setProgram([]);
      setFilteredProgram([]);
      setYears([]);
      setSelectedYear("all");
      setSelectedProgram("all"); // ยังคงต้องรีเซ็ต program เมื่อเปลี่ยน faculty เป็น "all"
      return;
    }

    axios
      .get(`/program?faculty_id=${selectedFaculty}`)
      .then((response) => {
        const programData = Array.isArray(response.data)
          ? response.data
          : [response.data];

        setProgram(programData);
        setFilteredProgram(programData);

        // ลบการรีเซ็ต selectedProgram ออก เพื่อรักษาโปรแกรมที่เลือกไว้
        // ไม่ต้องเซ็ต setSelectedProgram("all") ที่นี่

        // Extract unique years from all programs in this faculty
        const uniqueYears = [
          ...new Set(
            programData.map((p) => p.year).filter((year) => year != null)
          ),
        ];
        setYears(uniqueYears.sort((a, b) => a - b));

        // ไม่ต้องรีเซ็ตปีที่เลือกเมื่อเปลี่ยน faculty
        // แต่ถ้าปีที่เลือกอยู่ไม่มีในรายการปีใหม่ ให้รีเซ็ต
        if (selectedYear !== "all" && !uniqueYears.includes(parseInt(selectedYear))) {
          console.log(`ปีที่เลือกอยู่ ${selectedYear} ไม่มีในรายการปีของคณะนี้ จึงรีเซ็ตปี`);
          setSelectedYear("all");
        }
      })
      .catch((error) => {
        console.error("Error fetching programs:", error);
        showAlert("ไม่สามารถโหลดหลักสูตรได้", "danger");
        setProgram([]);
        setFilteredProgram([]);
        setYears([]);
        setSelectedYear("all");
        setSelectedProgram("all"); // กรณีเกิดข้อผิดพลาด จำเป็นต้องรีเซ็ตทั้งหมด
      });
  }, [selectedFaculty]);




  // Filter programs based on year
  useEffect(() => {
    if (selectedYear === "all") {
      // If "All Years" is selected but a program is filtered
      if (selectedProgram !== "all") {
        const programFiltered = program.filter(
          (p) => p.program_id === parseInt(selectedProgram)
        );
        setFilteredProgram(programFiltered);
      } else {
        // Show all programs in the selected faculty
        setFilteredProgram(program);
      }
      return;
    }

    // Filter by year
    let filteredData = program;

    // First filter by program if a specific program is selected
    if (selectedProgram !== "all") {
      filteredData = filteredData.filter(
        (p) => p.program_id === parseInt(selectedProgram)
      );
    }

    // Then filter by year
    filteredData = filteredData.filter(
      (p) => p.year === parseInt(selectedYear)
    );
    setFilteredProgram(filteredData);
  }, [selectedYear, program, selectedProgram]);

  // Auto-hide alerts after 3 seconds
  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert({ ...alert, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Show alert message
  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
  };

  // Handle input change for new program form
  const handleNewProgramChange = (e) => {
    const { name, value } = e.target;
    setNewProgram({
      ...newProgram,
      [name]: value,
    });
  };

  // Handle input change for edit program form
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };



  // ลบ useEffect ที่ซ้ำซ้อนออก และเหลือเพียงตัวเดียวที่ทำหน้าที่จัดการการกรองทั้งตาม program และ year
  useEffect(() => {
    // กรณีที่ไม่ได้เลือกปี (all years)
    if (selectedYear === "all") {
      if (selectedProgram !== "all") {
        // ถ้าเลือกโปรแกรมแต่ไม่เลือกปี
        const selectedProgramObject = program.find(p => p.program_id === parseInt(selectedProgram));

        if (selectedProgramObject) {
          // กรองทุกโปรแกรมที่มีชื่อเดียวกันในทุกปี
          const programFiltered = program.filter(
            (p) => p.program_name === selectedProgramObject.program_name &&
              p.program_name_th === selectedProgramObject.program_name_th
          );
          setFilteredProgram(programFiltered);
        } else {
          setFilteredProgram([]);
        }
      } else {
        // ไม่เลือกทั้งโปรแกรมและปี แสดงทั้งหมด
        setFilteredProgram(program);
      }
      return;
    }

    // กรณีที่เลือกปี
    let filteredData = program;

    // กรองตาม year ก่อน (ทำก่อนเพราะส่วนใหญ่ year จะกรองได้เยอะกว่า)
    filteredData = filteredData.filter(p => p.year === parseInt(selectedYear));

    // ถ้ามีการเลือกโปรแกรม
    if (selectedProgram !== "all") {
      const selectedProgramObject = program.find(p => p.program_id === parseInt(selectedProgram));

      if (selectedProgramObject) {
        // กรองตามชื่อโปรแกรมเพื่อแสดงโปรแกรมที่มีชื่อเหมือนกันในปีที่เลือก
        filteredData = filteredData.filter(
          (p) => p.program_name === selectedProgramObject.program_name &&
            p.program_name_th === selectedProgramObject.program_name_th
        );
      } else {
        // กรณีหาโปรแกรมที่เลือกไม่เจอ
        filteredData = [];
      }
    }

    setFilteredProgram(filteredData);
  }, [selectedYear, program, selectedProgram]);



  // Function to add a new program with all fields
  const handleAddProgram = () => {
    if (!newProgram.program_name || newProgram.program_name.trim() === "") {
      showAlert("กรุณากรอกชื่อหลักสูตร", "warning");
      return;
    }

    if (!selectedFaculty || selectedFaculty === "all") {
      showAlert("กรุณาเลือกคณะ", "warning");
      return;
    }

    // Validate year input
    if (!newProgram.year) {
      showAlert("กรุณากรอกปีของหลักสูตร", "warning");
      return;
    }

    const yearValue = parseInt(newProgram.year, 10);
    if (isNaN(yearValue) || yearValue < 1900 || yearValue > 2100) {
      showAlert("ปีของหลักสูตรต้องเป็นตัวเลขระหว่าง 1900-2100", "warning");
      return;
    }

    const programPayload = {
      program_name: newProgram.program_name,
      program_name_th: newProgram.program_name_th || "",
      program_shortname_en: newProgram.program_shortname_en || "",
      program_shortname_th: newProgram.program_shortname_th || "",
      year: yearValue,
    };

    console.log("Payload being sent:", programPayload);

    axios
      .post("/program", programPayload)
      .then((response) => {
        console.log("✅ Program added successfully!", response.data);

        // Extract program_id from the response
        const newProgramId = response.data.program_id;

        if (!newProgramId) {
          throw new Error("❌ program_id is missing from response");
        }

        console.log("🔹 Sending data to /program_faculty:", {
          program_id: newProgramId,
          faculty_id: selectedFaculty,
        });

        return axios
          .post("/program_faculty", {
            program_id: newProgramId,
            faculty_id: selectedFaculty,
          })
          .then(() => newProgramId); // Pass the program_id to the next .then()
      })
      .then((newProgramId) => {
        console.log("✅ Program added to program_faculty successfully!");

        // Create a new program item to add to the filtered list
        const newProgramItem = {
          program_id: newProgramId,
          program_name: newProgram.program_name,
          program_name_th: newProgram.program_name_th || "",
          program_shortname_en: newProgram.program_shortname_en || "",
          program_shortname_th: newProgram.program_shortname_th || "",
          year: yearValue,
        };

        // Update the filtered program list
        setFilteredProgram([...filteredProgram, newProgramItem]);
        setProgram([...program, newProgramItem]);

        // Reset the new program form
        setNewProgram({
          program_name: "",
          program_name_th: "",
          program_shortname_en: "",
          program_shortname_th: "",
          year: "",
        });

        showAlert("เพิ่มหลักสูตรเรียบร้อยแล้ว", "success");
      })
      .catch((error) => {
        console.error(
          "❌ Error adding program:",
          error.response?.data || error
        );

        // Detailed error handling
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const errorMessage = error.response.data.errors
            ? error.response.data.errors.join(", ")
            : error.response.data.message || "เกิดข้อผิดพลาดในการเพิ่มหลักสูตร";

          showAlert(errorMessage, "danger");
        } else if (error.request) {
          // The request was made but no response was received
          showAlert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้", "danger");
        } else {
          // Something happened in setting up the request that triggered an Error
          showAlert("เกิดข้อผิดพลาดในการส่งข้อมูล", "danger");
        }
      });
  };

  // Function to edit an existing program with all required fields
  const handleEditProgram = () => {
    if (!editProgram) return;

    // Check if all required fields are provided
    if (
      !editFormData.program_name ||
      !editFormData.program_name_th ||
      !editFormData.year ||
      !editFormData.program_shortname_en ||
      !editFormData.program_shortname_th
    ) {
      showAlert("กรุณากรอกข้อมูลให้ครบทุกช่อง", "warning");
      return;
    }

    // Validate year input
    const yearValue = parseInt(editFormData.year, 10);
    if (isNaN(yearValue) || yearValue < 1900 || yearValue > 2100) {
      showAlert("ปีของหลักสูตรต้องเป็นตัวเลขระหว่าง 1900-2100", "warning");
      return;
    }

    axios
      .put(`/program/${editProgram.program_id}`, {
        program_name: editFormData.program_name,
        program_name_th: editFormData.program_name_th,
        year: yearValue,
        program_shortname_en: editFormData.program_shortname_en,
        program_shortname_th: editFormData.program_shortname_th,
      })
      .then(() => {
        const updatedProgram = program.map((p) =>
          p.program_id === editProgram.program_id
            ? {
              ...p,
              program_name: editFormData.program_name,
              program_name_th: editFormData.program_name_th,
              year: yearValue,
              program_shortname_en: editFormData.program_shortname_en,
              program_shortname_th: editFormData.program_shortname_th,
            }
            : p
        );
        setProgram(updatedProgram);

        // Also update the filtered list
        const updatedFiltered = filteredProgram.map((p) =>
          p.program_id === editProgram.program_id
            ? {
              ...p,
              program_name: editFormData.program_name,
              program_name_th: editFormData.program_name_th,
              year: yearValue,
              program_shortname_en: editFormData.program_shortname_en,
              program_shortname_th: editFormData.program_shortname_th,
            }
            : p
        );
        setFilteredProgram(updatedFiltered);

        // Reset edit state
        setEditProgram(null);
        setEditFormData({
          program_name: "",
          program_name_th: "",
          program_shortname_en: "",
          program_shortname_th: "",
          year: "",
        });

        // Show success alert
        showAlert("แก้ไขหลักสูตรเรียบร้อยแล้ว", "success");
      })
      .catch((error) => {
        console.error("Error editing program:", error);
        showAlert("เกิดข้อผิดพลาดในการแก้ไขหลักสูตร", "danger");
      });
  };

  // Function to delete a program
  const handleDeleteProgram = (program_id) => {
    // Confirm before deleting
    if (!window.confirm("คุณต้องการลบหลักสูตรนี้ใช่หรือไม่?")) {
      return;
    }

    axios
      .delete(`/program/${program_id}`)
      .then(() => {
        const updatedProgram = program.filter(
          (p) => p.program_id !== program_id
        );
        setProgram(updatedProgram);

        // Also update the filtered list
        const updatedFiltered = filteredProgram.filter(
          (p) => p.program_id !== program_id
        );
        setFilteredProgram(updatedFiltered);

        // Show success alert
        showAlert("ลบหลักสูตรเรียบร้อยแล้ว", "success");
      })
      .catch((error) => {
        console.error("Error deleting program:", error);
        showAlert("เกิดข้อผิดพลาดในการลบหลักสูตร", "danger");
      });
  };

  // Handler for university selection change
  const handleUniversityChange = (e) => {
    setSelectedUniversity(e.target.value);
  };

  // Handler for faculty selection change
  const handleFacultyChange = (e) => {
    setSelectedFaculty(e.target.value);
  };

  const getVisiblePrograms = () => {
    if (selectedYear !== "all") {
      return filteredPrograms.filter(
        (p) => p.year && p.year.toString() === selectedYear
      );
    }
    return filteredPrograms;
  };

  const handleYearChange = (e) => {
    const newYear = e.target.value;

    // เก็บค่า selectedProgram และข้อมูลโปรแกรมไว้ก่อนเปลี่ยนปี
    const currentProgramId = selectedProgram;
    const currentProgramObj = program.find(p => p.program_id === parseInt(currentProgramId));

    // ล้างข้อมูลอื่นๆ แต่ยังไม่เปลี่ยน selectedProgram
    setPlos([]);
    setCourses([]);
    setWeights({});
    setScores({});
    setEditingScores(false);
    setSelectedYear(newYear);
    setShowLoadPreviousPLOModal(false);

    console.log(`Year changed to: ${newYear}, current program ID: ${currentProgramId}`);

    // เมื่อเลือกปีแล้ว และมีการเลือกโปรแกรมไว้แล้ว (ไม่ใช่ "all")
    if (newYear !== "all" && currentProgramId !== "all" && currentProgramObj) {
      // เก็บชื่อโปรแกรมปัจจุบันไว้
      const currentProgramName = currentProgramObj.program_name;
      const currentProgramNameTh = currentProgramObj.program_name_th;

      console.log(`Current program: ${currentProgramName} (${currentProgramNameTh})`);

      // ค้นหาโปรแกรมที่มีชื่อเหมือนกันในปีที่เลือก
      const matchingProgram = program.find(p =>
        p.program_name === currentProgramName &&
        p.program_name_th === currentProgramNameTh &&
        p.year === parseInt(newYear)
      );

      if (matchingProgram) {
        // พบโปรแกรมที่ชื่อเดียวกันในปีที่เลือก
        console.log(`พบโปรแกรม "${currentProgramName}" ในปี ${newYear}: ID=${matchingProgram.program_id}`);

        // อัพเดตเฉพาะ ID โดยที่ dropdown ในหน้าบ้านยังแสดงชื่อโปรแกรมเดิม
        setSelectedProgram(matchingProgram.program_id.toString());
      } else {
        // ไม่พบโปรแกรมชื่อเดียวกันในปีที่เลือก
        console.log(`ไม่พบโปรแกรม "${currentProgramName}" ในปี ${newYear}`);

        // แจ้งเตือนให้ผู้ใช้ทราบ
        alert(`ไม่พบโปรแกรม "${currentProgramName}" ในปีการศึกษา ${newYear}`);

        // กรณีนี้ให้แสดง "All Programs" ในหน้าบ้าน
        setSelectedProgram("all");
      }
    }
  };



  const handleTabClick = (tabIndex) => {
    setActiveTab(tabIndex);
    setShowLoadPreviousPLOModal(false); // ปิด modal เมื่อเปลี่ยนแท็บ
  };


  // ******************** PLO Management Functions ********************

  // Check if all filters are selected for PLO tab
  useEffect(() => {
    // Check if all necessary data is selected
    if (
      selectedUniversity &&
      selectedUniversity !== "all" &&
      selectedFaculty &&
      selectedFaculty !== "all" &&
      selectedYear &&
      selectedYear !== "all" &&
      selectedProgram &&
      selectedProgram !== "all"
    ) {
      setAllFiltersSelected(true);
    } else {
      setAllFiltersSelected(false);
      // Reset PLO and course data if filters are incomplete
      if (!allFiltersSelected) {
        setPlos([]);
        setCourses([]);
        setWeights({});
      }
    }
  }, [selectedUniversity, selectedFaculty, selectedYear, selectedProgram]);

  useEffect(() => {
    if (allFiltersSelected && selectedProgram && selectedProgram !== "all" && selectedYear && selectedYear !== "all") {
      // ค้นหาโปรแกรมที่เลือกอยู่ในปัจจุบัน
      let selectedProgramObj = program.find(p => p.program_id === parseInt(selectedProgram));

      // ตรวจสอบว่าโปรแกรมที่เลือกนั้นตรงกับปีที่เลือกหรือไม่
      if (selectedProgramObj && selectedProgramObj.year !== parseInt(selectedYear)) {
        // ถ้าไม่ตรงกัน ค้นหาโปรแกรมที่มีชื่อเดียวกันและอยู่ในปีที่เลือก
        const matchingProgram = program.find(p =>
          p.program_name === selectedProgramObj.program_name &&
          p.program_name_th === selectedProgramObj.program_name_th &&
          p.year === parseInt(selectedYear)
        );

        if (matchingProgram) {
          // พบโปรแกรมที่ตรงกับปีที่เลือก
          console.log(`พบโปรแกรม ${selectedProgramObj.program_name} ในปี ${selectedYear}: ID=${matchingProgram.program_id}`);
          // อัพเดตตัวแปร selectedProgramObj สำหรับใช้ดึงข้อมูล
          selectedProgramObj = matchingProgram;
          // อัพเดต selectedProgram เป็น ID ที่ถูกต้องสำหรับปีที่เลือก โดยที่ dropdown ยังแสดงชื่อเดิม
          setSelectedProgram(matchingProgram.program_id.toString());
        } else {
          // ไม่พบโปรแกรมที่ตรงกับปีที่เลือก
          console.log(`ไม่พบโปรแกรม ${selectedProgramObj.program_name} ในปี ${selectedYear}`);
          // ยังคงใช้ค่า selectedProgram เดิม ไม่รีเซ็ต เพื่อให้ dropdown ยังแสดงโปรแกรมที่เลือก
          // แต่จะไม่ดึงข้อมูล
          return; // ไม่ดำเนินการต่อ
        }
      }

      if (selectedProgramObj) {
        // ดึงข้อมูล PLO โดยใช้ program_id ที่ถูกต้อง
        fetch(`http://localhost:8000/program_plo?program_id=${selectedProgramObj.program_id}`)
          .then((response) => response.json())
          .then((data) => {
            console.log("PLO data:", data);

            if (data.success && data.message && data.message.length > 0) {
              setPlos(data.message);
            } else if (Array.isArray(data) && data.length > 0) {
              setPlos(data);
            } else {
              setPlos([]);
            }
          })
          .catch(error => console.error("Error fetching PLOs:", error));

        // ดึงข้อมูลรายวิชา
        console.log(`Fetching courses for program ID: ${selectedProgramObj.program_id}, year: ${selectedYear}`);

        fetch(`http://localhost:8000/course?program_id=${selectedProgramObj.program_id}&year=${selectedYear}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            console.log("Course data:", data);

            if (Array.isArray(data)) {
              setCourses(data);
            } else if (data.success && Array.isArray(data.message)) {
              setCourses(data.message);
            } else if (data.success && data.message) {
              setCourses([data.message]);
            } else {
              setCourses([]);
            }
          })
          .catch(error => {
            console.error("Error fetching courses:", error);
            setCourses([]);
          });

        // ดึงข้อมูล mapping weight
        fetch(`http://localhost:8000/course_plo?program_id=${selectedProgramObj.program_id}&year=${selectedYear}`)
          .then((response) => response.json())
          .then((data) => {
            console.log("Mapping data:", data);

            const weightsData = {};

            if (data.success && Array.isArray(data.message)) {
              data.message.forEach(item => {
                const key = `${item.course_id}-${item.plo_id}`;
                weightsData[key] = item.weight;
              });
            } else if (Array.isArray(data)) {
              data.forEach(item => {
                const key = `${item.course_id}-${item.plo_id}`;
                weightsData[key] = item.weight;
              });
            } else if (data.success && data.message) {
              const key = `${data.message.course_id}-${data.message.plo_id}`;
              weightsData[key] = data.message.weight;
            }

            setWeights(weightsData);
          })
          .catch(error => console.error("Error fetching weights:", error));
      }
    }
  }, [allFiltersSelected, selectedProgram, selectedYear, program]);

  // Handle deleting a PLO
  const handleDeletePlo = (ploId) => {
    if (window.confirm("Are you sure you want to delete this PLO?")) {
      fetch(
        `http://localhost:8000/program_plo?program_id=${selectedProgram}&plo_id=${ploId}`,
        {
          method: "DELETE",
        }
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setPlos(plos.filter((plo) => plo.plo_id !== ploId));
            alert("PLO deleted successfully");
          } else {
            alert("Error deleting PLO: " + data.message);
          }
        })
        .catch((error) => {
          console.error("Error deleting PLO:", error);
          alert("An error occurred while deleting the PLO");
        });
    }
  };

  // Handle input change for scores
  const handleInputChange = (courseId, ploId, value) => {
    if (editingScores) {
      const updatedScores = { ...scores };
      updatedScores[`${courseId}-${ploId}`] = value ? parseInt(value) : 0;
      setScores(updatedScores);
    }
  };

  // Calculate total for a course
  const calculateTotal = (courseId) => {
    // ถ้าไม่มีข้อมูล PLO หรือ weights ให้คืนค่า 0
    if (!plos || plos.length === 0) return 0;

    return plos.reduce((sum, plo) => {
      const key = `${courseId}-${plo.plo_id}`;
      if (editingScores) {
        return sum + (parseInt(scores[key]) || 0); // ใช้ scores ถ้าอยู่ในโหมดแก้ไข
      } else {
        return sum + (parseInt(weights[key]) || 0); // ใช้ weights ถ้าไม่ได้อยู่ในโหมดแก้ไข
      }
    }, 0);
  };

  // Toggle edit mode for scores
  const handleEditToggle = () => {
    setEditingScores(!editingScores);
  };

  // Submit new scores to the server


  const refreshDataFromServer = async () => {
    try {
      if (!selectedProgram || selectedProgram === "all" || !selectedYear) return false;

      // ค้นหาโปรแกรมที่มี program_id ตรงกับที่เลือก
      let selectedProgramObj = program.find(p => p.program_id === parseInt(selectedProgram));

      // ตรวจสอบว่าโปรแกรมที่เลือกนั้นตรงกับปีที่เลือกหรือไม่
      if (selectedProgramObj && selectedProgramObj.year !== parseInt(selectedYear)) {
        // ถ้าไม่ตรงกัน ค้นหาโปรแกรมที่มีชื่อเดียวกันและอยู่ในปีที่เลือก
        const matchingProgram = program.find(p =>
          p.program_name === selectedProgramObj.program_name &&
          p.program_name_th === selectedProgramObj.program_name_th &&
          p.year === parseInt(selectedYear)
        );

        if (matchingProgram) {
          // พบโปรแกรมที่ตรงกับปีที่เลือก
          console.log(`พบโปรแกรม ${selectedProgramObj.program_name} ในปี ${selectedYear}: ID=${matchingProgram.program_id}`);
          // อัพเดตตัวแปร selectedProgramObj สำหรับใช้ดึงข้อมูล
          selectedProgramObj = matchingProgram;
          // อัพเดต selectedProgram เป็น ID ที่ถูกต้องสำหรับปีที่เลือก โดยไม่มีผลกับการแสดงผลใน dropdown
          setSelectedProgram(matchingProgram.program_id.toString());
        } else {
          // ไม่พบโปรแกรมที่ตรงกับปีที่เลือก
          console.log(`ไม่พบโปรแกรม ${selectedProgramObj.program_name} ในปี ${selectedYear}`);
          // แจ้งเตือนให้ผู้ใช้ทราบแต่ไม่เปลี่ยนแปลงค่าที่แสดงใน dropdown
          return false; // ไม่ดำเนินการต่อ
        }
      }

      if (!selectedProgramObj) return false;

      // 1. รีเฟรช PLO data
      const ploResponse = await fetch(`http://localhost:8000/program_plo?program_id=${selectedProgramObj.program_id}`);
      const ploData = await ploResponse.json();

      console.log("Refreshed PLO data:", ploData);

      if (ploData.success && ploData.message && ploData.message.length > 0) {
        setPlos(ploData.message);
      } else if (Array.isArray(ploData) && ploData.length > 0) {
        setPlos(ploData);
      } else {
        setPlos([]);
      }

      // 2. รีเฟรช Course data
      const courseResponse = await fetch(`http://localhost:8000/course?program_id=${selectedProgramObj.program_id}&year=${selectedYear}`);

      if (!courseResponse.ok) {
        throw new Error(`HTTP error! status: ${courseResponse.status}`);
      }

      const courseData = await courseResponse.json();
      console.log("Refreshed Course data:", courseData);

      if (Array.isArray(courseData)) {
        setCourses(courseData);
      } else if (courseData.success && Array.isArray(courseData.message)) {
        setCourses(courseData.message);
      } else if (courseData.success && courseData.message) {
        setCourses([courseData.message]);
      } else {
        setCourses([]);
      }

      // 3. รีเฟรช weights data
      const mappingResponse = await fetch(`http://localhost:8000/course_plo?program_id=${selectedProgramObj.program_id}&year=${selectedYear}`);
      const mappingData = await mappingResponse.json();

      console.log("Refreshed mapping data:", mappingData);
      const weightsData = {};

      if (mappingData.success && Array.isArray(mappingData.message)) {
        mappingData.message.forEach(item => {
          const key = `${item.course_id}-${item.plo_id}`;
          weightsData[key] = item.weight;
        });
      } else if (Array.isArray(mappingData)) {
        mappingData.forEach(item => {
          const key = `${item.course_id}-${item.plo_id}`;
          weightsData[key] = item.weight;
        });
      } else if (mappingData.success && mappingData.message) {
        const key = `${mappingData.message.course_id}-${mappingData.message.plo_id}`;
        weightsData[key] = mappingData.message.weight;
      }

      // รอให้การอัพเดต state เสร็จสิ้น
      await new Promise(resolve => {
        setWeights(weightsData);
        setTimeout(resolve, 100);
      });

      console.log("Data refresh completed successfully");
      return true;
    } catch (error) {
      console.error("Error in refreshDataFromServer:", error);
      return false;
    }
  };
  const handleMergePLOs = () => {
    if (!previousYearPLOs || previousYearPLOs.length === 0) {
      alert("ไม่มีข้อมูล PLO จากปีก่อนหน้าที่จะทำการรวม");
      return;
    }

    if (!selectedProgram || selectedProgram === "all") {
      alert("กรุณาเลือกโปรแกรมปัจจุบันที่ต้องการรวม PLO");
      return;
    }

    const confirmation = window.confirm(`คุณต้องการรวม ${previousYearPLOs.length} PLO จากปีก่อนหน้าเข้ากับโปรแกรมปัจจุบันใช่หรือไม่?`);
    if (!confirmation) return;

    console.log("เริ่มการรวม PLO จากปีก่อนหน้า...");
    console.log("ข้อมูล PLO ที่จะรวม:", previousYearPLOs);

    // สร้าง requests สำหรับการเพิ่ม PLO แต่ละรายการ
    const ploPatchRequests = previousYearPLOs.map((plo) => {
      // เตรียมข้อมูลสำหรับสร้าง PLO ใหม่
      const newPloData = {
        PLO_name: plo.PLO_name,
        PLO_engname: plo.PLO_engname,
        PLO_code: plo.PLO_code,
        program_id: parseInt(selectedProgram),
        year: parseInt(selectedYear) // เพิ่มปีที่เลือกปัจจุบัน
      };

      console.log("กำลังสร้าง PLO:", newPloData);

      // ส่งคำขอไปยัง API
      return axios.post("/plo", newPloData)
        .catch(error => {
          console.error(`เกิดข้อผิดพลาดในการเพิ่ม PLO ${plo.PLO_code}:`, error);
          return { data: { success: false, error: error.message } };
        });
    });

    // ดำเนินการเพิ่ม PLOs ทั้งหมดพร้อมกัน
    Promise.all(ploPatchRequests)
      .then((responses) => {
        // กรองเฉพาะที่สำเร็จ
        const successfulAdds = responses.filter((response) =>
          response.data && response.data.success);

        console.log(`เพิ่ม PLO สำเร็จ ${successfulAdds.length} รายการ จากทั้งหมด ${ploPatchRequests.length} รายการ`);

        if (successfulAdds.length === 0) {
          alert("ไม่สามารถเพิ่ม PLO ได้ กรุณาตรวจสอบ console สำหรับรายละเอียดข้อผิดพลาด");
        } else {
          alert(`เพิ่ม PLO สำเร็จ ${successfulAdds.length} รายการ จากทั้งหมด ${ploPatchRequests.length} รายการ`);
        }

        // ปิด modal
        setShowLoadPreviousPLOModal(false);

        // รีเฟรชข้อมูล PLO
        return refreshDataFromServer();
      })
      .then((refreshSuccess) => {
        if (refreshSuccess) {
          console.log("รีเฟรชข้อมูลสำเร็จหลังจากการรวม PLO");
        } else {
          console.warn("ไม่สามารถรีเฟรชข้อมูลหลังการรวม PLO อัตโนมัติ กรุณารีเฟรชหน้าจอ");
        }
      })
      .catch((error) => {
        console.error("เกิดข้อผิดพลาดในการรวม PLOs:", error);
        alert("เกิดข้อผิดพลาดในการรวม PLOs: " + error.message);
      });
  };

  // ปรับปรุงฟังก์ชัน handlePatchScores
  const handlePatchScores = async () => {
    if (Object.keys(scores).length === 0) {
      alert("ไม่มีการเปลี่ยนแปลงข้อมูล");
      return;
    }

    // เพิ่มการยืนยันก่อนอัพเดตข้อมูล
    const confirmMessage = "คุณต้องการบันทึกการเปลี่ยนแปลงใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้";
    if (!window.confirm(confirmMessage)) {
      return; // ยกเลิกการดำเนินการหากผู้ใช้เลือก Cancel
    }

    const updatedScores = Object.keys(scores).map((key) => {
      const [course_id, plo_id] = key.split("-");
      return {
        program_id: parseInt(selectedProgram, 10),
        course_id: parseInt(course_id, 10),
        plo_id: parseInt(plo_id, 10),
        weight: parseFloat(scores[key]) || 0,
        year: parseInt(selectedYear, 10)
      };
    });

    try {
      // ใช้ Promise.all เพื่อส่ง PATCH requests ทั้งหมดในคราวเดียว
      await Promise.all(
        updatedScores.map((score) =>
          fetch("http://localhost:8000/course_plo", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(score),
          })
            .then((response) => {
              if (!response.ok) {
                return response.json().then((data) => {
                  throw new Error(data.message || "Failed to update score");
                });
              }
              return response.json();
            })
        )
      );

      alert("อัปเดตข้อมูลทั้งหมดเรียบร้อยแล้ว!");

      // รอให้การรีเฟรชข้อมูลทำงานเสร็จสิ้น
      const refreshSuccess = await refreshDataFromServer();

      if (refreshSuccess) {
        console.log("Data refreshed successfully after patch");
      } else {
        console.warn("Failed to refresh data, manual refresh may be needed");
        // ถ้าการรีเฟรชไม่สำเร็จให้ล้างข้อมูลเดิมเพื่อเตรียมการรีเฟรชแบบ F5
        setScores({});
        setEditingScores(false);
      }
    } catch (error) {
      console.error("Error during batch update:", error.message);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handlePostScores = async () => {
    if (!selectedProgram || selectedProgram === "all" || !selectedYear) {
      alert("กรุณาเลือกโปรแกรมและปีการศึกษาก่อนบันทึกข้อมูล");
      return;
    }
  
    if (Object.keys(scores).length === 0) {
      alert("ไม่มีข้อมูลคะแนนที่จะบันทึก กรุณาป้อนข้อมูลก่อน");
      return;
    }
  
    // เพิ่มการยืนยันก่อนบันทึกข้อมูลใหม่
    const confirmMessage = "คุณต้องการบันทึกข้อมูลคะแนนใหม่ใช่หรือไม่? การดำเนินการนี้อาจส่งผลกระทบต่อข้อมูลเดิม";
    if (!window.confirm(confirmMessage)) {
      return; // ยกเลิกการดำเนินการหากผู้ใช้เลือก Cancel
    }
  
    // ตรวจสอบว่ามีค่า 0 ใน scores หรือไม่
    for (const key in scores) {
      if (scores[key] === 0 || scores[key] === "0") {
        console.log(`พบค่า 0 ที่ key: ${key}`);
      }
    }
  
    // แปลง scores object ให้เป็น array ตามรูปแบบที่ต้องการ
    const scoresArray = Object.keys(scores).map((key) => {
      const [course_id, plo_id] = key.split("-");
      // ตรวจสอบค่าและแปลงเป็นตัวเลข - ถ้าเป็น 0 ให้ส่งเป็น 0 ไม่ใช่ null
      const weightValue = scores[key] !== undefined && scores[key] !== "" 
        ? parseFloat(scores[key]) 
        : 0;
      
      return {
        course_id: parseInt(course_id, 10),
        plo_id: parseInt(plo_id, 10),
        weight: weightValue, // ใช้ค่าที่แปลงแล้ว ไม่ใช้ || 0 ซึ่งจะทำให้ค่า 0 กลายเป็น 0
        year: parseInt(selectedYear, 10)
      };
    });
  
    // แสดง log เพื่อดู data ที่จะส่ง
    console.log("Data to submit:", {
      program_id: parseInt(selectedProgram, 10),
      scores: scoresArray,
      year: parseInt(selectedYear, 10)
    });
  
    try {
      // เรียก API POST เพื่อส่งข้อมูล
      const response = await fetch("http://localhost:8000/course_plo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program_id: parseInt(selectedProgram, 10),
          scores: scoresArray,
          year: parseInt(selectedYear, 10)
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit scores.");
      }
  
      const data = await response.json();
  
      if (data.success) {
        alert("บันทึกข้อมูลสำเร็จ!");
  
        // รอให้การรีเฟรชข้อมูลทำงานเสร็จสิ้น
        const refreshSuccess = await refreshDataFromServer();
  
        if (refreshSuccess) {
          console.log("Data refreshed successfully after post");
        } else {
          console.warn("Failed to refresh data, manual refresh may be needed");
          // ถ้าการรีเฟรชไม่สำเร็จให้ล้างข้อมูลเดิมเพื่อเตรียมการรีเฟรชแบบ F5
          setScores({});
          setEditingScores(false);
        }
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.message}`);
      }
    } catch (error) {
      console.error("Error posting scores:", error.message);
      alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message}`);
    }
  };

  // Handle file upload for Excel
  // แก้ไขส่วนดาวน์โหลดไฟล์
  const handleFileUpload = (e) => {
    let fileTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    let selectedFile = e.target.files[0];

    // รีเซ็ตค่าของอินพุตไฟล์เพื่อให้สามารถเลือกไฟล์เดิมซ้ำได้
    e.target.value = '';

    if (selectedFile) {
      if (fileTypes.includes(selectedFile.type)) {
        setTypeError(null);
        let reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = event.target.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            // เพิ่ม program_id ที่ผู้ใช้เลือกเข้าไปในแต่ละแถว
            const updatedData = jsonData.map((row) => ({
              ...row,
              program_id: selectedProgram, // เพิ่ม program_id ที่เลือกจาก UI
            }));

            setExcelData(updatedData); // เก็บข้อมูลจากไฟล์
            console.log(updatedData);
            // The modal will automatically be shown because it's conditionally rendered based on excelData
          } catch (error) {
            console.error("Error reading file:", error);
            alert("Error reading Excel file. Please check the file format.");
          }
        };
        reader.onerror = (error) => {
          console.error("Error reading file:", error);
          alert("Error reading file. Please try again.");
        };
        reader.readAsBinaryString(selectedFile);
      } else {
        setTypeError("Please select only Excel file types");
        setExcelData(null);
      }
    } else {
      console.log("Please select your file");
    }
  };

  const handleUploadButtonClick = () => {
    if (excelData && excelData.length > 0) {
      // ตรวจสอบว่าได้เลือกโปรแกรมแล้วหรือไม่
      if (!selectedProgram || selectedProgram === "all") {
        alert("กรุณาเลือกโปรแกรมก่อนอัปโหลดข้อมูล");
        return;
      }

      // ตรวจสอบว่าได้เลือกปีแล้วหรือไม่
      if (!selectedYear || selectedYear === "all") {
        alert("กรุณาเลือกปีการศึกษาก่อนอัปโหลดข้อมูล");
        return;
      }

      // แสดง confirmation dialog
      if (!window.confirm("คุณต้องการอัปโหลดข้อมูล PLO จำนวน " + excelData.length + " รายการใช่หรือไม่?")) {
        return;
      }

      // เตรียมข้อมูลสำหรับส่งไปยัง API
      const dataToUpload = excelData.map(item => ({
        ...item,
        program_id: selectedProgram,
        year: parseInt(selectedYear) // เพิ่มข้อมูลปีการศึกษา
      }));

      fetch("http://localhost:8000/plo/excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToUpload),
      })
        .then((response) => {
          if (!response.ok) {
            return response.text().then((text) => {
              throw new Error(text);
            });
          }
          return response.json();
        })
        .then((data) => {
          console.log("Success:", data);
          alert("อัปโหลดข้อมูลสำเร็จ!");

          // รีเฟรชข้อมูล PLO หลังจากอัปโหลด โดยเพิ่มพารามิเตอร์ year
          // ค้นหาโปรแกรมที่ตรงกับ ID และปีที่เลือก
          const selectedProgramObj = program.find(p =>
            p.program_id === parseInt(selectedProgram) &&
            p.year === parseInt(selectedYear)
          );

          if (selectedProgramObj) {
            // ดึงข้อมูล PLO ใหม่
            fetch(`http://localhost:8000/program_plo?program_id=${selectedProgramObj.program_id}&year=${selectedYear}`)
              .then((response) => response.json())
              .then((data) => {
                console.log("Refreshed PLO data:", data);
                // ตรวจสอบรูปแบบข้อมูลและกำหนดค่า
                if (data.success && data.message && data.message.length > 0) {
                  setPlos(data.message);
                } else if (Array.isArray(data) && data.length > 0) {
                  setPlos(data);
                } else {
                  setPlos([]);
                }
              })
              .catch(error => {
                console.error("Error refreshing PLO data:", error);
                // อาจจะลองใช้ refreshDataFromServer() ถ้ามีปัญหา
                refreshDataFromServer();
              });
          } else {
            // ถ้าไม่พบโปรแกรมที่ตรงกับเงื่อนไข ให้ลองใช้ฟังก์ชัน refreshDataFromServer
            refreshDataFromServer();
          }

          // ล้างข้อมูลหลังจากอัปโหลดสำเร็จ
          setExcelData(null);
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("เกิดข้อผิดพลาด: " + error.message);
        });
    } else {
      alert("ไม่มีข้อมูลที่จะอัปโหลด กรุณาอัปโหลดไฟล์หรือวางข้อมูลก่อน");
    }
  };

  const handlePasteButtonClick = async () => {
    try {
      // อ่านข้อมูลจาก Clipboard
      const text = await navigator.clipboard.readText();

      // ตรวจสอบว่าข้อมูลมีหรือไม่
      if (!text || text.trim() === '') {
        alert('ไม่พบข้อมูลใน clipboard โปรดคัดลอกข้อมูลก่อนกดปุ่ม Paste Data');
        return;
      }

      // แยกข้อมูลตามบรรทัด
      const rows = text.trim().split(/\r?\n/);

      // ตรวจสอบว่ามีการใช้ tab หรือ comma เป็นตัวคั่น
      let delimiter = '\t'; // ค่าเริ่มต้นคือ tab
      if (rows[0].includes(',') && !rows[0].includes('\t')) {
        delimiter = ',';
      }

      // แปลงข้อมูลเป็น array ของ objects
      const parsedData = rows.map(row => {
        const columns = row.split(delimiter);
        return {
          program_id: selectedProgram,
          PLO_code: columns[0] || '',
          PLO_name: columns[1] || '',
          PLO_engname: columns[2] || ''
        };
      });

      // อัปเดต excelData state
      setExcelData(parsedData);
      console.log("Pasted Data:", parsedData);

      // แสดงข้อความแจ้งเตือนว่าวางข้อมูลสำเร็จ
      alert(`วางข้อมูลสำเร็จ: พบ ${parsedData.length} รายการ`);
    } catch (err) {
      console.error("Failed to paste data:", err);
      alert("ไม่สามารถวางข้อมูลได้ โปรดตรวจสอบว่าได้คัดลอกข้อมูลที่ถูกต้อง");
    }
  };

  const handleAddPlo = () => {
    fetch("http://localhost:8000/plo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        PLO_name: newPlo.PLO_name,
        PLO_engname: newPlo.PLO_engname,
        PLO_code: newPlo.PLO_code,
        program_id: selectedProgram,
        year: parseInt(selectedYear) // เพิ่มการส่งค่าปี
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // อัปเดต PLO ใหม่ใน state และแน่ใจว่ามีข้อมูลปีด้วย
          const newPloWithYear = {
            ...data.newPlo,
            year: parseInt(selectedYear) // เพิ่มข้อมูลปีให้กับ PLO ใหม่
          };
          setPlos([...plos, newPloWithYear]);
          setShowAddModal(false);
          alert("PLO added successfully");
        } else {
          alert("Error adding PLO: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error adding PLO:", error);
        alert("An error occurred while adding the PLO");
      });
  };

  // แก้ไขฟังก์ชัน handleEditPlo
  const handleEditPlo = (plo) => {
    console.log("Editing PLO:", plo); // เพิ่ม log เพื่อตรวจสอบข้อมูล
    setSelectedPlo(plo.plo_id); // เก็บ plo_id เพื่อใช้ในการอัปเดต
    setNewPlo({
      PLO_code: plo.PLO_code,
      PLO_name: plo.PLO_name,
      PLO_engname: plo.PLO_engname,
    });
    setShowEditModal(true);
  };

  const handleDirectPaste = (e) => {
    e.preventDefault();

    // รับข้อมูลจาก clipboard event
    const clipboardData = e.clipboardData || window.clipboardData;
    const text = clipboardData.getData('text');

    if (!text || text.trim() === '') {
      return;
    }

    // แยกข้อมูลตามบรรทัด
    const rows = text.trim().split(/\r?\n/);

    // ตรวจสอบว่ามีการใช้ tab หรือ comma เป็นตัวคั่น
    let delimiter = '\t'; // ค่าเริ่มต้นคือ tab
    if (rows[0].includes(',') && !rows[0].includes('\t')) {
      delimiter = ',';
    }

    // แปลงข้อมูลเป็น array ของ objects
    const parsedData = rows.map(row => {
      const columns = row.split(delimiter);
      return {
        program_id: selectedProgram,
        PLO_code: columns[0] || '',
        PLO_name: columns[1] || '',
        PLO_engname: columns[2] || ''
      };
    });

    // อัปเดต excelData state
    setExcelData(parsedData);
    console.log("Directly Pasted Data:", parsedData);

    // ปิดพื้นที่วางข้อมูล
    setShowPasteArea(false);
  };

  // แก้ไขฟังก์ชัน handleUpdatePlo
  const handleUpdatePlo = () => {
    // ค้นหา PLO โดยใช้ plo_id จาก selectedPlo
    if (!selectedPlo) {
      console.error("No PLO selected");
      alert("No PLO selected for update");
      return;
    }

    // Log ข้อมูลที่จะส่ง
    console.log("Updating PLO with data:", {
      program_id: parseInt(selectedProgram),
      plo_id: parseInt(selectedPlo),
      PLO_name: newPlo.PLO_name,
      PLO_engname: newPlo.PLO_engname,
      PLO_code: newPlo.PLO_code
    });

    // ส่งข้อมูลไปยัง API
    fetch("http://localhost:8000/program_plo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        program_id: parseInt(selectedProgram),
        plo_id: parseInt(selectedPlo),
        PLO_name: newPlo.PLO_name,
        PLO_engname: newPlo.PLO_engname,
        PLO_code: newPlo.PLO_code // ส่ง PLO_code ไปด้วย แต่ API อาจไม่ได้ใช้
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.message || `HTTP error! status: ${response.status}`);
          });
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          // อัปเดตข้อมูลใน state
          const updatedPlos = plos.map((plo) => {
            if (plo.plo_id === selectedPlo) {
              return {
                ...plo,
                PLO_name: newPlo.PLO_name,
                PLO_engname: newPlo.PLO_engname,
                PLO_code: newPlo.PLO_code // อัปเดต PLO_code ในข้อมูลที่แสดง
              };
            }
            return plo;
          });

          setPlos(updatedPlos);
          alert("PLO updated successfully");
          setShowEditModal(false);
        } else {
          console.error("Error updating PLO:", data);
          alert("Error updating PLO: " + (data.message || "Unknown error"));
        }
      })
      .catch((error) => {
        console.error("Error updating PLO:", error);
        alert("An error occurred while updating the PLO: " + error.message);
      });
  };


  const handleProgramChange = (e) => {
    const selectedProgramId = e.target.value;
    console.log(`เลือกโปรแกรม ID: ${selectedProgramId}`);

    // รีเซ็ตค่าเมื่อเลือก All Programs
    if (selectedProgramId === "all") {
      setSelectedProgram("all");
      setSelectedYear("all");
      return;
    }

    // กำหนดค่า selectedProgram ให้เป็น ID ที่เลือก
    setSelectedProgram(selectedProgramId);

    // ล้างข้อมูลอื่นๆ เมื่อเปลี่ยนโปรแกรม
    setPlos([]);
    setCourses([]);
    setWeights({});

    // ถ้ามีการเลือกปีอยู่แล้ว ตรวจสอบว่าโปรแกรมที่เลือกมีในปีนั้นหรือไม่
    if (selectedYear !== "all") {
      const selectedProgramObj = program.find(p => p.program_id === parseInt(selectedProgramId));
      if (selectedProgramObj && selectedProgramObj.year !== parseInt(selectedYear)) {
        console.log(`โปรแกรมที่เลือกมีปี ${selectedProgramObj.year} แต่ปีที่เลือกอยู่คือ ${selectedYear}`);

        // ค้นหาโปรแกรมที่มีชื่อเดียวกันและปีตรงกับที่เลือก
        const matchingProgram = program.find(p =>
          p.program_name === selectedProgramObj.program_name &&
          p.program_name_th === selectedProgramObj.program_name_th &&
          p.year === parseInt(selectedYear)
        );

        if (matchingProgram) {
          // พบโปรแกรมที่ตรงกับปีที่เลือก ให้อัพเดต program_id
          console.log(`พบโปรแกรม ${selectedProgramObj.program_name} ในปี ${selectedYear}: ID=${matchingProgram.program_id}`);
          setSelectedProgram(matchingProgram.program_id.toString());
        } else {
          // ไม่พบโปรแกรมที่ตรงกับปีที่เลือก แจ้งเตือนและให้เปลี่ยนปีเป็นปีของโปรแกรมที่เลือก
          console.log(`ไม่พบโปรแกรม ${selectedProgramObj.program_name} ในปี ${selectedYear}`);
          alert(`โปรแกรม "${selectedProgramObj.program_name}" ไม่มีในปีการศึกษา ${selectedYear} จะเปลี่ยนเป็นปี ${selectedProgramObj.year}`);
          setSelectedYear(selectedProgramObj.year.toString());
        }
      }
    }
  };

  // 4. ปรับปรุง useEffect ที่ตอบสนองต่อ allFiltersSelected
  useEffect(() => {
    if (allFiltersSelected && selectedProgram && selectedProgram !== "all" && selectedYear && selectedYear !== "all") {
      // ค้นหาโปรแกรมที่เลือกอยู่ในปัจจุบัน
      let selectedProgramObj = program.find(p => p.program_id === parseInt(selectedProgram));

      // ตรวจสอบว่าโปรแกรมที่เลือกนั้นตรงกับปีที่เลือกหรือไม่
      if (selectedProgramObj && selectedProgramObj.year !== parseInt(selectedYear)) {
        // ถ้าไม่ตรงกัน ค้นหาโปรแกรมที่มีชื่อเดียวกันและอยู่ในปีที่เลือก
        const matchingProgram = program.find(p =>
          p.program_name === selectedProgramObj.program_name &&
          p.program_name_th === selectedProgramObj.program_name_th &&
          p.year === parseInt(selectedYear)
        );

        if (matchingProgram) {
          // พบโปรแกรมที่ตรงกับปีที่เลือก
          console.log(`พบโปรแกรม ${selectedProgramObj.program_name} ในปี ${selectedYear}: ID=${matchingProgram.program_id}`);
          // อัพเดตตัวแปร selectedProgramObj สำหรับใช้ดึงข้อมูล
          selectedProgramObj = matchingProgram;
          // อัพเดต selectedProgram เป็น ID ที่ถูกต้องสำหรับปีที่เลือก แต่ UI ยังแสดงชื่อเดิม
          setSelectedProgram(matchingProgram.program_id.toString());
        } else {
          // ไม่พบโปรแกรมที่ตรงกับปีที่เลือก
          console.log(`ไม่พบโปรแกรม ${selectedProgramObj.program_name} ในปี ${selectedYear}`);
          return; // ไม่ดำเนินการต่อ
        }
      }

      // ถ้าพบโปรแกรมที่ถูกต้อง ให้ดึงข้อมูล PLO และรายวิชา
      if (selectedProgramObj) {
        // ดึงข้อมูล PLO และข้อมูลอื่นๆ ตามปกติ...
        // ...
      }
    }
  }, [allFiltersSelected, selectedProgram, selectedYear, program]);

  useEffect(() => {
    console.log("Modal state changed:", showLoadPreviousPLOModal);
  }, [showLoadPreviousPLOModal]);

  // เพิ่ม useEffect เพื่อกรองปีตามโปรแกรมที่เลือก
  useEffect(() => {
    if (selectedProgram !== "all") {
      // ถ้ามีการเลือกโปรแกรม (ไม่ใช่ All Programs)
      const selectedProgramObj = program.find(p => p.program_id === parseInt(selectedProgram));

      if (selectedProgramObj) {
        // ค้นหาโปรแกรมที่มีชื่อเหมือนกันในทุกปี
        const sameNamePrograms = program.filter(p =>
          p.program_name === selectedProgramObj.program_name &&
          p.program_name_th === selectedProgramObj.program_name_th
        );

        // ดึงเฉพาะปีที่มีโปรแกรมนี้
        const programYears = sameNamePrograms.map(p => p.year).filter(Boolean);

        // จัดเรียงปีจากน้อยไปมาก
        const sortedYears = [...new Set(programYears)].sort((a, b) => a - b);

        console.log(`โปรแกรม ${selectedProgramObj.program_name} มีอยู่ในปี:`, sortedYears);

        // อัพเดตรายการปีที่มีโปรแกรมนี้
        setYears(sortedYears);

        // ถ้าปีที่เลือกอยู่ไม่อยู่ในรายการ ให้รีเซ็ตเป็นปีแรกของโปรแกรมนี้
        if (selectedYear !== "all" && !sortedYears.includes(parseInt(selectedYear))) {
          console.log(`ปีที่เลือกอยู่ ${selectedYear} ไม่มีในรายการปีของโปรแกรมนี้`);

          if (sortedYears.length > 0) {
            console.log(`เปลี่ยนปีเป็นปีแรกของโปรแกรม: ${sortedYears[0]}`);
            setSelectedYear(sortedYears[0].toString());
          } else {
            console.log('ไม่พบปีที่มีโปรแกรมนี้ จึงเปลี่ยนเป็น "All Years"');
            setSelectedYear("all");
          }
        }
      }
    } else {
      // กรณีเลือก "All Programs" ให้ดึงทุกปีจากฐานข้อมูล
      const allYears = program.map(p => p.year).filter(Boolean);
      const uniqueYears = [...new Set(allYears)].sort((a, b) => a - b);
      setYears(uniqueYears);
    }
  }, [selectedProgram, program]);

  const handleLoadPreviousPLO = () => {
    try {
      // ตรวจสอบว่าได้เลือกฟิลเตอร์ที่จำเป็นครบถ้วนแล้ว
      if (!selectedUniversity || selectedUniversity === "all" ||
        !selectedFaculty || selectedFaculty === "all" ||
        !selectedProgram || selectedProgram === "all" ||
        !selectedYear || selectedYear === "all") {
        alert("กรุณาเลือก มหาวิทยาลัย, คณะ, โปรแกรม และปีการศึกษาให้ครบถ้วนก่อน");
        return;
      }

      // คำนวณปีการศึกษาก่อนหน้า
      const currentYear = parseInt(selectedYear);
      const previousYear = currentYear - 1;


      // !! สำคัญ: เปิด modal ทันทีและล้างข้อมูลเก่า
      setPreviousYearPLOs([]);
      setShowLoadPreviousPLOModal(true);

      console.log(`กำลังค้นหา PLO จากปีการศึกษา ${previousYear} สำหรับคณะ ${selectedFaculty}`);
      console.log(`Modal state ปัจจุบัน: ${showLoadPreviousPLOModal}`);

      if (previousYear < 2022) { // สมมติว่าปีต่ำสุดในระบบคือ 2023
        console.log(`ปีการศึกษา ${previousYear} ไม่มีในระบบ`);
        // จบฟังก์ชันที่นี่ แต่ modal ยังแสดงอยู่
        return;
      }

      // หาโปรแกรมปัจจุบัน
      const currentProgram = program.find(p => p.program_id === parseInt(selectedProgram));

      if (!currentProgram) {
        console.error("ไม่พบข้อมูลโปรแกรมที่เลือกในปัจจุบัน");
        return;
      }

      // ดึงข้อมูลโปรแกรมของปีก่อนหน้า
      fetch(`http://localhost:8000/program?faculty_id=${selectedFaculty}&year=${previousYear}`)
        .then(response => {
          if (!response.ok) {
            console.log(`ไม่พบข้อมูลโปรแกรมสำหรับปี ${previousYear}`);
            return null;
          }
          return response.json();
        })
        .then(data => {
          if (!data) return null;

          // แปลงข้อมูลโปรแกรม
          let programs = [];
          if (Array.isArray(data)) {
            programs = data;
          } else if (data && data.success && Array.isArray(data.message)) {
            programs = data.message;
          } else if (data && data.success && data.message && !Array.isArray(data.message)) {
            programs = [data.message];
          } else if (data && !Array.isArray(data)) {
            programs = [data];
          }

          // กรองโปรแกรมที่มีปีตรงกับปีที่ต้องการ
          programs = programs.filter(p => parseInt(p.year) === previousYear);

          if (!programs || programs.length === 0) {
            console.log(`ไม่พบโปรแกรมสำหรับคณะ ${selectedFaculty} ในปีการศึกษา ${previousYear}`);
            return null;
          }

          // หาโปรแกรมในปีก่อนหน้าที่มีชื่อเดียวกันกับโปรแกรมที่เลือกปัจจุบัน
          const previousYearProgram = programs.find(p => p.program_name === currentProgram.program_name);

          if (!previousYearProgram) {
            console.log(`ไม่พบโปรแกรม ${currentProgram.program_name} ในปีการศึกษา ${previousYear}`);
            return null;
          }

          // ดึงข้อมูล PLO
          return fetch(`http://localhost:8000/program_plo?program_id=${previousYearProgram.program_id}`);
        })
        .then(response => {
          if (!response) return null;
          if (!response.ok) return null;
          return response.json();
        })
        .then(data => {
          if (!data) return;

          // แปลงข้อมูล PLO
          let previousPLOs = [];
          if (data && data.success && Array.isArray(data.message)) {
            previousPLOs = data.message;
          } else if (Array.isArray(data)) {
            previousPLOs = data;
          } else if (data && data.success && data.message && !Array.isArray(data.message)) {
            previousPLOs = [data.message];
          } else if (data && !Array.isArray(data)) {
            previousPLOs = [data];
          }

          if (previousPLOs && previousPLOs.length > 0) {
            // เพิ่มข้อมูลปีให้กับ PLO
            const plosWithYear = previousPLOs.map(plo => ({
              ...plo,
              sourceYear: previousYear
            }));
            setPreviousYearPLOs(plosWithYear);
          }
        })
        .catch(error => {
          console.error(`เกิดข้อผิดพลาดในการโหลด PLO:`, error);
          // modal ยังคงแสดงอยู่แม้มี error
        });
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในฟังก์ชัน handleLoadPreviousPLO:", error);
      // ตรวจสอบว่า modal เปิดแล้วหรือยัง
      setShowLoadPreviousPLOModal(true);
    }
  };

  // ต้องมีการแก้ไข modal component ด้วยเพื่อให้แสดงข้อความที่เหมาะสมในทุกกรณี
  // ตัวอย่างการปรับปรุง modal component


  // ฟังก์ชัน fetchPreviousYearPLOs ที่ปรับปรุงใหม่พร้อมการ debug
  const fetchPreviousYearPLOs = () => {
    if (!selectedPreviousYear) {
      alert("กรุณาเลือกปีที่ต้องการโหลด PLO");
      return;
    }

    // เก็บค่าปีที่เลือกและแปลงเป็นตัวเลข
    const selectedYear_int = parseInt(selectedYear);
    const previousYear_int = parseInt(selectedPreviousYear);

    console.log("========== DEBUG INFO ==========");
    console.log(`กำลังค้นหา PLO จากปีการศึกษา ${previousYear_int} สำหรับคณะ ${selectedFaculty}`);
    console.log(`ปีปัจจุบันที่เลือก: ${selectedYear_int}`);
    console.log(`ปีที่ต้องการดึง PLO: ${previousYear_int}`);
    console.log(`คณะที่เลือก: ${selectedFaculty}`);
    console.log(`โปรแกรมที่เลือก: ${selectedProgram}`);
    console.log("================================");

    // แสดง loading ใน modal และล้าง PLO เก่า
    setPreviousYearPLOs([]);

    // ดึงข้อมูลโปรแกรมของปีการศึกษาที่เลือก - ต้องระบุ year ให้ตรงกับที่เลือก
    // ใช้ fetch แทน axios เพื่อความสอดคล้องกับ API อื่นๆ
    fetch(`/program?faculty_id=${selectedFaculty}&year=${previousYear_int}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // ตรวจสอบรูปแบบของข้อมูลที่ได้รับ
        console.log("ข้อมูลโปรแกรมที่ได้รับจาก API:", data);

        let programs = [];

        if (Array.isArray(data)) {
          programs = data;
          console.log("รูปแบบข้อมูล: Array");
        } else if (data && data.success && Array.isArray(data.message)) {
          programs = data.message;
          console.log("รูปแบบข้อมูล: Object with message array");
        } else if (data && data.success && data.message && !Array.isArray(data.message)) {
          programs = [data.message];
          console.log("รูปแบบข้อมูล: Object with message object");
        } else if (data && !Array.isArray(data)) {
          programs = [data];
          console.log("รูปแบบข้อมูล: Single object");
        }

        console.log(`พบโปรแกรมทั้งหมด ${programs.length} โปรแกรมจากปีการศึกษา ${previousYear_int}`);

        // Log รายการโปรแกรมที่พบ
        programs.forEach((p, index) => {
          console.log(`${index + 1}. Program ID: ${p.program_id}, Name: ${p.program_name}, Year: ${p.year}`);
        });

        // ตรวจสอบว่ามีโปรแกรมในปีที่เลือกหรือไม่
        if (!programs || programs.length === 0) {
          alert(`ไม่พบโปรแกรมสำหรับคณะ ${selectedFaculty} ในปีการศึกษา ${previousYear_int}`);
          return null;
        }

        // หาโปรแกรมที่เลือกในปัจจุบัน
        const currentProgramObj = program.find(p => p.program_id === parseInt(selectedProgram));

        if (!currentProgramObj) {
          alert("ไม่พบข้อมูลโปรแกรมที่เลือกในปัจจุบัน");
          return null;
        }

        console.log("โปรแกรมปัจจุบันที่เลือก:",
          `ID: ${currentProgramObj.program_id}, ` +
          `Name: ${currentProgramObj.program_name}, ` +
          `Name TH: ${currentProgramObj.program_name_th}, ` +
          `Year: ${currentProgramObj.year}`
        );

        // หาโปรแกรมในปีที่เลือกที่มีชื่อเดียวกันกับโปรแกรมที่เลือกปัจจุบัน
        // ค้นหาด้วย program_name เท่านั้น เพราะ program_name_th อาจไม่ตรงกัน
        const previousYearProgram = programs.find(p =>
          p.program_name === currentProgramObj.program_name
        );

        if (!previousYearProgram) {
          alert(`ไม่พบโปรแกรม ${currentProgramObj.program_name} ในปีการศึกษา ${previousYear_int}`);
          return null;
        }

        console.log(`พบโปรแกรมในปี ${previousYear_int} ที่จะดึง PLO:`,
          `ID: ${previousYearProgram.program_id}, ` +
          `Name: ${previousYearProgram.program_name}, ` +
          `Year: ${previousYearProgram.year}`
        );

        // ดึงข้อมูล PLO จากโปรแกรมในปีที่เลือก - ใช้ program_id ของโปรแกรมปีที่เลือก
        return fetch(`http://localhost:8000/program_plo?program_id=${previousYearProgram.program_id}`);
      })
      .then((response) => {
        if (!response) {
          console.log("ไม่มีการตอบกลับจากการค้นหาโปรแกรม");
          return null;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response.json();
      })
      .then((data) => {
        if (!data) return; // ถ้าไม่มีข้อมูลให้ออกจากฟังก์ชัน (เกิดจาก early return ด้านบน)

        console.log(`ข้อมูล PLO ที่ได้จากปี ${previousYear_int}:`, data);

        // ตรวจสอบรูปแบบของข้อมูล PLO ที่ได้รับ
        let previousPLOs = [];

        if (data && data.success && Array.isArray(data.message)) {
          previousPLOs = data.message;
          console.log("รูปแบบข้อมูล PLO: Object with message array");
        } else if (Array.isArray(data)) {
          previousPLOs = data;
          console.log("รูปแบบข้อมูล PLO: Array");
        } else if (data && data.success && data.message && !Array.isArray(data.message)) {
          previousPLOs = [data.message];
          console.log("รูปแบบข้อมูล PLO: Object with message object");
        } else if (data && !Array.isArray(data)) {
          previousPLOs = [data];
          console.log("รูปแบบข้อมูล PLO: Single object");
        }

        if (!previousPLOs || previousPLOs.length === 0) {
          console.log(`ไม่พบข้อมูล PLO จากปีการศึกษา ${previousYear_int}`);
          alert(`ไม่พบข้อมูล PLO จากปีการศึกษา ${previousYear_int}`);
          return;
        }

        console.log(`พบ PLO ทั้งหมด ${previousPLOs.length} รายการ`);

        // Log รายการ PLO ที่พบ
        previousPLOs.forEach((plo, index) => {
          console.log(`${index + 1}. PLO ID: ${plo.plo_id}, Code: ${plo.PLO_code}, Name: ${plo.PLO_name}`);
        });

        // เพิ่มข้อมูลปีให้กับ PLO เพื่อความชัดเจน
        const plosWithYear = previousPLOs.map(plo => ({
          ...plo,
          sourceYear: previousYear_int // เพิ่มปีที่เป็นแหล่งที่มาของ PLO
        }));

        // เก็บข้อมูล PLO จากปีที่เลือก
        console.log("กำลังอัปเดต state previousYearPLOs");
        setPreviousYearPLOs(plosWithYear);
        console.log("อัปเดต state previousYearPLOs เรียบร้อย");
      })
      .catch((error) => {
        console.error(`เกิดข้อผิดพลาดในการโหลด PLO จากปี ${previousYear_int}:`, error);
        alert(`เกิดข้อผิดพลาดในการโหลดข้อมูล PLO: ${error.message}`);
      });
  };

  // แก้ไขฟังก์ชัน handleMergePLOs


  // เพิ่มฟังก์ชันทดสอบเรียก API โดยตรง
  // เพิ่มฟังก์ชันนี้ในโค้ดและใช้เพื่อทดสอบ API endpoint ต่างๆ
  const testAPIEndpoint = (endpoint) => {
    console.log(`กำลังทดสอบ API endpoint: ${endpoint}`);
    fetch(endpoint)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("ผลลัพธ์จาก API:", data);
        alert(`API endpoint: ${endpoint}\nสถานะ: สำเร็จ\nลองดู console log เพื่อดูข้อมูลเพิ่มเติม`);
      })
      .catch(error => {
        console.error("เกิดข้อผิดพลาดในการเรียก API:", error);
        alert(`API endpoint: ${endpoint}\nสถานะ: ล้มเหลว\nข้อผิดพลาด: ${error.message}`);
      });
  };

  // ปุ่มสำหรับทดสอบ API ที่ควรเพิ่มไว้ในส่วน Modal หรือในแถบ UI
  // <button className="btn btn-secondary" onClick={() => testAPIEndpoint(`http://localhost:8000/program?faculty_id=${selectedFaculty}&year=${selectedPreviousYear}`)}>
  //   ทดสอบ API โปรแกรม
  // </button>
  // <button className="btn btn-secondary" onClick={() => testAPIEndpoint(`http://localhost:8000/program_plo?program_id=${selectedProgram}`)}>
  //   ทดสอบ API PLO
  // </button>

  const pageStyle = {
    backgroundColor: "#ffffff",
    padding: "30px",
    maxWidth: "1200px",
    margin: "0 auto",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    borderRadius: "8px",
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
  };

  const headerStyle = {
    color: "#333333",
    borderBottom: "2px solid #f0f0f0",
    paddingBottom: "15px",
    marginBottom: "20px",
    textAlign: "center",
  };

  const formGroupStyle = {
    marginBottom: "15px",
    display: "flex",
    alignItems: "center",
  };

  const labelStyle = {
    width: "180px",
    marginRight: "10px",
  };

  const selectStyle = {
    padding: "8px 12px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    minWidth: "250px",
  };

  const buttonStyle = {
    backgroundColor: "#4285f4",
    color: "white",
    border: "none",
    padding: "8px 16px",
    margin: "5px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#d93025",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
    border: "1px solid #ddd",
  };

  const thStyle = {
    backgroundColor: "#f2f2f2",
    padding: "10px",
    borderBottom: "1px solid #ddd",
    textAlign: "center",
  };

  const tdStyle = {
    padding: "10px",
    borderBottom: "1px solid #ddd",
    textAlign: "center",
  };

  return (


    <div className="mb-3" style={{ paddingTop: '80px', maxWidth: '1000px', marginLeft: '20px' }}>

      <div style={{
        position: 'fixed', // เปลี่ยนจาก sticky เป็น fixed เพื่อให้ติดอยู่ที่ตำแหน่งเดิมตลอด
        top: 0,
        left: 0, // กำหนดให้ชิดซ้ายของหน้าจอ
        right: 0, // กำหนดให้ขยายไปถึงขอบขวาของหน้าจอ
        zIndex: 1000,
        marginLeft: '250px',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #eee'
      }}>
        {/* หัวข้อหลักสูตรและแถบเมนู */}
        <div style={{
          maxWidth: '1000px',
          margin: '0 0',
          marginLeft: '15px',
          padding: '0 15px'
        }}>
          <h3 className="mb-0" style={{ fontSize: '1.4rem', padding: '10px 0', marginTop: 15 }}>{t('Program Information')}</h3>

          {/* แถบเมนู */}
          <ul className="tab-bar" style={{ margin: 0, padding: '5px 0 10px 5px', borderBottom: 'none' }}>
            <li className={`tab-item ${activeTab === 0 ? 'active' : ''}`} onClick={() => handleTabClick(0)}>{t('General Information')}</li>
            <li className={`tab-item ${activeTab === 1 ? 'active' : ''}`} onClick={() => handleTabClick(1)}>{t('Program Learning Outcomes (PLO)')}</li>
            {/* <li className={`tab-item ${activeTab === 2 ? 'active' : ''}`} onClick={() => handleTabClick(2)}>{t('PLO-Course Mapping')}</li> */}

          </ul>

          {/* จัดให้ 4 element อยู่ในแถวเดียวกัน */}
          <div className="d-flex flex-row" style={{ flexWrap: 'nowrap', marginTop: '0px' }}>
            <div className="mb-3 me-2" style={{ width: '380px' }}>
              <label className="form-label">Choose a university</label>
              <select
                className="form-select form-container-uni"
                value={selectedUniversity}
                onChange={handleUniversityChange}
              >
                <option value="all">All Universities</option>
                {universities.map((university) => (
                  <option
                    key={university.university_id}
                    value={university.university_id}
                  >
                    {university.university_name_en} ({university.university_name_th})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3 me-2" style={{ width: '380px' }}>
              <label className="form-label text-start">Choose a Faculty</label>
              <select
                className="form-select form-container-faculty"
                value={selectedFaculty}
                onChange={handleFacultyChange}
                disabled={!selectedUniversity}

              >
                <option value="all">All Facultys</option>
                {facultys.map((faculty) => (
                  <option key={faculty.faculty_id} value={faculty.faculty_id}>
                    {faculty.faculty_name_en} ({faculty.faculty_name_th})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3 me-2" style={{ width: '380px' }}>
              <label className="form-label text-start">Choose a Program</label>
              <select
                className="form-select form-container-program"
                value={selectedProgram || "all"}
                onChange={handleProgramChange}
                disabled={!selectedFaculty}

              >
                <option value="all">All Programs</option>
                {
                  // กรองโปรแกรมที่ชื่อซ้ำกันออก โดยเก็บไว้เพียงรายการแรกสุด
                  program.filter((item, index, self) =>
                    index === self.findIndex((p) =>
                      p.program_name === item.program_name &&
                      p.program_name_th === item.program_name_th
                    )
                  ).map((p) => (
                    <option key={p.program_id} value={p.program_id}>
                      {p.program_name} ({p.program_name_th || ""})
                    </option>
                  ))
                }
              </select>
            </div>

            <div className="mb-3" style={{ width: '120px' }}>
              <label className="form-label text-start">Year</label>
              <select
                className="form-select form-container-year"
                value={selectedYear}
                onChange={handleYearChange}
                disabled={!selectedProgram}

              >
                <option value="all">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>



                ))}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* เพิ่ม padding ด้านบนของเนื้อหาเพื่อไม่ให้โดนแถบเมนูทับ */}
      <div style={{
        paddingTop: '10px', // ต้องเพิ่ม padding ให้มากพอสำหรับความสูงของแถบเมนู 
        padding: '120px 15px 0 15px'
      }}>
        {/* เนื้อหาแท็บต่างๆ */}
        <div
          className={`tab-content ${activeTab === 0 ? 'active' : ''}`}
          style={{ marginTop: 10, marginBottom: 50 }}>
          <h3>Add Edit Delete Program</h3>
          <hr className="my-4" />

          {/* Alert notification */}
          {alert.show && (
            <div
              className={`alert alert-${alert.type} alert-dismissible fade show`}
              role="alert"
            >
              {alert.message}
              <button
                type="button"
                className="btn-close"
                onClick={() => setAlert({ ...alert, show: false })}
              ></button>
            </div>
          )}



          {/* Program list with all fields */}
          <h5>Program</h5>
          <table className="table table-bordered mt-3">
            <thead>
              <tr>
                <th>Program Name</th>
                <th>ชื่อหลักสูตร (ไทย)</th>
                <th>Short Name</th>
                <th>ชื่อย่อ (ไทย)</th>
                <th>Year</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProgram.map((p) => (
                <tr key={p.program_id}>
                  <td>{p.program_name}</td>
                  <td>{p.program_name_th || "-"}</td>
                  <td>{p.program_shortname_en || "-"}</td>
                  <td>{p.program_shortname_th || "-"}</td>
                  <td>{p.year || "-"}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteProgram(p.program_id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr className="my-4" />


          {/* Enhanced section to add a new program with all fields */}
          <div className="mb-3">
            <h5 className="form-label text-start" style={{ marginBottom: "15px" }}>Add Program</h5>
            <div className="mb-2">
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Program Name (English)"
                name="program_name"
                value={newProgram.program_name}
                onChange={handleNewProgramChange}
              />
              <input
                type="text"
                className="form-control mb-2"
                placeholder="ชื่อหลักสูตร (ภาษาไทย)"
                name="program_name_th"
                value={newProgram.program_name_th}
                onChange={handleNewProgramChange}
              />
              <div className="row mb-2">
                <div className="col">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Short Name (EN)"
                    name="program_shortname_en"
                    value={newProgram.program_shortname_en}
                    onChange={handleNewProgramChange}
                  />
                </div>
                <div className="col">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ชื่อย่อ (ไทย)"
                    name="program_shortname_th"
                    value={newProgram.program_shortname_th}
                    onChange={handleNewProgramChange}
                  />
                </div>
              </div>
              <div className="row mb-2">
                <div className="col">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Year (e.g., 2022)"
                    name="year"
                    value={newProgram.year}
                    onChange={handleNewProgramChange}
                  />
                </div>
                <div className="col d-flex justify-content-end">
                  <button
                    className="btn btn-primary"
                    onClick={handleAddProgram}
                    disabled={newProgram.program_name.trim() === ""}
                  >
                    Insert
                  </button>
                </div>
              </div>
            </div>
          </div>
          <hr className="my-4" />


          {/* Updated section to edit an existing program with all fields */}
          <div className="mb-3">
            <h5 className="form-label text-start" style={{ marginBottom: "15px" }}>Edit Program</h5>
            <div className="mb-2">
              <select
                className="form-select mb-2"
                value={editProgram ? editProgram.program_id : ""}
                onChange={(e) => {
                  const selectedId = parseInt(e.target.value, 10);
                  const selectedProgram = program.find(
                    (p) => p.program_id === selectedId
                  );
                  setEditProgram(selectedProgram);
                  if (selectedProgram) {
                    setEditFormData({
                      program_name: selectedProgram.program_name || "",
                      program_name_th: selectedProgram.program_name_th || "",
                      program_shortname_en:
                        selectedProgram.program_shortname_en || "",
                      program_shortname_th:
                        selectedProgram.program_shortname_th || "",
                      year: selectedProgram.year
                        ? selectedProgram.year.toString()
                        : "",
                    });
                  }
                }}
              >
                <option value="" disabled>
                  Select Program
                </option>
                {filteredProgram.map((p) => (
                  <option key={p.program_id} value={p.program_id}>
                    {p.program_name} {p.program_name_th ? `(${p.program_name_th})` : ''}
                  </option>
                ))}
              </select>

              <input
                type="text"
                className="form-control mb-2"
                placeholder="Program Name (English)"
                name="program_name"
                value={editFormData.program_name}
                onChange={handleEditFormChange}
                disabled={!editProgram}
              />
              <input
                type="text"
                className="form-control mb-2"
                placeholder="ชื่อหลักสูตร (ภาษาไทย)"
                name="program_name_th"
                value={editFormData.program_name_th}
                onChange={handleEditFormChange}
                disabled={!editProgram}
              />
              <div className="row mb-2">
                <div className="col">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Short Name (EN)"
                    name="program_shortname_en"
                    value={editFormData.program_shortname_en}
                    onChange={handleEditFormChange}
                    disabled={!editProgram}
                  />
                </div>
                <div className="col">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ชื่อย่อ (ไทย)"
                    name="program_shortname_th"
                    value={editFormData.program_shortname_th}
                    onChange={handleEditFormChange}
                    disabled={!editProgram}
                  />
                </div>
              </div>
              <div className="row mb-2">
                <div className="col">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Year (e.g., 2022)"
                    name="year"
                    value={editFormData.year}
                    onChange={handleEditFormChange}
                    disabled={!editProgram}
                  />
                </div>
                <div className="col d-flex justify-content-end">
                  <button
                    className="btn btn-primary"
                    onClick={handleEditProgram}
                    disabled={!editProgram}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
          <hr className="my-4" />


        </div>
        <div
          className={`tab-content ${activeTab === 1 ? 'active' : ''}`}
          style={{ marginTop: 10, marginBottom: 100 }}>
          <div style={{ backgroundColor: "#F0F0F0", minHeight: "100vh", paddingTop: '0px' }}>
            <div className="plo-management-container">
              <h3>Course-PLO Management</h3>


              <hr className="my-4" />

              {/* PLO List Section */}
              <h5>PLO List</h5>

              <div className="action-buttons">
                <div className="button-group">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn"
                    style={{ backgroundColor: "#FF8C00", color: "white" }}
                    disabled={!allFiltersSelected}
                  >
                    Add PLO
                  </button>

                  <button
                    onClick={handleLoadPreviousPLO}
                    className="btn btn-secondary"
                    disabled={!allFiltersSelected}
                  >
                    Load Previous Year PLOs
                  </button>

                  {/* โมดัลแสดง Previous Year PLOs ยังคงเหมือนเดิม */}
                </div>

                <div className="button-group ms-auto">
                  <button
                    onClick={() => document.getElementById('uploadFile').click()}
                    className="btn btn-secondary"
                    disabled={!allFiltersSelected}
                  >
                    Upload Excel
                  </button>
                  <input
                    type="file"
                    id="uploadFile"
                    style={{ display: 'none' }}
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                  />

                  <button
                    onClick={handlePasteButtonClick}
                    className="btn"
                    style={{ backgroundColor: "#00BFFF", color: "white" }}
                    disabled={!allFiltersSelected}
                  >
                    Paste Data
                  </button>

                  {/* ส่วนพื้นที่วางข้อมูล ยังคงเหมือนเดิม */}

                  <button
                    onClick={handleUploadButtonClick}
                    className="btn btn-success"
                    disabled={!excelData || !allFiltersSelected}
                  >
                    Submit Excel Data
                  </button>
                </div>

                {/* ส่วนแสดงข้อมูล Preview ยังคงเหมือนเดิม */}
              </div>

              {typeError && (
                <div className="alert alert-danger mb-3">{typeError}</div>
              )}

              {/* แสดงข้อความเมื่อยังไม่ได้เลือก filters ครบ */}
              {!allFiltersSelected && (
                <div className="alert alert-info mt-4">
                  Please select all filters (University, Faculty, Program, and Year) to view PLO data.
                </div>
              )}

              {/* แสดงข้อความเมื่อเลือกฟิลเตอร์ครบแล้ว แต่ไม่มีข้อมูล */}
              {allFiltersSelected && selectedYear !== "all" && (!plos.length || !courses.length) && (
                <div className="alert alert-info mt-4">
                  {!plos.length ? "ไม่พบข้อมูล PLO " : ""}
                  {!courses.length ? "ไม่พบข้อมูลรายวิชา " : ""}
                  สำหรับปีการศึกษา {selectedYear}
                </div>
              )}

              {/* PLO Table - แสดงเฉพาะเมื่อเลือก filters ครบแล้ว และมีข้อมูล */}
              {allFiltersSelected && selectedYear !== "all" && plos.length > 0 && courses.length >= 0 && (
                <div className="plo-table-container">
                  <table className="plo-table">
                    <thead>
                      <tr>
                        <th className="plo-code-col">PLO Code</th>
                        <th className="plo-name-col">PLO Name</th>
                        <th className="plo-actions-col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plos.length > 0 ? (
                        plos.map((plo) => (
                          <tr key={plo.plo_id}>
                            <td>
                              <div className="plo-cell-content text-center">{plo.PLO_code}</div>
                            </td>
                            <td>
                              <div className="plo-cell-content">{plo.PLO_name}</div>
                              {plo.PLO_engname && (
                                <>
                                  <div className="my-1 border-t border-gray-300"></div>
                                  <div className="plo-cell-secondary">{plo.PLO_engname}</div>
                                </>
                              )}
                            </td>
                            <td>
                              <button
                                className="plo-table-btn plo-edit-btn"
                                onClick={() => handleEditPlo(plo)}
                              >
                                Edit
                              </button>
                              <button
                                className="plo-table-btn plo-delete-btn"
                                onClick={() => handleDeletePlo(plo.plo_id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center">
                            No PLO data found for the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>


                </div>
              )}

            </div>
          </div>
        </div>
        {showAddModal && (
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              zIndex: 1000,
              width: "300px",
            }}
          >
            <h3>Add New PLO (ปี {selectedYear})</h3>
            <label>PLO Code:</label>
            <input
              type="text"
              value={newPlo.PLO_code}
              onChange={(e) => setNewPlo({ ...newPlo, PLO_code: e.target.value })}
              style={{ width: "100%" }}
            />
            <label>PLO Name:</label>
            <input
              type="text"
              value={newPlo.PLO_name}
              onChange={(e) => setNewPlo({ ...newPlo, PLO_name: e.target.value })}
              style={{ width: "100%" }}
            />
            <label>PLO English Name:</label>
            <input
              type="text"
              value={newPlo.PLO_engname}
              onChange={(e) =>
                setNewPlo({ ...newPlo, PLO_engname: e.target.value })
              }
              style={{ width: "100%" }}
            />
            {/* เพิ่ม hidden field สำหรับปี */}
            <input
              type="hidden"
              value={selectedYear}
              name="year"
            />
            <button
              onClick={handleAddPlo}
              style={{
                backgroundColor: "blue",
                color: "white",
                padding: "8px 16px",
                border: "none",
                cursor: "pointer",
                marginTop: "10px",
                width: "100%",
              }}
            >
              Add PLO
            </button>
            <button
              onClick={() => setShowAddModal(false)}
              style={{
                backgroundColor: "red",
                color: "white",
                padding: "8px 16px",
                border: "none",
                cursor: "pointer",
                marginTop: "10px",
                width: "100%",
              }}
            >
              Close
            </button>
          </div>
        )}
        {excelData && excelData.length > 0 && (
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              zIndex: 1050,
              width: "80%",
              maxWidth: "800px",
              maxHeight: "80vh",
              overflow: "auto",
              borderRadius: "8px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
              <h3 style={{ margin: 0 }}>Excel Data Preview</h3>
              <button
                onClick={() => setExcelData(null)}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer"
                }}
              >
                ×
              </button>
            </div>

            {excelData.length > 0 ? (
              <>
                <p>Found {excelData.length} PLO records from Excel file.</p>
                <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "20px" }}>
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th style={{ backgroundColor: "#f2f2f2", position: "sticky", top: 0 }}>PLO Code</th>
                        <th style={{ backgroundColor: "#f2f2f2", position: "sticky", top: 0 }}>PLO Name</th>
                        <th style={{ backgroundColor: "#f2f2f2", position: "sticky", top: 0 }}>PLO English Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelData.map((item, index) => (
                        <tr key={index}>
                          <td>{item.PLO_code || "-"}</td>
                          <td>{item.PLO_name || "-"}</td>
                          <td>{item.PLO_engname || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button
                    onClick={() => setExcelData(null)}
                    className="btn btn-secondary"
                    style={{ minWidth: "100px" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadButtonClick}
                    className="btn btn-success"
                    style={{ minWidth: "100px" }}
                  >
                    Submit Data
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>No data found in the Excel file.</p>
                <button
                  onClick={() => setExcelData(null)}
                  className="btn btn-secondary"
                  style={{ width: "100%" }}
                >
                  Close
                </button>
              </>
            )}
          </div>
        )}
        {/* Modal สำหรับแสดง Previous Year PLOs */}
        {showLoadPreviousPLOModal && (
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              zIndex: 1050,
              width: "80%",
              maxWidth: "800px",
              maxHeight: "80vh",
              overflow: "auto",
              borderRadius: "8px"
            }}
          >
            <h3 style={{ borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
              PLOs จากปีก่อนหน้า (ปี {parseInt(selectedYear) - 1})
            </h3>

            {previousYearPLOs.length > 0 ? (
              <>
                <p>พบ {previousYearPLOs.length} รายการ PLO จากปีการศึกษาก่อนหน้า</p>
                <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "20px" }}>
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>PLO Code</th>
                        <th>PLO Name</th>
                        <th>PLO English Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previousYearPLOs.map((plo, index) => (
                        <tr key={index}>
                          <td>{plo.PLO_code || "-"}</td>
                          <td>{plo.PLO_name || "-"}</td>
                          <td>{plo.PLO_engname || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button
                    onClick={() => setShowLoadPreviousPLOModal(false)}
                    className="btn btn-secondary"
                    style={{ minWidth: "100px" }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleMergePLOs}
                    className="btn btn-success"
                    style={{ minWidth: "100px" }}
                  >
                    นำเข้า PLOs
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>ไม่พบข้อมูล PLO จากปีการศึกษาก่อนหน้า</p>
                <button
                  onClick={() => setShowLoadPreviousPLOModal(false)}
                  className="btn btn-secondary"
                  style={{ width: "100%" }}
                >
                  ปิด
                </button>
              </>
            )}
          </div>
        )}





      
        {/* <div className={`tab-content ${activeTab === 2 ? 'active' : 'hidden'}`}
          style={{ marginTop: 10, marginBottom: 50 }}>
          <div style={{ backgroundColor: "#F0F0F0", minHeight: "100vh", paddingTop: '0px' }}>
            <div className="plo-management-container">
              <h3>Course-PLO Mapping</h3>
              <hr className="my-4" />

              {allFiltersSelected && selectedYear !== "all" && plos.length > 0 && courses.length > 0 && (
                <>
                  <div className="action-buttons mb-3">
                    <button
                      onClick={handleEditToggle}
                      className="btn btn-primary me-2"
                    >
                      {editingScores ? "Cancel Edit" : "Edit"}
                    </button>

                    <button
                      onClick={handlePatchScores}
                      disabled={!editingScores}
                      className="btn btn-success me-2"
                    >
                      Confirm
                    </button>

                    <button
                      onClick={handlePostScores}
                      disabled={!editingScores}
                      className="btn"
                      style={{ backgroundColor: "#FF8C00", color: "white" }}
                    >
                      Submit New Scores
                    </button>
                  </div>


                </>
              )}

              {allFiltersSelected && selectedYear !== "all" && (!plos.length || !courses.length) && (
                <div className="alert alert-info">
                  {!plos.length ? "ไม่พบข้อมูล PLO " : ""}
                  {!courses.length ? "ไม่พบข้อมูลรายวิชา " : ""}
                  สำหรับปีการศึกษา {selectedYear}
                </div>
              )}

              {allFiltersSelected && selectedYear === "all" && (
                <div className="alert alert-info">
                  กรุณาเลือกปีการศึกษาเพื่อแสดงข้อมูลตาราง Course-PLO Mapping
                </div>
              )}

              {plos.length > 0 && courses.length > 0 && (
                <table
                  style={{
                    borderCollapse: "collapse",
                    width: "100%",
                    marginTop: "15px",
                    border: "2px solid black",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "10px",
                          textAlign: "center",
                        }}
                        rowSpan="2"
                      >
                        Course
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "10px",
                          textAlign: "center",
                          backgroundColor: "#f2f2f2"
                        }}
                        colSpan={plos.length}
                      >
                        PLO (ปี {selectedYear})
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "10px",
                          textAlign: "center",
                        }}
                        rowSpan="2"
                      >
                        Total
                      </th>
                    </tr>
                    <tr>
                      {plos.map((plo) => (
                        <th
                          key={plo.plo_id}
                          style={{
                            border: "1px solid black",
                            padding: "10px",
                            textAlign: "center",
                          }}
                        >
                          {plo.PLO_code}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.course_id}>
                        <td style={{ border: "1px solid black", padding: "10px" }}>
                          {course.course_id} {course.course_name}
                        </td>
                        {plos.map((plo) => {
                          const key = `${course.course_id}-${plo.plo_id}`;
                          return (
                            <td
                              key={plo.plo_id}
                              style={{
                                border: "1px solid black",
                                padding: "10px",
                                textAlign: "center",
                              }}
                            >
                              {editingScores ? (
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={scores[key] || ""}
                                  onChange={(e) =>
                                    handleInputChange(
                                      course.course_id,
                                      plo.plo_id,
                                      e.target.value
                                    )
                                  }
                                  style={{
                                    width: "60px",
                                    padding: "5px",
                                    textAlign: "center",
                                  }}
                                />
                              ) : (
                                (weights[key] !== undefined ? weights[key] : "-") || "-"
                              )}
                            </td>
                          );
                        })}
                        <td
                          style={{
                            border: "1px solid black",
                            padding: "10px",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          {calculateTotal(course.course_id)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}


            </div>



          </div>
        </div> */}


      </div>
    </div>

  );
}