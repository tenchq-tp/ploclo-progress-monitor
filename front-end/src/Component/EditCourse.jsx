import React, { useState, useEffect } from "react";
import axios from "./axios";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import AddCourse from "./EditCourse/AddCourse";
import EditCourse from "./EditCourse/EditCourse";
import CourseTable from "./EditCourse/CourseTable";
import TableEditCloWeight from "./EditCourse/TableEditCloWeight";
import CloMapping from "./EditCourse/CloMapping";

export default function Course() {
  const [course, setCourse] = useState([]);
  const [newCourse, setNewCourse] = useState({
    course_id: "",
    course_name: "",
    course_engname: "",
    program_id: "",
    year: "",
    section: "",
    semester_id: "",
  });
  const [editCourse, setEditCourse] = useState({
    course_id: "",
    course_name: "",
    course_engname: "",
    program_id: "",
    year: "",
    section: "",
    semester_id: "",
  });

  const [activeTab, setActiveTab] = useState(0);

  const { t, i18n } = useTranslation();
  const [semesters, setSemesters] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [facultys, setFacultys] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [allFiltersSelected, setAllFiltersSelected] = useState(false);

  // Changed from plos to clos
  const [editingScores, setEditingScores] = useState(false);
  const [clos, setClos] = useState([]);
  const [weights, setWeights] = useState({});
  const [scores, setScores] = useState({});
  const [showMapping, setShowMapping] = useState(false);

  // CLO Management States from Second File
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [mappings, setMappings] = useState([]);
  const [CLOs, setCLOs] = useState([]);
  const [plos, setPlos] = useState([]);
  const [editClo, setEditClo] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCloName, setEditCloName] = useState("");
  const [editCloEngName, setEditCloEngName] = useState("");
  const [editCloCode, setEditCloCode] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [excelData, setExcelData] = useState(null);
  const [typeError, setTypeError] = useState(null);
  const [previousYearCLOs, setPreviousYearCLOs] = useState([]);
  const [showPreviousYearCLOsModal, setShowPreviousYearCLOsModal] =
    useState(false);
  const [allPLOs, setAllPLOs] = useState([]);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [programCourseData, setProgramCourseData] = useState({
    courses: [],
    sections: [],
    semesters: [],
    years: [],
  });

  const [fileUploaded, setFileUploaded] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [assignmentName, setAssignmentName] = useState("");
  const [isEditing, setIsEditing] = useState(false); // เพิ่มตรงนี้

  // Step 2: CLO Scoring System state
  const [homeworks, setHomeworks] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [cloWeights, setCloWeights] = useState({});

  // Step 3: Import Students state
  const [importedStudents, setImportedStudents] = useState([]);
  const [clipboardText, setClipboardText] = useState("");
  const [importErrors, setImportErrors] = useState([]);
  const [importSuccess, setImportSuccess] = useState("");
  const [currentAssignmentId, setCurrentAssignmentId] = useState(null);

  // Other state variables
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [students, setStudents] = useState([]);

  const [weightDisplay, setWeightDisplay] = useState([]);
  const [courseClo, setCourseClo] = useState({});
  const [weightEachCourse, setWeightEachCourse] = useState({});
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState({});
  const [editData, setEditData] = useState({
    assignment_name: "",
    course_name: "",
    section_id: "",
    semester_id: "",
    year: "",
    program_id: "",
    faculty_id: "",
    university_id: "",
  });
  const [selectedCourseClo, setSelectedCourseClo] = useState([
    {
      course_id: "",
      course_name: "",
      course_engname: "",
      program_id: "",
      year: "",
      semester_id: "",
    },
  ]);

  const [allSections, setAllSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allWeights, setAllWeights] = useState([]);
  const [courseList, setCourseList] = useState([]);



  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await axios.get("/university");
        // ตรวจสอบว่าข้อมูลเป็น array หรือไม่ ถ้าไม่ใช่ให้แปลงเป็น array ก่อน
        const universityData = Array.isArray(response.data)
          ? response.data
          : [response.data].filter(Boolean);
        setUniversities(universityData);
        // console.log("Universities loaded:", universityData);
      } catch (error) {
        console.error("Error fetching universities:", error);
        alert("ไม่สามารถโหลดรายชื่อมหาวิทยาลัยได้");
        setUniversities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, []);

  // แก้ไขการเรียกใช้ API เพื่อดึงข้อมูลคณะ
  useEffect(() => {
    if (!selectedUniversity) {
      setFacultys([]);
      setSelectedFaculty("");
      return;
    }

    // console.log("Fetching faculties for university ID:", selectedUniversity);

    const fetchFaculties = async () => {
      try {
        const response = await axios.get(
          `/faculty?university_id=${selectedUniversity}`
        );
        // console.log("Response from faculty API:", response);
        const facultyData = Array.isArray(response.data)
          ? response.data
          : [response.data].filter(Boolean);
        // console.log("Processed Faculty Data:", facultyData);
        setFacultys(facultyData);
      } catch (error) {
        console.error("Error fetching faculties:", error);
        alert("ไม่สามารถโหลดคณะได้");
        setFacultys([]);
        setSelectedFaculty("");
      }
    };

    fetchFaculties();
  }, [selectedUniversity]);

  useEffect(() => {
    if (courseClo.length > 0 && activeTab === 2) {
      setShowMapping(true);
    }
  }, [courseClo]);

  // แก้ไขการเรียกใช้ API เพื่อดึงข้อมูลโปรแกรม
  useEffect(() => {
    if (!selectedFaculty) {
      setPrograms([]);
      setSelectedProgram("");
      return;
    }

    // console.log("Fetching programs for faculty ID:", selectedFaculty);

    const fetchPrograms = async () => {
      try {
        const response = await axios.get(
          `/program?faculty_id=${selectedFaculty}`
        );
        // ตรวจสอบและแปลงข้อมูลให้เป็น array เสมอ
        const programData = Array.isArray(response.data)
          ? response.data
          : [response.data].filter(Boolean);

        // console.log("Programs loaded:", programData);
        setPrograms(programData);

        // ตรวจสอบว่าค่าที่เลือกอยู่ยังมีอยู่ในข้อมูลใหม่หรือไม่
        if (
          programData.length > 0 &&
          !programData.some((p) => p.program_id.toString() === selectedProgram)
        ) {
          setSelectedProgram("");
        }
      } catch (error) {
        console.error("Error fetching programs:", error);
        alert("ไม่สามารถโหลดหลักสูตรได้");
        setPrograms([]);
        setSelectedProgram("");
      }
    };

    fetchPrograms();
  }, [selectedFaculty]);

  // แก้ไขการดึงข้อมูลปีและหารายวิชาตามโปรแกรม
  useEffect(() => {
    if (!selectedProgram) {
      setYears([]);
      setSelectedYear("");
      return;
    }

    // console.log("Finding years for program ID:", selectedProgram);

    const fetchYearsForProgram = async () => {
      try {
        // หาโปรแกรมที่เลือกจาก programs
        const selectedProgramData = programs.find(
          (p) => p.program_id.toString() === selectedProgram.toString()
        );

        if (!selectedProgramData) {
          console.error("Selected program not found in programs array");
          setYears([]);
          setSelectedYear("");
          return;
        }

        // หาชื่อของโปรแกรมที่เลือก
        const selectedProgramName = selectedProgramData.program_name;

        // ค้นหาทุกโปรแกรมที่มีชื่อเดียวกัน
        const programsWithSameName = programs.filter(
          (p) => p.program_name === selectedProgramName
        );

        // ดึงปีการศึกษาจากทุกโปรแกรมที่มีชื่อเดียวกัน
        const availableYears = programsWithSameName
          .map((p) => p.year)
          .filter((year) => year != null);

        // เรียงลำดับปีการศึกษาและลบค่าซ้ำ
        const uniqueYears = [...new Set(availableYears)].sort((a, b) => a - b);

        // console.log("Available years for selected program:", uniqueYears);
        setYears(uniqueYears);

        // ตรวจสอบว่าปีที่เลือกไว้ยังอยู่ในรายการปีใหม่หรือไม่
        if (
          uniqueYears.length > 0 &&
          !uniqueYears.includes(parseInt(selectedYear))
        ) {
          setSelectedYear("");
        }
      } catch (error) {
        console.error("Error fetching years:", error);
        setYears([]);
        setSelectedYear("");
      }
    };

    fetchYearsForProgram();
  }, [selectedProgram, programs]);

  // ตรวจสอบว่าฟิลเตอร์ทั้งหมดถูกเลือกหรือไม่
  useEffect(() => {
    if (
      selectedUniversity &&
      selectedFaculty &&
      selectedYear &&
      selectedProgram
    ) {
      setAllFiltersSelected(true);

      // Update newCourse state with selected filters
      setNewCourse((prev) => ({
        ...prev,
        university_id: selectedUniversity,
        faculty_id: selectedFaculty,
        year: selectedYear,
        program_id: selectedProgram,
      }));
    } else {
      setAllFiltersSelected(false);

      // Reset related data when filters are incomplete
      setCourse([]);
    }
  }, [selectedUniversity, selectedFaculty, selectedYear, selectedProgram]);

  // แก้ไขการดึงข้อมูล CLO เมื่อเลือกรายวิชา
  useEffect(() => {
    if (
      selectedCourseId &&
      selectedSemesterId &&
      selectedYear &&
      selectedProgram
    ) {
      if (activeTab === 1) {
        fetchFilteredCourseClo();
      } else if (activeTab === 2) {
        fetchFilteredCourseClo();
        fetchWeight();
      }
    } else {
      setCLOs([]);
      setMappings([]);
      setPlos([]);
    }
  }, [selectedCourseId]);

  // ดึงข้อมูลหลักสูตรและภาคเรียนเมื่อเริ่มต้นใช้งาน
  useEffect(() => {
    const initializePage = async () => {
      await fetchAllPrograms(); // ดึงข้อมูลโปรแกรมทั้งหมด
      await fetchSemesters(); // ดึงข้อมูลภาคเรียน
    };

    initializePage();
  }, []);

  // ดึงข้อมูลรายวิชาเมื่อมีการเลือกโปรแกรม ภาคเรียน และปีการศึกษา
  useEffect(() => {
    // Reset course state before fetching new data
    setCourse([]); // Clear old courses first

    if (newCourse.program_id && newCourse.semester_id && selectedYear) {
      fetchCourses(); // Fetch course data when program, semester, or year is selected
    }
  }, [newCourse.program_id, newCourse.semester_id, selectedYear]);


  useEffect(() => {
    const updatedWeights = {};

    mappings.forEach((mapping) => {
      const key = `${mapping.PLO_id}-${mapping.CLO_id}`;
      updatedWeights[key] = mapping.weight ?? "-";
    });

    // console.log("Updated Weights:", updatedWeights);
    setWeights(updatedWeights);
  }, [mappings, CLOs]);

  // สำหรับดึง assignments ทั้งหมด
  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/get_assignments");
        // console.log("Assignments data:", response.data || []);
        setAssignments(response.data || []);
      } catch (error) {
        console.error("Error fetching assignments:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  // อัพเดต currentAssignmentId เมื่อ homeworks เปลี่ยน
  useEffect(() => {
    if (homeworks.length > 0 && homeworks[0].id) {
      setCurrentAssignmentId(homeworks[0].id);
      // console.log("Current Assignment ID set to:", homeworks[0].id);
    } else {
      setCurrentAssignmentId(null);
    }
  }, [homeworks]);

  // เพิ่มการตรวจสอบค่า PLO ID ใน useEffect เมื่อดึงข้อมูล
  useEffect(() => {
    console.log(
      `course Id ${selectedCourseId}\nsemester ${selectedSemesterId}`
    );
    fetchAllCourseByProgram(selectedProgram);
  }, [selectedSemesterId]);

  // ใช้ useEffect เพื่อโหลดข้อมูลตั้งต้นเมื่อเข้าสู่ Step 2
  useEffect(() => {
    if (currentStep === 2 && homeworks.length > 0) {
      // ถ้าอยู่ที่ Step 2 และมี homework แล้ว ให้ดึงข้อมูล weight
      fetchCourseWeights(selectedProgram);
    }
  }, [currentStep]);

  async function fetchWeight() {
    try {
      const response = await axios.get("/api/clo-mapping/weight", {
        params: {
          course_id: selectedCourseId,
          semester_id: selectedSemesterId,
          year: selectedYear,
        },
      });
      setCourseClo(response.data);
      let weight_array = [];
      const result_array = response.data;
      result_array.map((data) => {
        weight_array.push(data.weight);
      });
      setAllWeights(weight_array);
    } catch (error) {
      console.error(error);
    }
  }

  const fetchCourseWeights = async (programId) => {
    try {
      if (
        !selectedCourseId ||
        !selectedSectionId ||
        !selectedSemesterId ||
        !selectedYear
      ) {
        // console.log("ไม่มีพารามิเตอร์ที่จำเป็นสำหรับการดึงข้อมูล weights");
        return;
      }

      // เปลี่ยนจาก '/course_clo' เป็น '/course_clo_with_weight' เพื่อดึงข้อมูล weight
      const response = await axios.get("/course_clo_with_weight", {
        params: {
          program_id: programId,
          course_id: selectedCourseId,
          section_id: selectedSectionId,
          semester_id: selectedSemesterId,
          year: selectedYear,
        },
      });

      if (Array.isArray(response.data) && response.data.length > 0) {
        setWeightEachCourse((prev) => {
          const newWeights = { ...prev };

          response.data.forEach((item) => {
            const cloId = item.CLO_id;
            const weight = item.weight || 0;

            if (cloId !== undefined) {
              const key = `a${selectedCourseId}_${cloId}`;
              newWeights[key] = {
                weight,
                clo_id: cloId,
                course_id: selectedCourseId,
              };
            }
          });

          return newWeights;
        });

        // เพิ่มการเก็บค่า weight ในอีกตัวแปรสำหรับใช้ในการคำนวณคะแนน
        const cloWeightsObj = {};
        response.data.forEach((item) => {
          cloWeightsObj[item.CLO_id] = item.weight || 0;
        });
        setCloWeights(cloWeightsObj);
      } else {
        // console.log("ไม่พบข้อมูล course_clo");
        setWeights({});
        setCloWeights({});
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล course_clo weights:", error);
      if (error.response) {
        console.error("รายละเอียดข้อผิดพลาด:", error.response.data);
      }
      setWeights({});
      setCloWeights({});
    }
  };

  // ฟังก์ชันสำหรับดึง PLO ของโปรแกรม
  const fetchPLOsForProgram = async () => {
    try {
      if (!selectedProgram) {
        // console.log("No program selected for fetchPLOsForProgram");
        return;
      }

      const response = await axios.get(
        `/program_plo?program_id=${selectedProgram}`
      );
      // console.log("PLO response:", response.data);

      // ปรับแต่งข้อมูลให้มีฟิลด์ PLO_id
      let formattedPLOs = [];
      const data = response.data;

      if (data.success && Array.isArray(data.message)) {
        formattedPLOs = data.message.map((plo) => ({
          ...plo,
          PLO_id: plo.PLO_id || plo.plo_id,
        }));
      } else if (Array.isArray(data)) {
        formattedPLOs = data.map((plo) => ({
          ...plo,
          PLO_id: plo.PLO_id || plo.plo_id,
        }));
      } else if (data) {
        formattedPLOs = [
          {
            ...data,
            PLO_id: data.PLO_id || data.plo_id,
          },
        ];
      }

      // console.log("Formatted PLOs:", formattedPLOs);
      setAllPLOs(formattedPLOs);
    } catch (error) {
      console.error("Error fetching PLOs:", error);
      setAllPLOs([]);
    }
  };

  // ฟังก์ชันสำหรับหาโปรแกรมที่ไม่ซ้ำกัน
  const getUniquePrograms = (programsArray) => {
    // ใช้ Set เพื่อเก็บ key ที่ไม่ซ้ำกัน (program_name)
    const uniquePrograms = [];
    const seenNames = new Set();

    programsArray.forEach((program) => {
      // ใช้ program_name เป็น key
      const programName = program.program_name;

      // ถ้ายังไม่เคยเห็นชื่อนี้ ให้เพิ่มเข้าไปในรายการ
      if (!seenNames.has(programName)) {
        seenNames.add(programName);
        uniquePrograms.push(program);
      }
    });

    return uniquePrograms;
  };

  async function fetchAllSectionByCourse() {
    try {
      const response = await axios.get("/api/clo-mapping", {
        params: {
          semester_id: selectedSemesterId,
          course_id: selectedCourseId,
          year: selectedYear,
        },
      });
      setAllSections(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  // ฟังก์ชันดึงข้อมูลรายวิชาตามโปรแกรมและภาคเรียน
  const fetchCourses = async () => {
    try {
      const response = await axios.get("/api/course/filter", {
        params: {
          semester_id: selectedSemesterId,
          year: selectedYear,
        },
      });
      setCourses(response.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourse([]);
    }
  };

  // ฟังก์ชันดึงข้อมูลภาคเรียนและลบข้อมูลซ้ำ
  const fetchSemesters = async () => {
    try {
      const response = await axios.get("/semesters");

      if (!response.data) {
        console.warn("Invalid or empty response for semesters");
        setSemesters([]);
        return;
      }
      const uniqueSemesters = getUniqueSemesters(response.data);
      setSemesters(uniqueSemesters || []);
    } catch (err) {
      console.error("Error fetching semesters:", err);
      setSemesters([]);
    }
  };

  const handleTabClick = (tabIndex) => {
    setActiveTab(tabIndex);

    // รีเซ็ตค่าที่เกี่ยวข้องกับการแก้ไข เมื่อสลับแท็บ
    if (editingScores) {
      setEditingScores(false);
      setScores({});
    }

    // เคลียร์ข้อมูลตามแท็บที่เลือก
    if (tabIndex === 4) {
      // แท็บ Assignment
      // ไม่ต้องรีเซ็ตข้อมูลทั้งหมดเพื่อให้สามารถกลับมาดูข้อมูลเดิมได้
      setCurrentStep(1);
      setError(null);

      // ในกรณีที่มีการเลือก Assignment ให้ล้างค่า selectedAssignment
      setSelectedAssignment(null);
    }
  };

  // Helper function to filter out duplicate semesters
  const getUniqueSemesters = (semesters) => {
    const uniqueSemesterIds = [
      ...new Set(semesters.map((item) => item.semester_id)),
    ];
    return semesters.filter((semester) =>
      uniqueSemesterIds.includes(semester.semester_id)
    );
  };

  // ฟังก์ชันดึงข้อมูลโปรแกรมทั้งหมด
  const fetchAllPrograms = async () => {
    try {
      const response = await axios.get("/program");
      if (response.data && Array.isArray(response.data)) {
        setPrograms(response.data);
      } else {
        console.error("Invalid program data format");
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
    }
  };

  // ฟังก์ชันสำหรับเปลี่ยนค่ารายวิชา
  const handleCourseChange = (e) => {
    const { name, value } = e.target;

    // อัพเดทค่าใน newCourse
    setNewCourse((prev) => ({
      ...prev,
      [name]: value,
    }));

    // หากเป็นการเปลี่ยนภาคเรียน ให้อัพเดทค่า selectedSemesterId สำหรับแท็บ CLO ด้วย
    if (name === "semester_id") {
      setSelectedSemesterId(value);

      // หากมีการเลือกโปรแกรม ปี และภาคเรียนครบแล้ว ให้ดึงข้อมูลรายวิชา
      if (selectedProgram && selectedYear && value) {
        fetchCourses();
      }
    }
  };

  // ตรวจสอบฟังก์ชัน handleInputChange
  const handleInputChange = (courseId, cloId, value, weight) => {
    const key = `${courseId}_${cloId}`;
    //  console.log(`Setting score for course ${courseId}, CLO ${cloId}: ${value}`);
    console.log("weight display -----> ", weightDisplay);
    setScores({ weight, [key]: value });
  };

  function handleEditWeightEachCourse(course_id, clo_id, newWeight) {
    const key = `a${course_id}_${clo_id}`;
    setWeightEachCourse((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        weight: newWeight, // แก้เฉพาะ weight
      },
    }));
  }

  const refreshDataFromServer = () => {
    refreshDataAndMappings();
  };

  // แก้ไขฟังก์ชัน handlePostScores เพื่อตรวจสอบว่าอยู่ที่แท็บไหน
  const handlePostScores = () => {
    // ตรวจสอบว่าตอนนี้อยู่ที่แท็บไหนอย่างชัดเจน
    if (activeTab === 3) {
      // ถ้าอยู่ที่แท็บ CLO-PLO Mapping (แท็บ 3)
      // ส่งข้อมูลไปยังตาราง plo_clo
      handlePostPloCloScores();
    } else if (activeTab === 2) {
      // ถ้าอยู่ที่แท็บ Course-CLO Mapping (แท็บ 2)
      // ส่งข้อมูลไปยังตาราง course_clo
      handlePostCourseCloScores();
    }
  };

  const handlePostPloCloScores = () => {
    console.log("กำลังบันทึกข้อมูลลงตาราง plo_clo");

    // ตรวจสอบว่าตอนนี้อยู่ที่แท็บ CLO-PLO Mapping จริงๆ
    if (activeTab !== 3) {
      console.error("ฟังก์ชันนี้ควรถูกเรียกจากแท็บ CLO-PLO Mapping เท่านั้น");
      return;
    }

    // ตรวจสอบข้อมูลที่จำเป็น
    if (
      !selectedProgram ||
      !selectedSemesterId ||
      !selectedYear ||
      !selectedCourseId ||
      !selectedSectionId
    ) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    // ตรวจสอบว่ามีข้อมูล scores หรือไม่
    if (Object.keys(scores).length === 0) {
      alert("ไม่มีคะแนนที่จะส่ง กรุณาใส่คะแนนก่อน");
      return;
    }

    // สร้าง array ploCloData สำหรับเก็บข้อมูลที่จะส่งไปยัง API
    const ploCloData = [];

    // สร้างข้อมูล plo_clo จาก scores
    for (const key in scores) {
      if (scores[key] > 0) {
        // แยกค่า PLO_id และ CLO_id จาก key
        const parts = key.split("-");

        // ตรวจสอบว่ามีการแบ่งอย่างถูกต้อง
        if (parts.length !== 2) {
          console.error(`พบ key ที่ไม่ถูกต้อง: ${key}`);
          continue;
        }

        const ploId = parseInt(parts[0], 10);
        const cloId = parseInt(parts[1], 10);

        // ตรวจสอบความถูกต้องของ PLO_id
        if (isNaN(ploId)) {
          console.error(`พบค่า PLO_id ที่ไม่ถูกต้อง: ${ploId}`);
          continue;
        }

        // เพิ่มข้อมูลที่จะส่ง
        ploCloData.push({
          PLO_id: ploId, // ต้องใช้ชื่อฟิลด์ให้ตรงกับที่ backend ต้องการ
          CLO_id: cloId,
          course_id: parseInt(selectedCourseId, 10),
          section_id: parseInt(selectedSectionId, 10),
          semester_id: parseInt(selectedSemesterId, 10),
          year: parseInt(selectedYear, 10),
          weight: parseInt(scores[key], 10) || 0,
        });
      }
    }

    // ตรวจสอบว่ามีข้อมูลที่จะส่งหรือไม่
    if (ploCloData.length === 0) {
      alert(
        "ไม่มีคะแนนที่จะส่ง หรือข้อมูลมีรูปแบบไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง"
      );
      return;
    }

    // แสดง loading spinner
    setLoading(true);

    // สร้าง payload ในรูปแบบที่ server ต้องการ
    const payload = {
      scores: ploCloData, // เปลี่ยนจาก mappings เป็น scores
    };

    // แสดงข้อมูลที่จะส่งในคอนโซล
    console.log("กำลังส่งข้อมูล plo_clo:", JSON.stringify(payload, null, 2));

    // หลังจากบันทึกข้อมูลเรียบร้อยแล้ว ให้เรียกใช้ฟังก์ชันรีเฟรชข้อมูล
    axios.post("/plo_clo", payload).then((response) => {
      if (response.data && response.data.success) {
        // เพิ่มการเรียกใช้ฟังก์ชันดึงข้อมูลใหม่
        fetchPLOCLOMappings();
        alert("บันทึกการเชื่อมโยง PLO-CLO สำเร็จ!");
        setEditingScores(false);
      }
    });
  };

  const handlePostCourseCloScores = () => {
    console.log("กำลังบันทึกข้อมูลลงตาราง course_clo");

    // ตรวจสอบว่าตอนนี้อยู่ที่แท็บ Course-CLO Mapping จริงๆ
    if (activeTab !== 2) {
      console.error(
        "ฟังก์ชันนี้ควรถูกเรียกจากแท็บ Course-CLO Mapping เท่านั้น"
      );
      return;
    }

    // ตรวจสอบข้อมูลที่จำเป็น
    if (
      !selectedProgram ||
      !selectedSemesterId ||
      !selectedYear ||
      !selectedCourseId
    ) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    // ตรวจสอบว่ามีข้อมูล weightEachCourse หรือไม่
    if (!weightEachCourse || Object.keys(weightEachCourse).length === 0) {
      alert("ไม่พบข้อมูลน้ำหนัก CLO กรุณาตรวจสอบข้อมูลหรือโหลดข้อมูลใหม่");
      return;
    }

    // สร้าง array courseCloData สำหรับเก็บข้อมูลที่จะส่งไปยัง API
    const courseCloData = [];

    // สร้างข้อมูล course_clo จาก weightEachCourse
    // ค้นหา key ที่เริ่มต้นด้วย "a" + selectedCourseId
    const keyPrefix = `a${selectedCourseId}_`;

    Object.entries(weightEachCourse).forEach(([key, value]) => {
      // ตรวจสอบว่า key เป็นของ course ที่เลือกหรือไม่
      if (key.startsWith(keyPrefix)) {
        // ดึง clo_id จาก key หรือจากค่า value โดยตรง
        const cloId = value.clo_id;

        if (cloId) {
          // เพิ่มข้อมูลเฉพาะที่จำเป็น - เน้นเรื่องการอัพเดทค่า weight
          courseCloData.push({
            course_id: parseInt(selectedCourseId, 10),
            clo_id: parseInt(cloId, 10),
            section_id: parseInt(selectedSectionId, 10),
            semester_id: parseInt(selectedSemesterId, 10),
            year: parseInt(selectedYear, 10),
            weight: parseInt(value.weight, 10) || 0,
          });
        }
      }
    });

    // ตรวจสอบว่ามีข้อมูลที่จะส่งหรือไม่
    if (courseCloData.length === 0) {
      alert("ไม่มีน้ำหนัก CLO ที่จะส่ง กรุณาตรวจสอบข้อมูล");
      return;
    }

    // แสดง loading spinner
    setLoading(true);

    // สร้าง payload ในรูปแบบที่ server ต้องการ - เน้นการอัพเดทเท่านั้น
    const payload = {
      program_id: parseInt(selectedProgram, 10),
      semester_id: parseInt(selectedSemesterId, 10),
      section_id: parseInt(selectedSectionId, 10),
      year: parseInt(selectedYear, 10),
      scores: courseCloData,
    };

    console.log(
      "Sending course_clo payload:",
      JSON.stringify(payload, null, 2)
    );

    // ใช้ PATCH method เพื่อทำการอัพเดทเท่านั้น
    axios
      .patch("/course_clo/weight", payload)
      .then((response) => {
        console.log("API response for course_clo:", response.data);

        if (response.data && response.data.success) {
          // อัปเดตสถานะ
          alert("บันทึกการเชื่อมโยง Course-CLO สำเร็จ!");
          setEditingScores(false); // ออกจากโหมดแก้ไข
          refreshDataFromServer();
        } else {
          alert(response.data?.message || "เกิดข้อผิดพลาด");
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("เกิดข้อผิดพลาดในการส่งข้อมูล:", error);

        // แสดงรายละเอียดข้อผิดพลาด
        let errorMsg = `เกิดข้อผิดพลาด: ${error.message}`;
        if (error.response && error.response.data) {
          errorMsg += `\nรายละเอียด: ${JSON.stringify(error.response.data)}`;
        }
        alert(errorMsg);
        setLoading(false);
      });
  };

  const refreshDataAndMappings = async () => {
    // 1. ดึงข้อมูล CLO ใหม่
    try {
      if (
        selectedProgram &&
        selectedCourseId &&
        selectedSectionId &&
        selectedSemesterId &&
        selectedYear
      ) {
        console.log("รีเฟรชข้อมูล CLO...");

        const response = await axios.get("/course_clo", {
          params: {
            program_id: selectedProgram,
            course_id: selectedCourseId,
            semester_id: selectedSemesterId,
            section_id: selectedSectionId,
            year: selectedYear,
          },
        });

        console.log("CLO data refreshed:", response.data);
        const formattedCLOs = Array.isArray(response.data)
          ? response.data
          : [response.data].filter(Boolean);
        setCLOs(formattedCLOs);

        // 2. ดึงข้อมูล PLO-CLO mappings ใหม่
        console.log("รีเฟรชข้อมูล PLO-CLO mappings...");
        await fetchPLOCLOMappings();

        // 3. ดึงข้อมูล weights ใหม่ (ถ้าจำเป็น)
        console.log("รีเฟรชข้อมูล weights...");
        if (selectedProgram) {
          await fetchCourseWeights(selectedProgram);
        }
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการรีเฟรชข้อมูล:", error);
    }
  };

  // แก้ไขฟังก์ชัน handlePatchScores เพื่อตรวจสอบว่าอยู่ที่แท็บไหน
  const handlePatchScores = () => {
    // ตรวจสอบว่าตอนนี้อยู่ที่แท็บไหนอย่างชัดเจน
    if (activeTab === 3) {
      // ถ้าอยู่ที่แท็บ CLO-PLO Mapping (แท็บ 3)
      // ส่งข้อมูลไปยังตาราง plo_clo
      handlePatchPloCloScores();
    } else if (activeTab === 2) {
      // ถ้าอยู่ที่แท็บ Course-CLO Mapping (แท็บ 2)
      // ส่งข้อมูลไปยังตาราง course_clo
      handlePatchCourseCloScores();
    }
  };

  // เพิ่มฟังก์ชันใหม่สำหรับอัพเดทข้อมูลในตาราง plo_clo
  const handlePatchPloCloScores = () => {
    if (Object.keys(scores).length === 0) {
      alert("ไม่มีการเปลี่ยนแปลงคะแนน กรุณาแก้ไขคะแนนก่อน");
      return;
    }

    // เตรียมข้อมูล plo_clo
    let ploCloData = [];

    // วนลูปสร้างข้อมูล
    for (const key in scores) {
      if (scores[key] > 0) {
        const [ploId, cloId] = key.split("-");

        ploCloData = ploCloData.map((item) => ({
          PLO_id: item.plo_id || item.PLO_id, // ตรวจสอบและใช้ชื่อฟิลด์ที่ถูกต้อง
          CLO_id: item.clo_id || item.CLO_id,
          course_id: parseInt(selectedCourseId, 10),
          section_id: parseInt(selectedSectionId, 10),
          semester_id: parseInt(selectedSemesterId, 10),
          year: parseInt(selectedYear, 10),
          weight: parseInt(item.weight, 10) || 0,
        }));
      }
    }

    // แสดง loading spinner
    setLoading(true);

    // ข้อมูลที่จะส่ง
    const ploCloPayload = { mappings: ploCloData };

    // ส่งข้อมูล plo_clo
    axios
      .patch("/plo_clo", ploCloPayload)
      .then((response) => {
        console.log("ผลลัพธ์การอัพเดต plo_clo:", response.data);

        if (response.data && response.data.success) {
          alert("อัปเดตการเชื่อมโยง PLO-CLO สำเร็จ!");
          setEditingScores(false);
          refreshDataFromServer();
        } else {
          alert(response.data?.message || "เกิดข้อผิดพลาด");
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล:", error);
        let errorMsg = `เกิดข้อผิดพลาด: ${error.message}`;
        if (error.response && error.response.data) {
          errorMsg += `\nรายละเอียด: ${JSON.stringify(error.response.data)}`;
        }
        alert(errorMsg);
        setLoading(false);
      });
  };

  // เปลี่ยนชื่อฟังก์ชันเดิมเป็น handlePatchCourseCloScores
  const handlePatchCourseCloScores = () => {
    if (Object.keys(scores).length === 0) {
      alert("ไม่มีการเปลี่ยนแปลงคะแนน กรุณาแก้ไขคะแนนก่อน");
      return;
    }

    // เตรียมข้อมูล plo_clo
    const ploCloData = [];

    // เตรียมข้อมูล course_clo
    const courseCloData = [];

    // วนลูปสร้างข้อมูลทั้งสองส่วน
    for (const key in scores) {
      if (scores[key] > 0) {
        const [ploId, cloId] = key.split("-");

        // เพิ่มข้อมูล plo_clo
        ploCloData.push({
          clo_id: parseInt(cloId, 10),
          plo_id: parseInt(ploId, 10),
          program_id: parseInt(selectedProgram, 10),
          course_id: parseInt(selectedCourseId, 10), // เพิ่ม parameter ที่จำเป็น
          section_id: parseInt(selectedSectionId, 10), // เพิ่ม parameter ที่จำเป็น
          semester_id: parseInt(selectedSemesterId, 10), // เพิ่ม parameter ที่จำเป็น
          year: parseInt(selectedYear, 10), // เพิ่ม parameter ที่จำเป็น
          weight: 100, // CLO → PLO ใช้น้ำหนัก 100 เสมอ
        });

        // เพิ่มข้อมูล course_clo
        courseCloData.push({
          program_id: parseInt(selectedProgram, 10), // เพิ่ม program_id
          course_id: parseInt(selectedCourseId, 10),
          clo_id: parseInt(cloId, 10),
          section_id: parseInt(selectedSectionId, 10),
          semester_id: parseInt(selectedSemesterId, 10),
          year: parseInt(selectedYear, 10),
          program_id: parseInt(selectedProgram, 10), // เพิ่ม program_id ที่จำเป็น
          weight: parseInt(scores[key], 10) || 0,
        });
      }
    }

    // แสดง loading spinner
    setLoading(true);

    // ข้อมูลที่จะส่งอาจต้องการการห่อด้วย object
    const ploCloPayload = { mappings: ploCloData };
    const courseCloPayload = { mappings: courseCloData };

    // ส่งข้อมูล plo_clo ก่อน
    axios
      .patch("/plo_clo", ploCloPayload)
      .then(() => {
        // หลังจากปรับปรุง plo_clo สำเร็จ ให้ปรับปรุง course_clo ต่อ
        return axios.patch("/course_clo", courseCloPayload);
      })
      .then((response) => {
        console.log("API response:", response.data);

        if (response.data && response.data.success) {
          alert("อัปเดตคะแนนสำเร็จ!");
          setEditingScores(false);
          refreshDataFromServer();
        } else {
          alert(response.data?.message || "เกิดข้อผิดพลาด");
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("เกิดข้อผิดพลาดในการอัปเดตคะแนน:", error);
        let errorMsg = `เกิดข้อผิดพลาด: ${error.message}`;
        if (error.response && error.response.data) {
          errorMsg += `\nรายละเอียด: ${JSON.stringify(error.response.data)}`;
        }
        alert(errorMsg);
        setLoading(false);
      });
  };

  // แก้ไขฟังก์ชัน handleSavePloCloMappings
  const handleSavePloCloMappings = () => {
    // จากส่วน scores หรือตัวแปรที่เก็บการเลือก PLO
    // สร้างข้อมูลการเชื่อมโยง PLO-CLO
    const ploCloData = [];

    // ถ้าอยู่ในโหมดแก้ไข ให้ใช้ข้อมูลจาก scores
    if (editingScores) {
      Object.entries(scores).forEach(([key, value]) => {
        if (value > 0) {
          const [ploId, cloId] = key.split("-");

          ploCloData.push({
            clo_id: parseInt(cloId, 10),
            plo_id: parseInt(ploId, 10),
            program_id: parseInt(selectedProgram, 10),
            course_id: parseInt(selectedCourseId, 10),
            section_id: parseInt(selectedSectionId, 10),
            semester_id: parseInt(selectedSemesterId, 10),
            year: parseInt(selectedYear, 10),
            weight: parseInt(value, 10) || 100,
          });
        }
      });
    } else {
      // ถ้าไม่อยู่ในโหมดแก้ไข ให้ใช้ข้อมูลจาก mappings ที่มีอยู่
      mappings.forEach((mapping) => {
        if (mapping.PLO_id && mapping.weight > 0) {
          ploCloData.push({
            clo_id: parseInt(mapping.CLO_id, 10),
            plo_id: parseInt(mapping.PLO_id, 10),
            program_id: parseInt(selectedProgram, 10),
            course_id: parseInt(selectedCourseId, 10),
            section_id: parseInt(selectedSectionId, 10),
            semester_id: parseInt(selectedSemesterId, 10),
            year: parseInt(selectedYear, 10),
            weight: parseInt(mapping.weight, 10) || 100,
          });
        }
      });
    }

    console.log("ข้อมูล PLO-CLO ที่จะส่ง:", ploCloData);

    // ส่งข้อมูลไปยัง API
    axios
      .post("/plo_clo", { mappings: ploCloData })
      .then((response) => {
        console.log("ผลลัพธ์การบันทึก PLO-CLO:", response.data);
        alert("บันทึกการเชื่อมโยง PLO-CLO สำเร็จ!");

        // ออกจากโหมดแก้ไข
        setEditingScores(false);

        // รีเฟรชข้อมูล
        refreshDataFromServer();
      })
      .catch((error) => {
        console.error("เกิดข้อผิดพลาดในการบันทึก PLO-CLO:", error);
        alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
      });
  };

  // ฟังก์ชันเพิ่มรายวิชา
  const addCourse = async () => {
    try {
      const response = await axios.post("/api/program-course", {
        program_id: newCourse.program_id,
        course_id: newCourse.course_id,
        course_name: newCourse.course_name, // Send course_name data
        course_engname: newCourse.course_engname, // Send course_engname data
        semester_id: newCourse.semester_id,
        year: newCourse.year,
        section_id: newCourse.section,
      });

      // Update State to show new course
      setCourse([...course, response.data.data]);

      // Reset form
      setNewCourse({
        course_id: "",
        course_name: "",
        course_engname: "",
        program_id: "",
        year: "",
        section: "",
        semester_id: "",
      });

      alert("Course added successfully!");
    } catch (err) {
      console.error("Error adding course:", err);
    }
  };

  // ฟังก์ชันอัพเดตรายวิชา
  const updateCourse = async (updatedCourse) => {
    try {
      const response = await axios.put(
        `/program_course/${updatedCourse.course_id}`,
        {
          new_course_id: updatedCourse.new_course_id,
          course_name: updatedCourse.course_name,
          course_engname: updatedCourse.course_engname,
          program_id: updatedCourse.program_id,
          semester_id: updatedCourse.semester_id,
        }
      );

      // Refetch courses to ensure complete sync with backend
      if (newCourse.program_id && newCourse.semester_id) {
        fetchCourses();
      }

      setEditCourse({
        course_id: "",
        new_course_id: "",
        course_name: "",
        course_engname: "",
        program_id: "",
      });

      alert("Course updated successfully!");
    } catch (err) {
      console.error("Error updating course:", err);
      alert("Failed to update course. Please try again.");
    }
  };

  // ฟังก์ชันลบรายวิชา
  const deleteCourse = async (courseId, sectionId) => {
    try {
      const response = await axios.delete("/api/program-course", {
        params: {
          program_id: newCourse.program_id, // Selected program
          semester_id: newCourse.semester_id, // Selected semester
          course_id: courseId,
          section_id: sectionId,
        },
      });
      setCourse(
        course.filter((courseItem) => courseItem.course_id !== courseId)
      );

      alert("Course deleted successfully!");
    } catch (err) {
      console.error("Error deleting course:", err);
    }
  };

  // ฟังก์ชันแก้ไขรายวิชา
  const handleEditCourse = (courseItem) => {
    setEditCourse({
      course_id: courseItem.course_id,
      course_name: courseItem.course_name,
      course_engname: courseItem.course_engname,
      program_id: courseItem.program_id,
      year: courseItem.year,
      section: courseItem.section,
      semester_id: courseItem.semester_id,
    });
  };

  const handleFilterChange = (filterName, value) => {
    switch (filterName) {
      case "university":
        setSelectedUniversity(value);

        // รีเซ็ตค่าที่เกี่ยวข้องทั้งหมด
        setSelectedFaculty("");
        setSelectedProgram("");
        setSelectedYear("");
        setNewCourse((prev) => ({
          ...prev,
          semester_id: "",
        }));

        // รีเซ็ตข้อมูลการแสดงผล
        setCourse([]);
        setClos([]);
        setWeights({});
        setScores({});
        setShowMapping(false);

        // รีเซ็ตตัวเลือก Course และ Section สำหรับหน้า CLO
        setSelectedCourseId("");
        setSelectedSectionId("");
        setSelectedSemesterId("");
        break;

      case "faculty":
        setSelectedFaculty(value);

        // รีเซ็ตค่าที่เกี่ยวข้อง
        setSelectedProgram("");
        setSelectedYear("");
        setNewCourse((prev) => ({
          ...prev,
          semester_id: "",
        }));

        // รีเซ็ตข้อมูลการแสดงผล
        setCourse([]);
        setClos([]);
        setWeights({});
        setScores({});
        setShowMapping(false);

        // รีเซ็ตตัวเลือก Course และ Section สำหรับหน้า CLO
        setSelectedCourseId("");
        setSelectedSectionId("");
        setSelectedSemesterId("");
        break;

      case "program":
        setSelectedProgram(value);

        // รีเซ็ตค่าปีและภาคเรียน แต่ไม่ disable Year
        setSelectedYear("");
        setNewCourse((prev) => ({
          ...prev,
          semester_id: "",
        }));

        // รีเซ็ตข้อมูลการแสดงผล
        setCourse([]);
        setClos([]);
        setWeights({});
        setScores({});
        setShowMapping(false);

        // รีเซ็ตตัวเลือก Course และ Section สำหรับหน้า CLO
        setSelectedCourseId("");
        setSelectedSectionId("");
        setSelectedSemesterId("");
        break;

      case "year":
        setSelectedYear(value);

        // อัพเดทค่าในตัวแปร newCourse
        setNewCourse((prev) => ({
          ...prev,
          year: value,
          semester_id: "", // รีเซ็ตภาคเรียน เมื่อเปลี่ยนปี
        }));

        // รีเซ็ตข้อมูลการแสดงผล
        setCourse([]);
        setClos([]);
        setWeights({});
        setScores({});
        setShowMapping(false);

        // รีเซ็ตตัวเลือก Course และ Section สำหรับหน้า CLO
        setSelectedCourseId("");
        setSelectedSectionId("");
        setSelectedSemesterId("");
        break;
    }
  };

  // ฟังก์ชันสลับโหมดแก้ไข
  const handleEditToggle = () => {
    setEditingScores(!editingScores);
  };

  // ฟังก์ชันคำนวณผลรวม
  const calculateTotal = (courseId) => {
    // Return 0 if no CLO data
    if (!clos || clos.length === 0) return 0;

    return clos.reduce((sum, clo) => {
      const key = `${courseId}-${clo.CLO_id}`;
      if (editingScores) {
        return sum + (parseFloat(scores[key]) || 0); // Use scores in edit mode
      } else {
        return sum + (parseFloat(weights[key]) || 0); // Use weights otherwise
      }
    }, 0);
  };

  const calculateTotalForPLO = (ploId) => {
    // console.log(`กำลังคำนวณค่ารวมสำหรับ PLO_id: ${ploId}`);

    if (!ploId) return 0;

    let total = 0;

    if (editingScores) {
      // ใช้ scores ในโหมดแก้ไข
      CLOs.forEach((clo) => {
        const key = `${ploId}-${clo.CLO_id}`;
        const value = Number(scores[key] || 0);
        // console.log(`  key=${key}, value=${value}`);
        total += value;
      });
    } else {
      // ใช้ข้อมูลจาก mappings ที่มีอยู่
      const ploMappings = mappings.filter(
        (m) => m.PLO_id === ploId || m.plo_id === ploId
      );

      // console.log(`  พบ ${ploMappings.length} mappings สำหรับ PLO_id: ${ploId}`);

      total = ploMappings.reduce((sum, mapping) => {
        const value = Number(mapping.weight || 0);
        console.log(
          `    mapping: CLO_id=${mapping.CLO_id || mapping.clo_id}, weight=${value}`
        );
        return sum + value;
      }, 0);
    }

    // console.log(`  ผลรวม = ${total}`);
    return total || 0;
  };

  const saveEditAssignment = async () => {
    try {
      setSaving(true);

      // ตรวจสอบข้อมูลที่จำเป็น
      const requiredFields = [
        "assignment_name",
        "course_name",
        "section_id",
        "semester_id",
        "year",
      ];
      const missingFields = requiredFields.filter((field) => !editData[field]);

      if (missingFields.length > 0) {
        showAlert(
          `กรุณากรอกข้อมูลให้ครบถ้วน: ${missingFields.join(", ")}`,
          "error"
        );
        setSaving(false);
        return;
      }

      // เตรียมข้อมูลสำหรับส่งไป API
      const updateData = {
        program_id: parseInt(editData.program_id) || assignment.program_id,
        course_name: editData.course_name,
        section_id: parseInt(editData.section_id),
        semester_id: parseInt(editData.semester_id),
        year: parseInt(editData.year),
        assignment_name: editData.assignment_name,
        faculty_id: parseInt(editData.faculty_id) || assignment.faculty_id,
        university_id:
          parseInt(editData.university_id) || assignment.university_id,
      };

      console.log("ข้อมูลที่จะส่งไปอัพเดต:", updateData);

      // เรียกใช้ API สำหรับอัปเดตข้อมูล
      const response = await axios.put(
        `/api/update_assignment/${currentAssignmentId}`,
        updateData
      );

      console.log("ผลการอัปเดต Assignment:", response.data);

      if (response.data) {
        // อัปเดตข้อมูลใน state
        setAssignment((prev) => ({
          ...prev,
          ...updateData,
        }));

        // ปิดโหมดแก้ไข
        setIsEditing(false);
        showAlert("บันทึกการแก้ไขข้อมูล Assignment เรียบร้อยแล้ว", "success");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการบันทึกการแก้ไข:", error);
      const errorDetail = error.response?.data?.error || error.message;
      console.error("รายละเอียดข้อผิดพลาด:", errorDetail);
      showAlert("เกิดข้อผิดพลาดในการบันทึกการแก้ไข: " + errorDetail, "error");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    // รีเซ็ตข้อมูลการแก้ไขเป็นค่าเดิม
    setEditData({
      assignment_name: assignment.assignment_name || "",
      course_name: assignment.course_name || "",
      section_id: assignment.section_id || "",
      semester_id: assignment.semester_id || "",
      year: assignment.year || "",
      program_id: assignment.program_id || "",
      faculty_id: assignment.faculty_id || "",
      university_id: assignment.university_id || "",
    });

    // ปิดโหมดแก้ไข
    setIsEditing(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchPLOCLOMappings = async () => {
    // เพิ่มการล็อกข้อมูลที่ส่งไปยัง API
    console.log("กำลังเรียกใช้ fetchPLOCLOMappings ด้วยพารามิเตอร์:", {
      program_id: selectedProgram,
      course_id: selectedCourseId,
      section_id: selectedSectionId,
      semester_id: selectedSemesterId,
      year: selectedYear,
    });

    try {
      // ทำให้แน่ใจว่า URL และพารามิเตอร์ถูกต้อง
      const response = await axios.get("/plo_clo", {
        params: {
          program_id: selectedProgram,
          course_id: selectedCourseId,
          section_id: selectedSectionId,
          semester_id: selectedSemesterId,
          year: selectedYear,
        },
      });

      // ตรวจสอบข้อมูลที่ได้รับ
      console.log("ข้อมูล PLO-CLO mappings จาก API:", response.data);

      // ตรวจสอบโครงสร้างข้อมูล
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log("ตัวอย่างข้อมูล mapping แรก:", response.data[0]);
      } else {
        console.log("ไม่พบข้อมูล mappings จาก API");
      }

      // ตั้งค่า mappings
      const formattedMappings = Array.isArray(response.data)
        ? response.data
        : [response.data].filter(Boolean);

      setMappings(formattedMappings);

      // อัพเดต weights จาก mappings
      updateWeightsFromMappings(formattedMappings);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดใน fetchPLOCLOMappings:", error);
    }
  };

  useEffect(() => {
    // ตรวจสอบว่ามีข้อมูลใน mappings หรือไม่
    if (mappings.length > 0) {
      // สร้างข้อมูลสำหรับแสดงผลในตาราง
      console.log("จำนวน mappings:", mappings.length);

      // ตรวจสอบว่ามี PLO_id และ CLO_id ในแต่ละ mapping หรือไม่
      mappings.forEach((mapping, index) => {
        console.log(`Mapping ${index}:`, {
          PLO_id: mapping.PLO_id || mapping.plo_id,
          CLO_id: mapping.CLO_id || mapping.clo_id,
          weight: mapping.weight,
        });
      });
    }
  }, [mappings]);


  const updateWeightsFromMappings = (mappingData) => {
    console.log("กำลังอัพเดต weights จาก mappings:", mappingData);

    const updatedWeights = {};

    mappingData.forEach((mapping) => {
      // ใช้ PLO_id หรือ plo_id ตามที่มีในข้อมูล
      const ploId = mapping.PLO_id || mapping.plo_id;
      const cloId = mapping.CLO_id || mapping.clo_id;

      if (ploId && cloId) {
        const key = `${ploId}-${cloId}`;
        updatedWeights[key] = mapping.weight || 0;
        console.log(
          `กำหนดค่า weight สำหรับ key=${key} เป็น ${mapping.weight || 0}`
        );
      } else {
        console.error("ไม่พบ PLO_id หรือ CLO_id ในข้อมูล mapping:", mapping);
      }
    });

    console.log("weights ที่อัพเดตแล้ว:", updatedWeights);
    setWeights(updatedWeights);

    // อัพเดต scores ด้วยถ้าอยู่ในโหมดแก้ไข
    if (editingScores) {
      setScores(updatedWeights);
    }
  };

  async function fetchAllCourseByProgram(programId) {
    if (!programId) return;
    try {
      const response = await axios.get(`/api/program-course/detail`, {
        params: {
          program_id: selectedProgram,
          year: selectedYear,
        },
      });
      setCourseList(response.data);
    } catch (error) {
      console.error("Error fetching program courses:", error);
      setProgramCourseData({
        courses: [],
        sections: [],
        semesters: [],
        years: [],
      });
    }
  }

  const handleSaveEditAssignment = async () => {
    if (
      !selectedProgram ||
      !selectedCourseId ||
      !selectedSectionId ||
      !selectedSemesterId ||
      !selectedYear ||
      !assignmentName ||
      !currentAssignmentId
    ) {
      setTypeError("กรุณากรอกข้อมูลทั้งหมดก่อนบันทึก");
      return;
    }

    // Get the course name from the selected course ID
    const selectedCourseObj = programCourseData.courses.find(
      (c) => c.course_id.toString() === selectedCourseId.toString()
    );

    // If no course is found, show error
    if (!selectedCourseObj) {
      setTypeError("ไม่พบข้อมูลรายวิชาที่เลือก");
      return;
    }

    // แสดงสถานะกำลังบันทึก
    setLoading(true);

    try {
      // Construct the payload for updating assignment
      const updateData = {
        program_id: parseInt(selectedProgram, 10),
        course_name: selectedCourseObj.course_name,
        section_id: parseInt(selectedSectionId, 10),
        semester_id: parseInt(selectedSemesterId, 10),
        year: parseInt(selectedYear, 10),
        assignment_name: assignmentName,
        faculty_id: parseInt(selectedFaculty, 10),
        university_id: parseInt(selectedUniversity, 10),
      };

      console.log("ข้อมูลที่จะส่งไปอัพเดต:", updateData);

      // Call the API to update the assignment
      const response = await axios.put(
        `/api/update_assignment/${currentAssignmentId}`,
        updateData
      );

      console.log("ผลการอัพเดต Assignment:", response.data);

      if (response.data) {
        // แสดงข้อความสำเร็จ
        alert("บันทึกการแก้ไขข้อมูล Assignment สำเร็จ!");

        // ปิดโหมดแก้ไข
        setIsEditing(false);

        // เมื่อแก้ไขสำเร็จ ให้ไปยังขั้นตอนที่ 2
        setCurrentStep(2);

        // เตรียมข้อมูล homeworks
        if (currentAssignmentId) {
          // ใช้ข้อมูล Assignment ที่แก้ไขแล้ว
          const newHomework = {
            id: currentAssignmentId,
            name: assignmentName,
            scores: {},
          };

          // ถ้ามีข้อมูล CLO ให้เตรียมข้อมูลคะแนน
          if (CLOs && CLOs.length > 0) {
            CLOs.forEach((clo) => {
              newHomework.scores[clo.CLO_id || clo.clo_id] = 0;
            });
          }

          setHomeworks([newHomework]);
        }
      } else {
        // แสดงข้อความผิดพลาด
        alert(response.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (error) {
      console.error("Error updating Assignment:", error);

      // แสดงข้อความผิดพลาด
      alert(`เกิดข้อผิดพลาด: ${error.message || "ไม่สามารถบันทึกข้อมูลได้"}`);
    } finally {
      // ปิดสถานะกำลังบันทึก
      setLoading(false);
    }
  };

  // ฟังก์ชันจัดการวางข้อมูลโดยตรง
  const handleDirectPaste = (e) => {
    e.preventDefault();

    // รับข้อมูลจาก clipboard event
    const clipboardData = e.clipboardData || window.clipboardData;
    const text = clipboardData.getData("text");

    if (!text || text.trim() === "") {
      return;
    }

    // แยกข้อมูลตามบรรทัด
    const rows = text.trim().split(/\r?\n/);

    // ตรวจสอบว่ามีการใช้ tab หรือ comma เป็นตัวคั่น
    let delimiter = "\t"; // ค่าเริ่มต้นคือ tab
    if (rows[0].includes(",") && !rows[0].includes("\t")) {
      delimiter = ",";
    }

    // แปลงข้อมูลเป็น array ของ objects
    const parsedData = rows.map((row) => {
      const columns = row.split(delimiter);
      return {
        program_id: parseInt(selectedProgram),
        course_id: parseInt(selectedCourseId),
        semester_id: parseInt(selectedSemesterId),
        section_id: parseInt(selectedSectionId),
        year: parseInt(selectedYear),
        CLO_code: columns[0] || "",
        CLO_name: columns[1] || "",
        CLO_engname: columns[2] || "",
      };
    });

    // อัปเดต excelData state
    setExcelData(parsedData);
    console.log("Directly Pasted Data:", parsedData);

    // ปิดพื้นที่วางข้อมูล
    setShowPasteArea(false);
  };

  const handlePasteButtonClick = async () => {
    try {
      // เปิดพื้นที่วางข้อมูล
      setShowPasteArea(true);

      // อ่านข้อมูลจาก Clipboard
      const text = await navigator.clipboard.readText();

      // ตรวจสอบว่าข้อมูลมีหรือไม่
      if (!text || text.trim() === "") {
        alert("ไม่พบข้อมูลใน clipboard โปรดคัดลอกข้อมูลก่อนกดปุ่ม Paste Data");
        return;
      }

      // แยกข้อมูลตามบรรทัด
      const rows = text.trim().split(/\r?\n/);

      // ตรวจสอบว่ามีการใช้ tab หรือ comma เป็นตัวคั่น
      let delimiter = "\t"; // ค่าเริ่มต้นคือ tab
      if (rows[0].includes(",") && !rows[0].includes("\t")) {
        delimiter = ",";
      }

      // แปลงข้อมูลเป็น array ของ objects
      const parsedData = rows.map((row) => {
        const columns = row.split(delimiter);
        return {
          program_id: parseInt(selectedProgram),
          course_id: parseInt(selectedCourseId),
          semester_id: parseInt(selectedSemesterId),
          section_id: parseInt(selectedSectionId),
          year: parseInt(selectedYear),
          CLO_code: columns[0] || "",
          CLO_name: columns[1] || "",
          CLO_engname: columns[2] || "",
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

  // ฟังก์ชันอัพโหลดข้อมูล Excel
  const handleFileUpload = async (e) => {
    let fileTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    let selectedFile = e.target.files[0];

    if (selectedFile) {
      if (fileTypes.includes(selectedFile.type)) {
        setTypeError(null);
        let reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const data = event.target.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            // Find the selected program
            const programData = programs.find(
              (program) =>
                program.program_id.toString() === selectedProgram.toString()
            );

            if (!programData) {
              console.error("Selected program not found:", selectedProgram);
              alert(
                "Error: Selected program not found. Please select a valid program."
              );
              return;
            }

            // Ensure all required fields are present
            const updatedData = jsonData.map((row) => ({
              program_id: parseInt(programData.program_id),
              course_id: parseInt(selectedCourseId),
              semester_id: parseInt(selectedSemesterId),
              year: parseInt(selectedYear),
              CLO_code: row.CLO_code || "DEFAULT_CODE", // ให้ค่าเริ่มต้นแทนค่าว่าง
              CLO_name: row.CLO_name || "DEFAULT_NAME", // ให้ค่าเริ่มต้นแทนค่าว่าง
              CLO_engname: row.CLO_engname || "DEFAULT_ENG_NAME", // ให้ค่าเริ่มต้นแทนค่าว่าง
            }));

            // Validate that all required fields are present in each row
            const invalidRows = updatedData.filter(
              (row) =>
                !row.program_id ||
                !row.course_id ||
                !row.semester_id ||
                !row.year ||
                !row.CLO_code
            );

            if (invalidRows.length > 0) {
              console.error("Invalid rows found:", invalidRows);
              alert(
                `Error: ${invalidRows.length} rows are missing required fields. Please check your Excel data.`
              );
              return;
            }

            setExcelData(updatedData); // อัปเดตข้อมูลใน State
          } catch (error) {
            console.error("Error reading file:", error);
            alert("Error processing file: " + error.message);
          }
        };
        reader.onerror = (error) => {
          console.error("Error reading file:", error);
          alert("Error reading file: " + error.message);
        };
        reader.readAsBinaryString(selectedFile);
      } else {
        setTypeError("Please select only Excel file types");
        alert("Please select only Excel file types");
      }
    } else {
      console.log("Please select your file");
    }
  };

  async function fetchFilteredCourseClo() {
    try {
      const response = await axios.get("/api/course-clo/filter", {
        params: {
          program_id: selectedProgram,
          course_id: selectedCourseId,
          semester_id: selectedSemesterId,
          year: selectedYear,
        },
      });
      setSelectedCourseClo(response.data);
    } catch (error) {
      console.error("Error refreshing CLOs: ", error);
    }
  }

  // ฟังก์ชันอัพโหลดข้อมูล
  const handleUploadPrevious = async () => {
    if (!previousYearCLOs || previousYearCLOs.length === 0) {
      console.error("No data to upload");
      alert("No data to upload. Please paste or upload data first.");
      return;
    }

    // Additional validation before sending to server
    if (
      !selectedProgram ||
      !selectedCourseId ||
      !selectedSemesterId ||
      !selectedYear
    ) {
      alert(
        "Please select Program, Course, Section, Semester, and Year before uploading."
      );
      return;
    }

    // Check each row for required fields
    const missingFields = previousYearCLOs.some(
      (row) =>
        !row.course_id ||
        !row.semester_id ||
        !row.year ||
        !row.CLO_code ||
        !row.CLO_name ||
        !row.CLO_engname
    );

    if (missingFields) {
      alert("Some rows are missing required fields. Please check your data.");
      return;
    }

    try {
      const response = await axios.post(
        "/api/clo-mapping/excel",
        previousYearCLOs
      );
      console.log(response);
      if (
        selectedCourseId &&
        selectedSemesterId &&
        selectedYear &&
        selectedProgram
      ) {
        fetchFilteredCourseClo();
      }
      setShowPreviousYearCLOsModal(false);
    } catch (error) {
      console.error("Error : ", error);
      alert("An error occurred: " + error.message);
    }
  };

  const handleUploadButtonClick = () => {
    if (!excelData || excelData.length === 0) {
      console.error("No data to upload");
      alert("No data to upload. Please paste or upload data first.");
      return;
    }

    // Additional validation before sending to server
    if (
      !selectedProgram ||
      !selectedCourseId ||
      !selectedSemesterId ||
      !selectedYear
    ) {
      alert(
        "Please select Program, Course, Section, Semester, and Year before uploading."
      );
      return;
    }

    // Check each row for required fields
    const missingFields = excelData.some(
      (row) =>
        !row.program_id ||
        !row.course_id ||
        !row.semester_id ||
        !row.year ||
        !row.CLO_code ||
        !row.CLO_name ||
        !row.CLO_engname
    );

    if (missingFields) {
      alert("Some rows are missing required fields. Please check your data.");
      return;
    }

    axios
      .post("/api/clo-mapping/excel", excelData)
      .then((response) => {
        console.log("Success:", response.data);
        alert("Data Uploaded Successfully!");
        setExcelData(null); // ล้างข้อมูลหลังจากอัปโหลดสำเร็จ

        // Refresh CLOs after successful upload
        if (
          selectedCourseId &&
          selectedSemesterId &&
          selectedYear &&
          selectedProgram
        ) {
          fetchFilteredCourseClo();
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred: " + error.message);
      });
  };

  // ฟังก์ชันแก้ไข CLO
  const handleEditClo = (cloId) => {
    const cloToEdit = CLOs.find((clo) => clo.CLO_id === cloId);
    if (cloToEdit) {
      setEditClo(cloToEdit); // Set the CLO to edit
      setEditCloName(cloToEdit.CLO_name || ""); // Initialize CLO name
      setEditCloEngName(cloToEdit.CLO_engname || ""); // Initialize CLO English name
      setEditCloCode(cloToEdit.CLO_code || "");
      setShowEditModal(true); // Show the modal
    }
  };

  const saveScores = async () => {
    // เช็คว่ามีนักเรียนที่จะบันทึกคะแนนหรือไม่
    if (!importedStudents || importedStudents.length === 0) {
      alert("ไม่พบรายชื่อนักเรียนที่จะบันทึกคะแนน");
      return;
    }

    try {
      // แสดงสถานะกำลังบันทึก
      setSaving(true);

      // สร้างข้อมูลสำหรับส่งไป API
      const scoreData = [];

      // สร้างข้อมูลคะแนนสำหรับแต่ละนักเรียน
      importedStudents.forEach((student) => {
        // ดูว่ามีคะแนนของนักเรียนคนนี้หรือไม่
        const studentScores = scores[student.student_id] || {};

        // สำหรับแต่ละ CLO ในงานนี้
        CLOs.forEach((clo) => {
          // ดึงค่า assignment_clo_id จาก CLO
          const assignmentCloId = clo.assignment_clo_id;
          if (assignmentCloId) {
            // เพิ่มข้อมูลคะแนน
            scoreData.push({
              student_id: student.student_id,
              assignment_clo_id: assignmentCloId,
              score: studentScores[assignmentCloId] || 0,
            });
          }
        });
      });

      // ส่งข้อมูลไป API
      const response = await axios.post("/api/save_scores", {
        scores: scoreData,
      });

      console.log("ผลการบันทึกคะแนน:", response.data);

      if (response.data && response.data.success) {
        alert("บันทึกคะแนนเรียบร้อยแล้ว");
      } else {
        alert(response.data?.message || "เกิดข้อผิดพลาดในการบันทึกคะแนน");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการบันทึกคะแนน:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };
  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // ดึงข้อมูลจาก sheet แรก
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log("ข้อมูลที่นำเข้าจาก Excel:", jsonData);

        // ตรวจสอบรูปแบบข้อมูล
        if (jsonData.length === 0) {
          alert("ไม่พบข้อมูลในไฟล์ Excel");
          return;
        }

        // ตรวจสอบว่ามีคอลัมน์ที่จำเป็นครบหรือไม่
        const requiredColumns = ["student_id", "name"];
        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter(
          (col) => !(col in firstRow)
        );

        if (missingColumns.length > 0) {
          alert(
            `ไฟล์ Excel ไม่มีคอลัมน์ที่จำเป็น: ${missingColumns.join(", ")}`
          );
          return;
        }

        // แปลงข้อมูลและอัปเดต state
        const processedData = jsonData.map((row) => ({
          student_id: String(row.student_id),
          name: row.name,
        }));

        setImportedStudents(processedData);
        alert(`นำเข้าข้อมูลนักเรียน ${processedData.length} คนสำเร็จ`);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการอ่านไฟล์ Excel:", error);
        alert(`เกิดข้อผิดพลาดในการอ่านไฟล์: ${error.message}`);
      }
    };

    reader.onerror = (error) => {
      console.error("เกิดข้อผิดพลาดในการอ่านไฟล์:", error);
      alert(`เกิดข้อผิดพลาดในการอ่านไฟล์: ${error.message}`);
    };

    reader.readAsArrayBuffer(file);
  };

  // เพิ่มฟังก์ชันสำหรับดาวน์โหลดเทมเพลต Excel
  const downloadExcelTemplate = () => {
    // สร้างเทมเพลตสำหรับใช้นำเข้าข้อมูลนักเรียน
    const template = [
      {
        student_id: "รหัสนักศึกษา",
        name: "ชื่อ-นามสกุล",
      },
    ];

    // สร้าง workbook และ worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);

    // เพิ่ม worksheet ลงใน workbook
    XLSX.utils.book_append_sheet(wb, ws, "นำเข้านักเรียน");

    // บันทึกไฟล์
    XLSX.writeFile(wb, "template_import_students.xlsx");
  };

  // ฟังก์ชันบันทึกการแก้ไข CLO
  const handleSaveClo = async () => {
    if (!editClo) return;

    // หา program_id จากโปรแกรมที่เลือก
    const selectedProgramData = programs.find(
      (program) => program.program_id.toString() === selectedProgram.toString()
    );

    if (!selectedProgramData) {
      console.error("Program not found:", selectedProgram);
      alert("Please select a valid program.");
      return;
    }

    // Validation checks
    if (!editCloCode) {
      alert("CLO Code cannot be empty.");
      return;
    }

    if (!editCloName) {
      alert("CLO Name cannot be empty.");
      return;
    }

    if (!editCloEngName) {
      alert("CLO English Name cannot be empty.");
      return;
    }

    const updatedCLO = {
      clo_id: editClo.CLO_id,
      program_id: selectedProgramData.program_id,
      course_id: selectedCourseId,
      semester_id: selectedSemesterId,
      section_id: selectedSectionId,
      year: selectedYear,
      CLO_name: editCloName.trim(),
      CLO_engname: editCloEngName.trim(),
      CLO_code: editCloCode.trim(), // เพิ่ม CLO_code ในการอัปเดต
    };

    try {
      const response = await axios.put("/course_clo", updatedCLO);

      if (response.data && response.data.success) {
        // Update the CLOs in the state with all fields
        const updatedCLOs = CLOs.map((clo) =>
          clo.CLO_id === editClo.CLO_id
            ? {
              ...clo,
              CLO_name: editCloName.trim(),
              CLO_engname: editCloEngName.trim(),
              CLO_code: editCloCode.trim(), // เพิ่ม CLO_code ในการอัปเดตที่แสดงในตาราง
            }
            : clo
        );

        setCLOs(updatedCLOs);

        // Close the modal
        setShowEditModal(false);

        // Optional: Show success message
        alert("CLO updated successfully!");
      } else {
        // Handle error response from server
        console.error("Failed to update CLO:", response.data);
        alert(
          `Failed to update CLO: ${response.data?.message || "Unknown error"}`
        );
      }
    } catch (err) {
      console.error("Error updating CLO:", err);
      alert("An error occurred while updating the CLO.");
    }
  };

  // ฟังก์ชันลบ CLO
  const handleDeleteClo = async (cloId, courseId, semesterId, year) => {
    if (!cloId || !courseId || !semesterId || !year) {
      console.error("Missing required fields");
      alert("Missing required fields. Please check your data.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this CLO?")) {
      try {
        // /api/course-clo/filter?course_id=3051234&semester_id=1&year=2024&clo_id=25
        const response = await axios.delete(
          `/api/course-clo/filter?course_id=${courseId}&semester_id=${semesterId}&year=${year}&clo_id=${cloId}`
        );
      } catch (error) {
        console.error("Error while deleting CLO:", error);
        alert("An error occurred while deleting the CLO.");
      }
      fetchFilteredCourseClo();
    }
  };

  // ฟังก์ชันเพิ่ม CLO ใหม่
  const handleAddClo = async () => {
    // Find the selected program data
    const selectedProgramData = programs.find(
      (program) => program.program_id.toString() === selectedProgram.toString()
    );

    // Comprehensive validation
    if (!selectedProgramData) {
      alert("Please select a valid program.");
      return;
    }

    if (!selectedCourseId) {
      alert("Please select a course.");
      return;
    }

    if (!selectedSemesterId) {
      alert("Please select a semester.");
      return;
    }

    if (!selectedYear) {
      alert("Please select a year.");
      return;
    }

    if (!editCloCode) {
      alert("Please enter a CLO code.");
      return;
    }

    if (!editCloName) {
      alert("Please enter a CLO name.");
      return;
    }

    if (!editCloEngName) {
      alert("Please enter a CLO English name.");
      return;
    }

    // Prepare the data for submission
    const newClo = {
      program_id: parseInt(selectedProgramData.program_id),
      course_id: parseInt(selectedCourseId),
      semester_id: parseInt(selectedSemesterId),
      year: parseInt(selectedYear),
      CLO_code: editCloCode.trim(),
      CLO_name: editCloName.trim(),
      CLO_engname: editCloEngName.trim(),
    };

    try {
      const response = await axios.post("/api/clo-mapping", newClo);
      setEditCloCode("");
      setEditCloName("");
      setEditCloEngName("");
      setShowAddModal(false);
      alert("CLO added successfully!");
      fetchFilteredCourseClo();
    } catch (error) {
      console.error(newClo);
      console.error("Error adding CLO:", error);
      alert("An error occurred while adding the CLO");
    }
  };
  const styles = {
    heading: {
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "16px",
    },
    assignmentInfo: {
      backgroundColor: "#f5f5f5",
      padding: "12px",
      borderRadius: "4px",
      marginBottom: "20px",
    },
    buttonContainer: {
      display: "flex",
      gap: "10px",
      marginBottom: "20px",
    },
    editButton: {
      backgroundColor: "#ffc107",
      color: "white",
      border: "none",
      padding: "8px 16px",
      borderRadius: "4px",
      cursor: "pointer",
    },
    primaryButton: {
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      padding: "8px 16px",
      borderRadius: "4px",
      cursor: "pointer",
    },
    primaryButtonDisabled: {
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      padding: "8px 16px",
      borderRadius: "4px",
      opacity: "0.65",
      cursor: "not-allowed",
    },
    secondaryButton: {
      backgroundColor: "#6c757d",
      color: "white",
      border: "none",
      padding: "8px 16px",
      borderRadius: "4px",
      cursor: "pointer",
    },
    outlineButton: {
      backgroundColor: "transparent",
      color: "#007bff",
      border: "1px solid #007bff",
      padding: "8px 16px",
      borderRadius: "4px",
      cursor: "pointer",
    },
    cancelButton: {
      backgroundColor: "#6c757d",
      color: "white",
      border: "none",
      padding: "8px 16px",
      borderRadius: "4px",
      cursor: "pointer",
    },
    hidden: {
      display: "none",
    },
    editForm: {
      padding: "20px",
      backgroundColor: "#f8f9fa",
      borderRadius: "8px",
      marginBottom: "24px",
    },
    formGroup: {
      marginBottom: "16px",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "bold",
    },
    input: {
      width: "100%",
      padding: "8px 12px",
      borderRadius: "4px",
      border: "1px solid #ced4da",
      fontSize: "16px",
    },
  };
  // ฟังก์ชันดึงข้อมูล CLO ปีก่อนหน้า
  const fetchPreviousYearCLOs = async () => {
    if (
      !selectedProgram ||
      !selectedCourseId ||
      !selectedSemesterId ||
      !selectedYear
    ) {
      alert("กรุณาเลือกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      const response = await axios.get("/api/course-clo/filter", {
        params: {
          program_id: selectedProgram,
          course_id: selectedCourseId,
          semester_id: selectedSemesterId,
          section_id: selectedSectionId,
          year: selectedYear - 1,
        },
      });
      const formattedCLOs = Array.isArray(response.data)
        ? response.data
        : [response.data].filter(Boolean);

      if (formattedCLOs.length > 0) {
        setPreviousYearCLOs(formattedCLOs);
        setShowPreviousYearCLOsModal(true); // Add this line to show the modal
        alert(`พบ ${formattedCLOs.length} CLO สำหรับปีที่เลือก`);
      } else {
        alert("ไม่พบข้อมูล CLO");
      }
    } catch (error) {
      console.error("Error fetching CLOs:", error);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูล CLO");
    }
  };

  // รีเซ็ตคะแนนของการบ้าน
  const resetHomeworkScores = (clos) => {
    const updatedHomeworks = homeworks.map((hw) => {
      const newScores = {};
      clos.forEach((clo) => {
        // ใช้ CLO_id ตามโครงสร้างที่ API ส่งกลับมา
        newScores[clo.CLO_id] = 0;
      });

      return {
        ...hw,
        scores: newScores,
      };
    });

    setHomeworks(updatedHomeworks);
    setValidationErrors({});
  };
  const fetchAssignmentCLOs = async (assignmentId) => {
    try {
      const response = await axios.get(
        `/api/get_assignment_detail/${assignmentId}`
      );

      if (response.data && response.data.success) {
        // ตั้งค่า CLOs จากข้อมูลที่ได้รับ
        setCLOs(response.data.clos || []);

        // ตั้งค่า weights สำหรับแต่ละ CLO
        const weights = {};
        if (response.data.clos && Array.isArray(response.data.clos)) {
          response.data.clos.forEach((clo) => {
            weights[clo.clo_id] = clo.weight || 0;
          });
        }
        setCloWeights(weights);

        return response.data.clos || [];
      }

      return [];
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล CLO ของ Assignment:", error);
      return [];
    }
  };

  const validateCloScores = () => {
    const errors = {};

    // ถ้าไม่มีข้อมูล CLO ให้ผ่านการตรวจสอบไปเลย
    if (!CLOs || CLOs.length === 0) {
      return true;
    }

    // ตรวจสอบแต่ละ CLO
    CLOs.forEach((clo) => {
      // CLO ID อาจเป็น CLO_id หรือ clo_id ขึ้นอยู่กับรูปแบบข้อมูล
      const cloId = clo.CLO_id || clo.clo_id;
      if (!cloId) return; // ข้ามถ้าไม่มี ID

      // ดึงน้ำหนักจาก state cloWeights
      const maxWeight = cloWeights[cloId] || 0;

      // คำนวณคะแนนรวมสำหรับ CLO นี้จากทุก homework
      const total = homeworks.reduce((sum, hw) => {
        return sum + (Number(hw.scores[cloId]) || 0);
      }, 0);

      // ตรวจสอบว่าคะแนนรวมไม่เกินค่า weight สูงสุด
      if (total > maxWeight) {
        // ดึงรหัส CLO (CLO_code) สำหรับการแสดงข้อความ
        const cloCode = clo.CLO_code || `CLO${cloId}`;
        errors[cloId] =
          `คะแนนรวม (${total}) เกินกว่าน้ำหนักที่กำหนด (${maxWeight}) สำหรับ ${cloCode}`;
      }
    });

    // ตั้งค่าข้อความแสดงข้อผิดพลาด
    setValidationErrors(errors);

    // ถ้าไม่มีข้อผิดพลาด (errors เป็น object ว่าง) จะคืนค่า true
    return Object.keys(errors).length === 0;
  };

  const handleSaveStep1 = () => {
    if (
      !selectedProgram ||
      !selectedCourseId ||
      !selectedSectionId ||
      !selectedSemesterId ||
      !selectedYear ||
      !assignmentName
    ) {
      setTypeError("กรุณากรอกข้อมูลทั้งหมดก่อนบันทึก");
      return;
    }

    // Get the course name from the selected course ID
    const selectedCourseObj = programCourseData.courses.find(
      (c) => c.course_id.toString() === selectedCourseId.toString()
    );

    // If no course is found, show error
    if (!selectedCourseObj) {
      setTypeError("ไม่พบข้อมูลรายวิชาที่เลือก");
      return;
    }

    // Construct the payload exactly as the backend expects
    const newAssignment = {
      program_id: parseInt(selectedProgram, 10),
      course_name: selectedCourseObj.course_name, // Use the actual course_name, not course_id
      section_id: parseInt(selectedSectionId, 10),
      semester_id: parseInt(selectedSemesterId, 10),
      year: parseInt(selectedYear, 10),
      assignment_name: assignmentName,
      faculty_id: parseInt(selectedFaculty, 10),
      university_id: parseInt(selectedUniversity, 10),
    };

    console.log("Sending data to API:", newAssignment);
    setLoading(true);

    // Send the data to the API
    axios
      .post("/api/add_assignment", newAssignment)
      .then((response) => {
        console.log("Assignment API response:", response.data);
        if (
          response.data &&
          (response.data.success ||
            response.data.message === "Assignment บันทึกสำเร็จ")
        ) {
          alert("บันทึก Assignment สำเร็จ!");

          // Go to Step 2 after successful save
          setCurrentStep(2);

          // Create a new homework from the saved assignment
          if (response.data.assignment_id) {
            const newHomework = {
              id: response.data.assignment_id,
              name: assignmentName,
              scores: {},
            };

            // If CLOs have data, set initial scores to 0
            if (CLOs && CLOs.length > 0) {
              CLOs.forEach((clo) => {
                const cloId = clo.CLO_id || clo.clo_id;
                newHomework.scores[cloId] = 0;
              });
            }

            setHomeworks([newHomework]);
            setCurrentAssignmentId(response.data.assignment_id);
          }
        } else {
          alert(response.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error saving Assignment:", error);

        // Show detailed error message
        let errorMessage = `เกิดข้อผิดพลาด: ${error.message}`;
        if (error.response) {
          errorMessage += `\nStatus: ${error.response.status}`;
          errorMessage += `\nResponse data: ${JSON.stringify(error.response.data)}`;
        }

        alert(errorMessage);
        setLoading(false);
      });
  };

  const handleSaveAssignment = () => {
    // ตรวจสอบว่ามีรหัส Assignment หรือไม่
    if (!currentAssignmentId) {
      setTypeError("กรุณาเลือก Assignment ก่อนบันทึก");
      return;
    }

    // ตรวจสอบความถูกต้องของคะแนน (ข้ามได้ถ้าไม่มี CLO)
    if (CLOs.length > 0) {
      const isValid = validateCloScores();
      if (!isValid) {
        return; // ถ้ามีข้อผิดพลาด ไม่ต้องทำต่อ
      }
    } else {
      // ถ้าไม่มี CLO ให้แจ้งเตือนผู้ใช้
      alert(
        "ไม่พบข้อมูล CLO สำหรับ Assignment นี้ กรุณาเพิ่ม CLO ก่อนบันทึกคะแนน"
      );
      return;
    }

    // ตรวจสอบว่ามี homeworks หรือไม่
    if (!homeworks || homeworks.length === 0) {
      alert("ไม่พบข้อมูล Assignment ที่จะบันทึก");
      return;
    }

    // เตรียมข้อมูลสำหรับส่งไป API
    const prepareDataForApi = () => {
      const apiData = [];

      homeworks.forEach((hw) => {
        // สำหรับแต่ละ CLO ใน homework
        for (const cloId in hw.scores) {
          if (Object.prototype.hasOwnProperty.call(hw.scores, cloId)) {
            const score = Number(hw.scores[cloId]) || 0;
            const weight = cloWeights[cloId] || 0;

            apiData.push({
              assignment_id: hw.id,
              item: {
                clo_id: cloId, // ตรงนี้สำคัญ ต้องส่ง clo_id ในรูปแบบนี้ตามที่ API ต้องการ
              },
              score: score,
              weight: weight,
            });
          }
        }
      });

      return apiData;
    };

    // บันทึกข้อมูล
    const saveData = async () => {
      try {
        const dataToSend = prepareDataForApi();

        console.log("ข้อมูลที่จะส่งไป API:", {
          data: dataToSend,
        });

        // แสดงสถานะกำลังบันทึก
        setLoading(true);

        const response = await axios.post("/api/save_assignment_clo", {
          data: dataToSend,
        });

        console.log("ผลการบันทึก:", response.data);

        // แสดงข้อความสำเร็จ
        alert("บันทึกคะแนน CLO สำเร็จ!");

        // ไปยัง Step 3 หลังจากบันทึกสำเร็จ
        setCurrentStep(3);

        // ปิดสถานะกำลังบันทึก
        setLoading(false);
      } catch (error) {
        console.error("Error saving assignment CLO scores:", error);
        alert(`เกิดข้อผิดพลาด: ${error.message || "บันทึกข้อมูลไม่สำเร็จ"}`);
        setLoading(false);
      }
    };

    saveData();
  };

  // ฟังก์ชันเปลี่ยนคะแนนของการบ้านและ CLO
  const handleScoreChange = (homeworkId, cloId, value) => {
    // Convert to number or default to 0 if empty
    const numValue = value === "" ? 0 : Number.parseInt(value, 10);

    // Update the homework scores
    const updatedHomeworks = homeworks.map((hw) => {
      if (hw.id === homeworkId) {
        return {
          ...hw,
          scores: {
            ...hw.scores,
            [cloId]: numValue,
          },
        };
      }
      return hw;
    });

    setHomeworks(updatedHomeworks);

    // Validate scores after change
    setTimeout(() => validateCloScores(), 100);
  };

  // ฟังก์ชันคำนวณคะแนนรวมสำหรับ CLO เฉพาะ
  const calculateCloTotal = (cloId) => {
    return homeworks.reduce((total, hw) => {
      return total + (hw.scores[cloId] || 0);
    }, 0);
  };

  // ฟังก์ชันไปยังขั้นตอนถัดไป
  const goToNextStep = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };

  // ฟังก์ชันไปยังขั้นตอนก่อนหน้า
  const goToPreviousStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  // ฟังก์ชันไปจาก Step 2 ไปยัง Step 3
  const goToStep3 = () => {
    if (homeworks.length === 0) {
      alert("กรุณาสร้างการบ้านก่อนนำเข้ารายชื่อนักเรียน");
      return;
    }

    // Check if there are unsaved changes in Step 2
    // If all validations pass, go to step 3
    setCurrentStep(3);
  };

  // ฟังก์ชันสำหรับดูสีพื้นหลังตามค่าคะแนน
  const getScoreColor = (score) => {
    if (score === 0) return "";
    if (score < 5) return "bg-danger text-white";
    if (score < 8) return "bg-warning";
    return "bg-success text-white";
  };

  // ฟังก์ชันอัพโหลดไฟล์ Excel
  const handleExcelFileUpload = (e) => {
    const file = e.target.files[0];
    setImportErrors([]);
    setImportSuccess("");

    if (!file) return;

    // Reset previously imported data
    setExcelData(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          setImportErrors(["ไม่พบข้อมูลในไฟล์ Excel"]);
          return;
        }

        // Validate required columns
        const firstRow = jsonData[0];
        const hasStudentId =
          "student_id" in firstRow || "รหัสนักศึกษา" in firstRow;
        const hasName =
          "name" in firstRow ||
          "ชื่อ-นามสกุล" in firstRow ||
          "ชื่อ" in firstRow;

        if (!hasStudentId || !hasName) {
          setImportErrors([
            "ไฟล์ Excel ต้องมีคอลัมน์ 'student_id' (หรือ 'รหัสนักศึกษา') และ 'name' (หรือ 'ชื่อ-นามสกุล', 'ชื่อ')",
          ]);
          return;
        }

        // Process and normalize data
        const processedData = jsonData
          .map((row) => {
            // Try to find student_id in various possible column names
            const studentId =
              row.student_id || row.รหัสนักศึกษา || row["รหัสนักศึกษา"];
            // Try to find name in various possible column names
            const name = row.name || row["ชื่อ-นามสกุล"] || row.ชื่อ;

            return {
              student_id: studentId ? String(studentId).trim() : "",
              name: name ? String(name).trim() : "",
            };
          })
          .filter((student) => student.student_id && student.name);

        if (processedData.length === 0) {
          setImportErrors(["ไม่พบข้อมูลที่ถูกต้องในไฟล์ Excel"]);
          return;
        }

        setExcelData(processedData);
      } catch (error) {
        console.error("Error reading Excel file:", error);
        setImportErrors([
          "เกิดข้อผิดพลาดในการอ่านไฟล์ Excel: " + error.message,
        ]);
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      setImportErrors(["เกิดข้อผิดพลาดในการอ่านไฟล์: " + error.message]);
    };

    reader.readAsArrayBuffer(file);
  };

  // ฟังก์ชันนำเข้านักศึกษาจาก Excel
  const handleImportFromExcel = () => {
    if (!excelData || excelData.length === 0) {
      setImportErrors(["ไม่พบข้อมูลที่จะนำเข้า"]);
      return;
    }

    setImportErrors([]);
    setImportSuccess("");

    // Validate data
    const errors = [];
    excelData.forEach((student, index) => {
      if (!student.student_id) {
        errors.push(`แถวที่ ${index + 1}: ไม่พบรหัสนักศึกษา`);
      } else if (!/^\d{8,13}$/.test(student.student_id)) {
        errors.push(
          `แถวที่ ${index + 1}: รหัสนักศึกษา ${student.student_id} ไม่ถูกต้อง (ต้องเป็นตัวเลข 8-13 หลัก)`
        );
      }

      if (!student.name) {
        errors.push(`แถวที่ ${index + 1}: ไม่พบชื่อ-นามสกุล`);
      }
    });

    if (errors.length > 0) {
      setImportErrors(errors);
      return;
    }

    // Import to list
    setImportedStudents([...importedStudents, ...excelData]);
    setImportSuccess(
      `นำเข้ารายชื่อนักเรียนจาก Excel จำนวน ${excelData.length} คน สำเร็จ`
    );
    setExcelData(null);

    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  // ฟังก์ชันนำเข้านักศึกษาจาก Clipboard
  const handleImportFromClipboard = () => {
    if (!clipboardText.trim()) {
      setImportErrors(["ไม่พบข้อมูลที่จะนำเข้า"]);
      return;
    }

    setImportErrors([]);
    setImportSuccess("");

    // Process clipboard text
    // Expecting format: "student_id[tab]name" or "student_id[space]name" per line
    const lines = clipboardText.trim().split(/\r?\n/);
    const parsedStudents = [];
    const errors = [];

    lines.forEach((line, index) => {
      // Try to split by tab first, then by multiple spaces
      const parts = line.trim().split(/\t+/);
      let studentId, name;

      if (parts.length >= 2) {
        // If split by tab works
        studentId = parts[0].trim();
        name = parts.slice(1).join(" ").trim();
      } else {
        // Try splitting by multiple spaces
        const spaceParts = line.trim().split(/\s{2,}/);
        if (spaceParts.length >= 2) {
          studentId = spaceParts[0].trim();
          name = spaceParts.slice(1).join(" ").trim();
        } else {
          // Try to find a pattern where numbers are followed by text
          const match = line.match(/^(\d+)\s+(.+)$/);
          if (match) {
            studentId = match[1].trim();
            name = match[2].trim();
          } else {
            errors.push(`บรรทัดที่ ${index + 1}: รูปแบบไม่ถูกต้อง "${line}"`);
            return;
          }
        }
      }

      // Validate student ID
      if (!studentId) {
        errors.push(`บรรทัดที่ ${index + 1}: ไม่พบรหัสนักศึกษา`);
      } else if (!/^\d{8,13}$/.test(studentId)) {
        errors.push(
          `บรรทัดที่ ${index + 1}: รหัสนักศึกษา ${studentId} ไม่ถูกต้อง (ต้องเป็นตัวเลข 8-13 หลัก)`
        );
      }

      // Validate name
      if (!name) {
        errors.push(`บรรทัดที่ ${index + 1}: ไม่พบชื่อ-นามสกุล`);
      }

      if (studentId && name) {
        parsedStudents.push({
          student_id: studentId,
          name: name,
        });
      }
    });

    if (errors.length > 0) {
      setImportErrors(errors);
      return;
    }

    if (parsedStudents.length === 0) {
      setImportErrors([
        "ไม่สามารถแยกแยะข้อมูลนักเรียนได้ โปรดตรวจสอบรูปแบบข้อมูล",
      ]);
      return;
    }

    // Add to imported students list
    setImportedStudents([...importedStudents, ...parsedStudents]);
    setImportSuccess(
      `นำเข้ารายชื่อนักเรียนจาก Clipboard จำนวน ${parsedStudents.length} คน สำเร็จ`
    );
    setClipboardText("");
  };

  // ฟังก์ชันลบนักศึกษา
  const handleRemoveStudent = (index) => {
    const updatedStudents = [...importedStudents];
    updatedStudents.splice(index, 1);
    setImportedStudents(updatedStudents);
  };

  // ฟังก์ชันบันทึกรายชื่อนักศึกษา
  const handleSaveImportedStudents = () => {
    if (importedStudents.length === 0) {
      setImportErrors(["ไม่พบรายชื่อนักเรียนที่จะบันทึก"]);
      return;
    }

    // ตรวจสอบว่ามี currentAssignmentId หรือไม่
    if (!currentAssignmentId) {
      // ถ้าไม่มี currentAssignmentId แต่มี homeworks
      if (homeworks.length > 0 && homeworks[0].id) {
        // ใช้ id จาก homework แรก
        setCurrentAssignmentId(homeworks[0].id);
        console.log(
          "Setting current assignment ID from homework:",
          homeworks[0].id
        );
      } else {
        setImportErrors([
          "ไม่พบข้อมูลการบ้านที่จะบันทึก กรุณาเลือกการบ้านอีกครั้ง",
        ]);
        return;
      }
    }

    // ใช้ค่า currentAssignmentId ที่เป็นปัจจุบัน
    const assignmentIdToUse =
      currentAssignmentId || (homeworks.length > 0 ? homeworks[0].id : null);

    console.log("Using assignment ID:", assignmentIdToUse);

    if (!assignmentIdToUse) {
      setImportErrors([
        "ไม่พบข้อมูลการบ้านที่จะบันทึก กรุณาเลือกการบ้านอีกครั้ง",
      ]);
      return;
    }

    setLoading(true);
    setImportErrors([]);
    setImportSuccess("");

    // แสดงข้อมูลที่จะส่งในคอนโซล
    const studentsData = importedStudents.map((student) => ({
      student_id: student.student_id,
      name: student.name,
      assignment_id: assignmentIdToUse,
      // ไม่ต้องส่ง assignment_clo_id เพราะ backend จะดึงข้อมูลทั้งหมดจาก assignment_id
      // และทำการเชื่อมโยงกับ CLO ทั้งหมดให้อัตโนมัติ
    }));

    console.log("Data being sent to API:", {
      students: studentsData,
    });

    // ส่งข้อมูลไป API
    axios
      .post("/api/add_students_to_assignment", {
        students: studentsData,
      })
      .then((response) => {
        console.log("Response from server:", response.data);
        setImportSuccess(
          `บันทึกรายชื่อนักเรียนสำเร็จ: ${response.data?.message || `จำนวน ${importedStudents.length} คน`}`
        );
        setImportedStudents([]);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error saving students:", error);
        setImportErrors([`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message}`]);
        setLoading(false);
      });
  };

  // ฟังก์ชันเพิ่มนักศึกษาเข้า assignment
  const handleAddStudentToAssignment = (studentId, assignmentId) => {
    const student = students.find((s) => s.student_id === studentId);
    const assignment = assignments.find(
      (a) => a.assignment_id === assignmentId
    );

    if (student && assignment) {
      // console.log("Adding student to assignment...")
      // console.log("Student ID:", student.student_id)
      // console.log("Student Name:", student.name)
      // console.log("Course:", assignment.course_name)
      // console.log("Assignment Name:", assignment.assignment_name)
      // console.log("Year:", assignment.year)

      axios
        .post("/api/add_student_to_assignment", {
          student_id: student.student_id,
          name: student.name,
          course: assignment.course_name,
          assignment_id: assignment.assignment_id,
          assignment_name: assignment.assignment_name,
          year: assignment.year,
        })
        .then((response) => {
          // console.log("API response:", response.data);
          if (response.data?.message) {
            alert("Student added successfully!");
          }
        })
        .catch((error) => {
          console.error("Error adding student:", error);
          alert("Error: " + error.message);
        });
    } else {
      console.error("Student or assignment not found");
      alert("Student or assignment information is missing.");
    }
  };

  // ฟังก์ชันเลือกโปรแกรม
  const handleSelectProgram = (programName) => {
    setSelectedProgram(programName);
    setSelectedCourseId("");
    setSelectedSectionId("");
    setSelectedSemesterId("");
    setSelectedYear("");
  };

  const handleAssignmentClick = (assignment) => {
    // บันทึกข้อมูล assignment ที่เลือกในตัวแปร state
    setSelectedAssignment(assignment);
    console.log("เลือก Assignment:", assignment);

    // ตั้งค่าข้อมูลตามข้อมูลใน assignment
    setSelectedCourseId(assignment.course_id?.toString() || "");
    setSelectedSectionId(assignment.section_id?.toString() || "");
    setSelectedSemesterId(assignment.semester_id?.toString() || "");
    setSelectedYear(assignment.year?.toString() || "");
    setCurrentAssignmentId(assignment.assignment_id);
    setAssignmentName(assignment.assignment_name || "");

    // ดึงข้อมูล CLO และนักศึกษาสำหรับ Assignment นี้
    const fetchData = async () => {
      try {
        // ดึงข้อมูล Assignment, CLOs และนักศึกษา
        const response = await axios.get(
          `/api/get_assignment_detail/${assignment.assignment_id}`
        );

        if (response.data && response.data.success) {
          console.log("ข้อมูล Assignment ที่ได้รับ:", response.data);

          // นำข้อมูล CLO มาใช้
          setCLOs(response.data.clos || []);

          // นำข้อมูลนักศึกษามาใช้ (นักศึกษาที่มีคะแนนใน Assignment นี้)
          setImportedStudents(response.data.students || []);

          // นำข้อมูลคะแนนมาใช้
          setScores(response.data.scores || {});

          // สร้าง homeworks สำหรับการแก้ไขคะแนน
          if (response.data.clos && response.data.clos.length > 0) {
            const homeworkData = {
              id: assignment.assignment_id,
              name: assignment.assignment_name,
              scores: {},
            };

            // ตั้งค่าคะแนนและน้ำหนัก CLO
            const cloWeightsObj = {};
            response.data.clos.forEach((clo) => {
              homeworkData.scores[clo.clo_id] = 0; // ค่าเริ่มต้น
              cloWeightsObj[clo.clo_id] = clo.weight || 0;
            });

            // นำคะแนนที่มีอยู่มาตั้งค่า (ถ้ามีข้อมูลนักเรียนและคะแนน)
            if (response.data.students.length > 0) {
              const firstStudent = response.data.students[0];
              const firstStudentScores =
                response.data.scores[firstStudent.student_id] || {};

              response.data.clos.forEach((clo) => {
                if (firstStudentScores[clo.assignment_clo_id] !== undefined) {
                  homeworkData.scores[clo.clo_id] =
                    firstStudentScores[clo.assignment_clo_id];
                }
              });
            }

            // ตั้งค่า homeworks และ cloWeights
            setHomeworks([homeworkData]);
            setCloWeights(cloWeightsObj);
          }
        } else {
          console.error(
            "ไม่สามารถดึงข้อมูล Assignment ได้:",
            response.data?.message
          );
          setImportedStudents([]);
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล Assignment:", error);
        setImportedStudents([]);
      }
    };

    // เรียกใช้ฟังก์ชันดึงข้อมูล
    fetchData();
  };

  // ตรวจสอบสถานะการโหลด
  if (loading && !universities.length && !semesters.length) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "300px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">กำลังโหลดข้อมูล...</span>
        </div>
        <span className="ms-3">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  // แสดงข้อผิดพลาด
  if (error) {
    return <div className="alert alert-danger">เกิดข้อผิดพลาด: {error}</div>;
  }

  return (
    <div
      className="mb-3"
      style={{ paddingTop: "80px", maxWidth: "1200px", marginLeft: "20px" }}>
      {/* Fixed Header with Tabs and Filters */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          marginLeft: "250px",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          borderBottom: "1px solid #eee",
        }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 0",
            marginLeft: "15px",
            padding: "0 15px",
          }}>
          <h3
            className="mb-0"
            style={{ fontSize: "1.4rem", padding: "10px 0", marginTop: 15 }}>
            {t("Course Information")}
          </h3>

          {/* แถบเมนู */}
          <ul
            className="tab-bar"
            style={{
              margin: 0,
              padding: "5px 0 10px 5px",
              borderBottom: "none",
            }}>
            <li
              className={`tab-item ${activeTab === 0 ? "active" : ""}`}
              onClick={() => handleTabClick(0)}>
              {t("General Information")}
            </li>
            <li
              className={`tab-item ${activeTab === 1 ? "active" : ""}`}
              onClick={() => handleTabClick(1)}>
              {t("Course Learning Outcomes (CLO)")}
            </li>
            <li
              className={`tab-item ${activeTab === 2 ? "active" : ""}`}
              onClick={() => handleTabClick(2)}>
              {t("Course-CLO Mapping")}
            </li>
            <li
              className={`tab-item ${activeTab === 3 ? "active" : ""}`}
              onClick={() => handleTabClick(3)}>
              {t("CLO-PLO Mapping")}
            </li>
            <li
              className={`tab-item ${activeTab === 4 ? "active" : ""}`}
              onClick={() => handleTabClick(4)}>
              {t("Assignment")}
            </li>
          </ul>

          {/* 5 Filters in one row */}
          <div
            className="d-flex flex-row"
            style={{ flexWrap: "nowrap", marginTop: "0px" }}>
            <div className="mb-3 me-2" style={{ width: "300px" }}>
              <label className="form-label text-start">
                {t('Choose a university')}
              </label>
              <select
                className="form-select"
                value={selectedUniversity}
                onChange={(e) =>
                  handleFilterChange("university", e.target.value)
                }>
                <option value="">{t('Select University')}</option>
                {universities.map((university) => (
                  <option
                    key={university.university_id}
                    value={university.university_id}>
                    {university.university_name_en} (
                    {university.university_name_th})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3 me-2" style={{ width: "350px" }}>
              <label className="form-label text-start">{t('Choose a Faculty')}</label>
              <select
                className="form-select"
                value={selectedFaculty || ""}
                onChange={(e) => handleFilterChange("faculty", e.target.value)}
                disabled={!selectedUniversity}>
                <option value="">{t('Select Faculty')}</option>
                {facultys.map((faculty) => (
                  <option key={faculty.faculty_id} value={faculty.faculty_id}>
                    {faculty.faculty_name_th} ({faculty.faculty_name_en})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3 me-2" style={{ width: "200px" }}>
              <label className="form-label text-start">{t('Choose a Program')}</label>
              <select
                className="form-select"
                value={selectedProgram}
                onChange={(e) => handleFilterChange("program", e.target.value)}
                disabled={!selectedFaculty}>
                <option value="">{t('Select Program')}</option>
                {getUniquePrograms(programs).map((program) => (
                  <option key={program.program_id} value={program.program_id}>
                    {program.program_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3 me-2" style={{ width: "90px" }}>
              <label className="form-label">{t('Year')}</label>
              <select
                className="form-select"
                value={selectedYear}
                onChange={(e) => handleFilterChange("year", e.target.value)}
                disabled={!selectedProgram}>
                <option value="">{t('Select Year')}</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3 me-2" style={{ width: "180px" }}>
              <label className="form-label">{t('Semester')}</label>
              <select
                className="form-select"
                name="semester_id"
                value={newCourse.semester_id}
                onChange={handleCourseChange}
                disabled={!selectedProgram}>
                <option value="">{t('Select Semester')}</option>
                {semesters && semesters.length > 0 ? (
                  semesters.map((semester) => (
                    <option
                      key={semester.semester_id}
                      value={semester.semester_id}>
                      {semester.semester_name}
                    </option>
                  ))
                ) : (
                  <option value="">No semesters available</option>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* เพิ่ม padding ด้านบนของเนื้อหาเพื่อไม่ให้โดนแถบเมนูทับ */}
      <div
        style={{
          paddingTop: "10px", // ต้องเพิ่ม padding ให้มากพอสำหรับความสูงของแถบเมนู
          padding: "120px 0px 0 0px",
        }}>
        {/* Tab content - Course Information */}
        <div
          className={`tab-content ${activeTab === 0 ? "active" : "hidden"}`}
          style={{ marginTop: "10px" }}>
          <h3>{t('Course Management')}</h3>
          <hr className="my-4" />

          {/* Add Course Section */}
          <AddCourse
            selectedProgram={selectedProgram} 
            newCourse={newCourse}
            handleCourseChange={handleCourseChange}
            addCourse={addCourse}
            allFiltersSelected={allFiltersSelected}
            selectedYear={selectedYear}
            selectedSemesterId={selectedSemesterId}
          />

          {/* Course Table */}
          <CourseTable course_list={courseList} deleteCourse={deleteCourse} />

        </div>

        <div
          className={`tab-content ${activeTab === 1 ? "active" : "hidden"}`}
          style={{ marginTop: "0px" }}>
          <div className="row" style={{ padding: "0px 10px 0 10px" }}>
            <div className="col-md-3">
              <label className="form-label text-start">Choose a Course</label>
              <select
                className="form-select"
                value={selectedCourseId || ""}
                onChange={(e) => {
                  // console.log("Selected Course:", e.target.value);
                  setSelectedCourseId(e.target.value);
                }}
                disabled={!newCourse.semester_id}>
                <option value="" disabled>
                  Select Course
                </option>
                {courses.map((course) => (
                  <option key={course.course_id} value={course.course_id}>
                    {`${course.course_id} - ${course.course_name} (${course.course_engname})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3">
            <h3>CLO Management</h3>
            <hr className="my-4" />

            {/* CLO List Section */}
            <h5>CLO List</h5>

            <div className="action-buttons">
              <div className="button-group">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn"
                  style={{ backgroundColor: "#FF8C00", color: "white" }}
                  disabled={
                    !selectedProgram ||
                    !selectedCourseId ||
                    !selectedSemesterId ||
                    !selectedYear
                  }>
                  Add CLO
                </button>

                <button
                  onClick={fetchPreviousYearCLOs}
                  className="btn btn-secondary"
                  disabled={
                    !selectedProgram ||
                    !selectedCourseId ||
                    !selectedSemesterId ||
                    !selectedYear
                  }>
                  Load Previous Year CLOs
                </button>
              </div>

              <div className="button-group ms-auto">
                <button
                  onClick={() => document.getElementById("uploadExcel").click()}
                  className="btn btn-secondary"
                  disabled={
                    !selectedProgram ||
                    !selectedCourseId ||
                    !selectedSemesterId ||
                    !selectedYear
                  }>
                  Upload Excel
                </button>
                <input
                  type="file"
                  id="uploadExcel"
                  style={{ display: "none" }}
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                />

                <button
                  onClick={handleUploadButtonClick}
                  className="btn btn-success"
                  disabled={!excelData || excelData.length === 0}>
                  Submit Excel Data
                </button>
              </div>
            </div>

            {/* พื้นที่วางข้อมูล */}
            <div
              className="paste-area mt-3"
              style={{ display: showPasteArea ? "block" : "none" }}>
              <div className="card">
                <div className="card-header">
                  <h5>วางข้อมูล CLO</h5>
                  <p className="text-muted mb-0">
                    คัดลอกข้อมูลจาก Excel แล้ววางที่นี่
                    (รองรับทั้งคอลัมน์ที่คั่นด้วย Tab และ Comma)
                  </p>
                </div>
                <div className="card-body">
                  <textarea
                    className="form-control"
                    rows="5"
                    placeholder="วางข้อมูล CLO ที่นี่... (CLO Code, CLO Name, CLO English Name)"
                    onPaste={handleDirectPaste}></textarea>
                  <div className="mt-2">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setShowPasteArea(false)}>
                      ปิด
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Data */}
            {excelData && excelData.length > 0 && (
              <div className="mt-3">
                <h5>Preview Data</h5>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>CLO Code</th>
                      <th>CLO Name</th>
                      <th>CLO English Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelData.map((row, index) => (
                      <tr key={index}>
                        <td>{row.CLO_code}</td>
                        <td>{row.CLO_name}</td>
                        <td>{row.CLO_engname}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal for Add CLO */}
          {showAddModal && (
            <div
              className="modal fade show"
              style={{ display: "block" }}
              aria-labelledby="exampleModalLabel"
              aria-hidden="true">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title" id="exampleModalLabel">
                      Add New CLO
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowAddModal(false)}
                      aria-label="Close"></button>
                  </div>
                  <div className="modal-body">
                    <label>CLO Code:</label>
                    <input
                      type="text"
                      value={editCloCode}
                      onChange={(e) => setEditCloCode(e.target.value)}
                      style={{ width: "100%" }}
                      className="form-control mb-2"
                    />
                    <label>CLO Name:</label>
                    <input
                      type="text"
                      value={editCloName}
                      onChange={(e) => setEditCloName(e.target.value)}
                      style={{ width: "100%" }}
                      className="form-control mb-2"
                    />
                    <label>CLO English Name:</label>
                    <input
                      type="text"
                      value={editCloEngName}
                      onChange={(e) => setEditCloEngName(e.target.value)}
                      style={{ width: "100%" }}
                      className="form-control mb-2"
                    />
                  </div>
                  <div className="modal-footer">
                    <button onClick={handleAddClo} className="btn btn-primary">
                      Add CLO
                    </button>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="btn btn-secondary">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal for Previous Year CLOs */}
          {showPreviousYearCLOsModal && (
            <div className="modal show" style={{ display: "block" }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">CLOs from Previous Year</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() =>
                        setShowPreviousYearCLOsModal(false)
                      }></button>
                  </div>
                  <div className="modal-body">
                    {previousYearCLOs.length > 0 ? (
                      <div className="card">
                        <div className="card-header bg-primary text-white">
                          Course Learning Outcomes (CLOs)
                        </div>
                        <div className="card-body">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>CLO Code</th>
                                <th>CLO Name (Thai)</th>
                                <th>CLO Name (English)</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previousYearCLOs.map((clo) => (
                                <tr key={clo.CLO_id}>
                                  <td className="fw-bold">{clo.CLO_code}</td>
                                  <td>{clo.CLO_name}</td>
                                  <td>{clo.CLO_engname}</td>
                                  <td>
                                    <button
                                      className="btn btn-info btn-sm"
                                      onClick={() => {
                                        setEditCloCode(clo.CLO_code);
                                        setEditCloName(clo.CLO_name);
                                        setEditCloEngName(clo.CLO_engname);
                                        setShowAddModal(true);
                                        setShowPreviousYearCLOsModal(false);
                                      }}>
                                      Copy
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-warning text-center">
                        No Course Learning Outcomes (CLOs) found for the
                        selected year
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowPreviousYearCLOsModal(false)}>
                      Close
                    </button>
                    <button
                      onClick={handleUploadPrevious}
                      className="btn btn-success"
                      disabled={
                        !previousYearCLOs || previousYearCLOs.length === 0
                      }>
                      Submit Excel Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card mt-3">
            <div className="card-header">
              <h5>CLOs</h5>
            </div>
            <div className="card-body">
              {!(selectedCourseId && selectedSemesterId && selectedYear) ? (
                <p className="text-warning">
                  กรุณาเลือกข้อมูลให้ครบทุกช่องก่อนแสดง CLO
                </p>
              ) : selectedCourseClo.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>CLO </th>
                      <th>Detail</th>
                      <th>Detail Eng</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCourseClo.map((clo) => (
                      <tr key={clo.CLO_id}>
                        <td>{clo.CLO_code}</td>
                        <td>{clo.CLO_name}</td>
                        <td>{clo.CLO_engname}</td>
                        <td>
                          <button
                            className="btn btn-warning me-2"
                            onClick={() => handleEditClo(clo.CLO_id)}>
                            Edit
                          </button>

                          <button
                            className="btn btn-danger"
                            onClick={() => {
                              handleDeleteClo(
                                clo.CLO_id,
                                selectedCourseId,
                                selectedSemesterId,
                                selectedYear
                              );
                            }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <>
                  <p>No CLO data available</p>
                </>
              )}
            </div>
          </div>

          {showEditModal && (
            <div className="modal show" style={{ display: "block" }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Edit CLO</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowEditModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="clo-code" className="form-label">
                        CLO Code
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="clo-code"
                        value={editCloCode}
                        onChange={(e) => setEditCloCode(e.target.value)}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="clo-name" className="form-label">
                        CLO Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="clo-name"
                        value={editCloName}
                        onChange={(e) => setEditCloName(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="clo-engname" className="form-label">
                        CLO English Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="clo-engname"
                        value={editCloEngName}
                        onChange={(e) => setEditCloEngName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowEditModal(false)}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSaveClo}>
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`tab-content ${activeTab === 3 ? "active" : "hidden"}`}>
          <div className="row" style={{ padding: "0px 10px 0 10px" }}>
            <div className="col-md-3">
              <label className="form-label text-start">Choose a Course</label>

              <select
                className="form-select"
                value={selectedCourseId || ""}
                onChange={(e) => {
                  // console.log("Selected Course:", e.target.value);
                  setSelectedCourseId(e.target.value);
                }}
                disabled={!newCourse.semester_id}>
                <option value="" disabled>
                  Select Course
                </option>
                {programCourseData.courses.map((course) => (
                  <option key={course.course_id} value={course.course_id}>
                    {`${course.course_id} - ${course.course_name} (${course.course_engname})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label text-start">Choose a Section</label>
              <select
                className="form-select"
                value={selectedSectionId || ""}
                onChange={(e) => {
                  // console.log("Selected Section:", e.target.value);
                  setSelectedSectionId(e.target.value);
                }}
                disabled={!selectedCourseId}>
                <option value="" disabled>
                  Select Section
                </option>
                {programCourseData.sections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h5>CLO-PLO Mapping Table</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <button
                  className="btn btn-primary me-2"
                  onClick={handleEditToggle}>
                  {editingScores ? "Cancel Edit" : "Edit PLO-CLO Mapping"}
                </button>
                {editingScores && (
                  <>
                    <button
                      className="btn btn-success me-2"
                      onClick={handlePatchScores}
                      disabled={!editingScores}>
                      Save PLO-CLO Mapping
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={handlePostScores}
                      disabled={!editingScores}>
                      Submit PLO-CLO Scores
                    </button>
                  </>
                )}
              </div>

              {allPLOs.length > 0 && CLOs.length > 0 ? (
                <div className="table-responsive">
                  <table
                    className="table table-bordered"
                    border="1"
                    cellPadding="10">
                    <thead>
                      <tr>
                        <th rowSpan="2">CLO</th>
                        <th colSpan={allPLOs.length} className="text-center">
                          PLO
                        </th>
                        <th rowSpan="2">Total</th>
                      </tr>
                      <tr>
                        {allPLOs.map((plo) => (
                          <th
                            key={`header-plo-${plo.PLO_id || plo.plo_id}`}
                            className="text-center">
                            {plo.PLO_code || "N/A"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* วนลูปแสดงทุก CLO ที่มี */}
                      {CLOs.map((clo) => {
                        // แต่ละ CLO ต้องเชื่อมโยงกับแค่ 1 PLO เท่านั้น
                        // ค้นหา PLO ที่ CLO นี้เชื่อมโยงอยู่ (ถ้ามี)
                        let selectedPlo = null;
                        let cloTotal = 0;

                        // เช็คว่า CLO นี้เชื่อมโยงกับ PLO ตัวไหน
                        allPLOs.forEach((plo) => {
                          const ploId = plo.PLO_id || plo.plo_id;
                          const key = `${ploId}-${clo.CLO_id}`;

                          // ถ้าอยู่ในโหมดแก้ไข ให้ดูจาก scores
                          if (editingScores) {
                            if (scores[key] > 0) {
                              cloTotal = parseInt(scores[key]) || 0;
                              selectedPlo = ploId;
                            }
                          } else {
                            // ถ้าไม่อยู่ในโหมดแก้ไข ให้ดูจาก mappings
                            const mapping = mappings.find(
                              (m) =>
                                (m.PLO_id === ploId || m.plo_id === ploId) &&
                                m.CLO_id === clo.CLO_id
                            );

                            if (mapping && mapping.weight > 0) {
                              cloTotal = mapping.weight;
                              selectedPlo = ploId;
                            }
                          }
                        });

                        return (
                          <tr key={`row-clo-${clo.CLO_id}`}>
                            <td>{clo.CLO_code}</td>
                            {allPLOs.map((plo) => {
                              const ploId = plo.PLO_id || plo.plo_id;
                              const key = `${ploId}-${clo.CLO_id}`;

                              return (
                                <td key={`cell-${key}`} className="text-center">
                                  {editingScores ? (
                                    <div className="form-check d-flex justify-content-center align-items-center">
                                      <input
                                        type="radio"
                                        className="form-check-input me-2"
                                        checked={
                                          scores[key] > 0 ||
                                          (selectedPlo === ploId &&
                                            !scores[key])
                                        }
                                        onChange={() => {
                                          // ล้างค่าเดิมของ CLO นี้ทั้งหมด
                                          const newScores = { ...scores };
                                          allPLOs.forEach((p) => {
                                            const pId = p.PLO_id || p.plo_id;
                                            delete newScores[
                                              `${pId}-${clo.CLO_id}`
                                            ];
                                          });

                                          // ตั้งค่าใหม่
                                          newScores[key] = cloTotal || 100;
                                          setScores(newScores);
                                        }}
                                      />
                                      {selectedPlo === ploId && (
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={
                                            scores[key] !== undefined
                                              ? scores[key]
                                              : cloTotal || 100
                                          }
                                          onChange={(e) =>
                                            handleInputChange(
                                              ploId,
                                              clo.CLO_id,
                                              e.target.value
                                            )
                                          }
                                          className="form-control mx-auto"
                                          style={{ width: "60px" }}
                                        />
                                      )}
                                    </div>
                                  ) : selectedPlo === ploId ? (
                                    cloTotal
                                  ) : (
                                    "-"
                                  )}
                                </td>
                              );
                            })}
                            <td className="text-center">{cloTotal || "-"}</td>
                          </tr>
                        );
                      })}

                      {/* แถวผลรวม PLO */}
                      <tr className="table-secondary">
                        <td className="fw-bold">PLO Totals</td>
                        {allPLOs.map((plo) => {
                          const ploId = plo.PLO_id || plo.plo_id;
                          const ploTotal = calculateTotalForPLO(ploId);

                          return (
                            <td
                              key={`ploTotal-${ploId}`}
                              className="text-center fw-bold">
                              {ploTotal || "-"}
                            </td>
                          );
                        })}
                        <td className="text-center">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-warning">
                  {!(
                    selectedCourseId &&
                    selectedSectionId &&
                    selectedSemesterId &&
                    selectedYear
                  )
                    ? "กรุณาเลือกข้อมูลให้ครบทุกช่องก่อนแสดงตาราง"
                    : CLOs.length === 0
                      ? "ไม่พบข้อมูล CLO"
                      : allPLOs.length === 0
                        ? "ไม่พบข้อมูล PLO"
                        : "ไม่พบข้อมูลการแมป PLO-CLO"}
                </p>
              )}
            </div>
          </div>
        </div>

        <div
          className={`tab-content ${activeTab === 2 ? "active" : "hidden"}`}
          style={{ marginTop: "0px" }}>
          <div className="row" style={{ padding: "0px 10px 0 10px" }}>
            <div className="col-md-3">
              <label className="form-label text-start">Choose a Course</label>
              <select
                className="form-select"
                value={selectedCourseId || ""}
                onChange={(e) => {
                  console.log("Selected Course:", e.target.value);
                  setSelectedCourseId(e.target.value);
                }}
                disabled={!newCourse.semester_id}>
                <option value="" disabled>
                  Select Course
                </option>
                {courses.map((course) => (
                  <option key={course.course_id} value={course.course_id}>
                    {`${course.course_id} - ${course.course_name} (${course.course_engname})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showMapping && selectedCourseId ? (
            <CloMapping
              handleEditToggle={handleEditToggle}
              editingScores={editingScores}
              handlePostScores={handlePostScores}
              courseClo={courseClo}
              selectedCourseId={selectedCourseId}
              courses={courses}
              weightEachCourse={allWeights}
              handleEditWeightEachCourse={handleEditWeightEachCourse}
              calculateTotal={calculateTotal}
              selectedSemesterId={selectedSemesterId}
              selectedYear={selectedYear}
            />
          ) : (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <p style={{ fontSize: "16px", color: "#666" }}>
                กรุณาเลือกตัวเลือกให้ครบเพื่อแสดงตาราง Course-CLO Mapping
              </p>
            </div>
          )}
        </div>

        <div className={`tab-content ${activeTab === 4 ? "active" : "hidden"}`}>
          <div className="row" style={{ padding: "0px 10px 0 10px" }}>
            <div className="col-md-3">
              <label className="form-label text-start">Choose a Course</label>

              <select
                className="form-select"
                value={selectedCourseId || ""}
                onChange={(e) => {
                  // console.log("Selected Course:", e.target.value);
                  setSelectedCourseId(e.target.value);
                }}
                disabled={!newCourse.semester_id}>
                <option value="" disabled>
                  Select Course
                </option>
                {programCourseData.courses.map((course) => (
                  <option key={course.course_id} value={course.course_id}>
                    {`${course.course_id} - ${course.course_name} (${course.course_engname})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label text-start">Choose a Section</label>
              <select
                className="form-select"
                value={selectedSectionId || ""}
                onChange={(e) => {
                  // console.log("Selected Section:", e.target.value);
                  setSelectedSectionId(e.target.value);
                }}
                disabled={!selectedCourseId}>
                <option value="" disabled>
                  Select Section
                </option>
                {programCourseData.sections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <div className="container mb-4">
              {/* Step indicator */}

              {/* Step 1: Assignment Information */}
              {currentStep === 1 && (
                <div className="row">
                  <div className="col-md-10 mx-auto">
                    {/* University Selection */}
                    <div className="card mb-3 shadow-sm">
                      <div className="card-body">
                        {/* ไม่มีฟิลเตอร์ซ้ำ แต่แสดงชื่อ Assignment แทน */}
                        <div className="mb-3">
                          <label
                            htmlFor="assignment-name"
                            className="form-label">
                            Assignment Name
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="assignment-name"
                            value={assignmentName}
                            onChange={(e) => setAssignmentName(e.target.value)}
                            placeholder="Enter Assignment Name"
                          />
                        </div>

                        {/* หากอยู่ในโหมดแก้ไข แสดงข้อความและปุ่มสำหรับบันทึกการแก้ไข */}
                        {isEditing && (
                          <div className="alert alert-info">
                            <i className="fas fa-info-circle me-2"></i>
                            คุณกำลังแก้ไขข้อมูล Assignment ID:{" "}
                            {currentAssignmentId}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Error Message */}
                    {typeError && (
                      <div className="alert alert-danger mt-3">{typeError}</div>
                    )}

                    {/* Next/Save Button */}
                    <div className="d-flex justify-content-end mt-4">
                      {isEditing ? (
                        <>
                          <button
                            className="btn btn-secondary px-4 me-2"
                            onClick={() => {
                              setIsEditing(false);
                              setAssignmentName("");
                              setCurrentAssignmentId(null);
                            }}>
                            ยกเลิก <i className="fas fa-times ms-2"></i>
                          </button>
                          <button
                            className="btn btn-primary px-4"
                            onClick={() => {
                              // ใช้ฟังก์ชันบันทึกการแก้ไขแทนฟังก์ชันเพิ่มข้อมูลใหม่
                              handleSaveEditAssignment();
                            }}
                            disabled={
                              !(
                                selectedProgram &&
                                selectedCourseId &&
                                selectedSectionId &&
                                selectedSemesterId &&
                                selectedYear &&
                                assignmentName
                              )
                            }>
                            บันทึกการแก้ไข <i className="fas fa-save ms-2"></i>
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-primary px-4"
                          onClick={() => {
                            handleSaveStep1();
                          }}
                          disabled={
                            !(
                              selectedProgram &&
                              selectedCourseId &&
                              selectedSectionId &&
                              selectedSemesterId &&
                              selectedYear &&
                              assignmentName
                            )
                          }>
                          ADD Assignment{" "}
                          <i className="fas fa-arrow-right ms-2"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: CLO Scoring System */}
              {currentStep === 2 && (
                <div className="row">
                  <div className="col-12">
                    <div className="card shadow-sm">
                      <div className="card-header bg-primary text-white">
                        <h5 className="mb-0 text-center">
                          ระบบกรอกคะแนนตามน้ำหนัก CLO
                        </h5>
                      </div>
                      <div className="card-body p-4">
                        {CLOs.length > 0 ? (
                          <>
                            <div className="table-responsive">
                              <table className="table table-bordered table-hover">
                                <thead className="table-light">
                                  <tr>
                                    <th
                                      className="text-center"
                                      style={{ width: "50px" }}>
                                      No.
                                    </th>
                                    <th
                                      className="text-center"
                                      style={{ width: "200px" }}>
                                      HW
                                    </th>
                                    {CLOs.map((clo) => (
                                      <th
                                        key={clo.CLO_id}
                                        className="text-center">
                                        {clo.CLO_code || `CLO${clo.CLO_id}`}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {/* แถว weight */}
                                  <tr className="table-warning">
                                    <td className="font-weight-bold"></td>
                                    <td className="font-weight-bold text-center">
                                      น้ำหนักคะแนน
                                    </td>
                                    {CLOs.map((clo) => {
                                      // ดึงค่า weight จาก cloWeights
                                      const weightValue =
                                        cloWeights[clo.CLO_id] || 0;
                                      return (
                                        <td
                                          key={clo.CLO_id}
                                          className="text-center font-weight-bold">
                                          {weightValue}
                                        </td>
                                      );
                                    })}
                                  </tr>

                                  {/* Homework rows */}
                                  {homeworks.map((hw, index) => (
                                    <tr key={hw.id}>
                                      <td className="text-center">
                                        {index + 1}
                                      </td>
                                      <td>{hw.name}</td>
                                      {CLOs.map((clo) => {
                                        const currentScore =
                                          hw.scores[clo.CLO_id] !== undefined
                                            ? hw.scores[clo.CLO_id]
                                            : 0;
                                        return (
                                          <td
                                            key={clo.CLO_id}
                                            className={getScoreColor(
                                              currentScore || 0
                                            )}>
                                            <input
                                              type="number"
                                              min="0"
                                              max={
                                                cloWeights[clo.CLO_id] || 100
                                              }
                                              value={currentScore}
                                              onChange={(e) =>
                                                handleScoreChange(
                                                  hw.id,
                                                  clo.CLO_id,
                                                  e.target.value
                                                )
                                              }
                                              className={`form-control form-control-sm text-center ${getScoreColor(currentScore || 0)}`}
                                              style={{ border: "none" }}
                                            />
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}

                                  {/* Totals row */}
                                  <tr className="table-secondary font-weight-bold">
                                    <td></td>
                                    <td className="text-center">รวม</td>
                                    {CLOs.map((clo) => {
                                      const total = calculateCloTotal(
                                        clo.CLO_id
                                      );
                                      // ใช้ weight จากฐานข้อมูลโดยตรง
                                      const maxWeight =
                                        cloWeights[clo.CLO_id] || 0;
                                      const isValid = total <= maxWeight;

                                      return (
                                        <td
                                          key={clo.CLO_id}
                                          className={`text-center ${!isValid ? "text-danger" : ""}`}>
                                          {total} / {maxWeight}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {/* Add button */}
                            <div className="mt-3 mb-4">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  const newHomework = {
                                    id: -Math.floor(Math.random() * 1000),
                                    name: `การบ้าน ${homeworks.length + 1}`,
                                    scores: {},
                                  };
                                  const newScores = {};
                                  CLOs.forEach((clo) => {
                                    newScores[clo.CLO_id] = 0;
                                  });
                                  newHomework.scores = newScores;
                                  setHomeworks([...homeworks, newHomework]);
                                }}>
                                <i className="fas fa-plus me-2"></i>{" "}
                                เพิ่มการบ้าน
                              </button>
                            </div>

                            {/* Validation errors */}
                            {Object.keys(validationErrors).length > 0 && (
                              <div className="alert alert-danger mt-3">
                                <strong>
                                  คะแนนที่กรอกเกินน้ำหนักที่กำหนด:
                                </strong>
                                <ul className="mb-0 mt-2">
                                  {Object.values(validationErrors).map(
                                    (error, index) => (
                                      <li key={index}>{error}</li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="alert alert-info">
                            <i className="fas fa-info-circle me-2"></i>
                            ไม่พบข้อมูล CLO สำหรับรายวิชาที่เลือก
                            กรุณาตรวจสอบข้อมูลการเลือกวิชา, ตอน, ภาคเรียน
                            และปีการศึกษา
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="d-flex justify-content-between mt-4">
                      <button
                        className="btn btn-secondary px-4"
                        onClick={goToPreviousStep}>
                        <i className="fas fa-arrow-left me-2"></i> Back
                      </button>
                      <div>
                        <button
                          className="btn btn-success px-4 me-2"
                          onClick={handleSaveAssignment}
                          disabled={
                            Object.keys(validationErrors).length > 0 ||
                            CLOs.length === 0
                          }>
                          <i className="fas fa-save me-2"></i> Save Assignment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Import Students from Excel or Clipboard */}
              {currentStep === 3 && (
                <div className="row">
                  <div className="col-12">
                    <div className="card shadow-sm mb-4">
                      <div className="card-header bg-primary text-white">
                        <h5 className="mb-0 text-center">
                          นำเข้ารายชื่อนักเรียน
                        </h5>
                      </div>
                      <div className="card-body p-4">
                        <div className="row">
                          {/* Excel Import Section */}
                          <div className="col-md-6 mb-4">
                            <div className="card h-100 border-primary">
                              <div className="card-header bg-light">
                                <h6 className="mb-0">
                                  <i className="fas fa-file-excel me-2 text-success"></i>
                                  นำเข้าจากไฟล์ Excel
                                </h6>
                              </div>
                              <div className="card-body">
                                <p className="text-muted small mb-3">
                                  รองรับไฟล์ .xlsx, .xls โดยต้องมีคอลัมน์
                                  student_id และ name เป็นอย่างน้อย
                                </p>
                                <div className="mb-3">
                                  <input
                                    type="file"
                                    className="form-control"
                                    accept=".xlsx,.xls"
                                    onChange={handleExcelFileUpload}
                                  />
                                </div>
                                {excelData && (
                                  <div className="alert alert-success">
                                    <i className="fas fa-check-circle me-2"></i>
                                    พบข้อมูลนักเรียน {excelData.length} คน
                                  </div>
                                )}
                              </div>
                              <div className="card-footer bg-light">
                                <button
                                  className="btn btn-primary w-100"
                                  onClick={handleImportFromExcel}
                                  disabled={!excelData || loading}>
                                  {loading ? (
                                    <>
                                      <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"></span>
                                      กำลังนำเข้า...
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-file-import me-2"></i>
                                      นำเข้าจาก Excel
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Clipboard Import Section */}
                          <div className="col-md-6 mb-4">
                            <div className="card h-100 border-primary">
                              <div className="card-header bg-light">
                                <h6 className="mb-0">
                                  <i className="fas fa-clipboard me-2 text-info"></i>
                                  นำเข้าจาก Clipboard
                                </h6>
                              </div>
                              <div className="card-body">
                                <p className="text-muted small mb-3">
                                  วางข้อมูลในรูปแบบ:
                                  รหัสนักศึกษา[Tab]ชื่อ-นามสกุล
                                  แต่ละคนอยู่คนละบรรทัด
                                </p>
                                <div className="mb-3">
                                  <textarea
                                    className="form-control"
                                    rows="8"
                                    placeholder="6411234567	นายทดสอบ ระบบเรียน&#10;6411234568	นางสาวทดสอบ ระบบสอบ"
                                    value={clipboardText}
                                    onChange={(e) =>
                                      setClipboardText(e.target.value)
                                    }></textarea>
                                </div>
                              </div>
                              <div className="card-footer bg-light">
                                <button
                                  className="btn btn-info text-white w-100"
                                  onClick={handleImportFromClipboard}
                                  disabled={!clipboardText.trim() || loading}>
                                  {loading ? (
                                    <>
                                      <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"></span>
                                      กำลังนำเข้า...
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-paste me-2"></i>
                                      นำเข้าจาก Clipboard
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Preview Table of Imported Students */}
                        {importedStudents.length > 0 ? (
                          <div className="mt-4">
                            <h6 className="mb-3">
                              <i className="fas fa-users me-2"></i>
                              รายชื่อนักเรียนที่นำเข้า (
                              {importedStudents.length} คน)
                            </h6>
                            <div className="table-responsive">
                              <table className="table table-striped table-hover table-sm">
                                <thead className="table-light">
                                  <tr>
                                    <th style={{ width: "80px" }}>ลำดับ</th>
                                    <th style={{ width: "150px" }}>
                                      รหัสนักศึกษา
                                    </th>
                                    <th>ชื่อ-นามสกุล</th>
                                    <th style={{ width: "100px" }}>
                                      การจัดการ
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {importedStudents.map((student, index) => (
                                    <tr key={index}>
                                      <td>{index + 1}</td>
                                      <td>{student.student_id}</td>
                                      <td>{student.name}</td>
                                      <td>
                                        <button
                                          className="btn btn-sm btn-outline-danger"
                                          onClick={() =>
                                            handleRemoveStudent(index)
                                          }>
                                          <i className="fas fa-times"></i>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : null}

                        {/* Validation Errors */}
                        {importErrors.length > 0 && (
                          <div className="alert alert-danger mt-3">
                            <strong>พบข้อผิดพลาดในการนำเข้า:</strong>
                            <ul className="mb-0 mt-2">
                              {importErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Success Message */}
                        {importSuccess && (
                          <div className="alert alert-success mt-3">
                            <i className="fas fa-check-circle me-2"></i>
                            {importSuccess}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Back and Save Buttons */}
                    <div className="d-flex justify-content-between mt-4">
                      <button
                        className="btn btn-secondary px-4"
                        onClick={goToPreviousStep}>
                        <i className="fas fa-arrow-left me-2"></i> Back
                      </button>
                      <button
                        className="btn btn-success px-4"
                        onClick={handleSaveImportedStudents}
                        disabled={importedStudents.length === 0 || loading}>
                        <i className="fas fa-save me-2"></i>{" "}
                        บันทึกรายชื่อนักเรียน
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="row mt-5">
                <div className="col-12">
                  <div className="card shadow">
                    <div className="card-header bg-primary text-white py-3">
                      <h5 className="mb-0 text-center">รายการงานที่มอบหมาย</h5>
                    </div>
                    <div className="card-body">
                      {loading ? (
                        <div className="text-center py-4">
                          <div
                            className="spinner-border text-primary"
                            role="status">
                            <span className="visually-hidden">
                              กำลังโหลดข้อมูล...
                            </span>
                          </div>
                          <p className="mt-2">กำลังโหลดข้อมูล...</p>
                        </div>
                      ) : error ? (
                        <div className="alert alert-danger">
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          {error}
                        </div>
                      ) : assignments.length === 0 ? (
                        <div className="text-center text-muted py-4">
                          <i className="fas fa-clipboard-list fa-3x mb-3"></i>
                          <p>ไม่พบข้อมูลงานที่มอบหมาย</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-striped table-hover">
                            <thead className="table-dark">
                              <tr>
                                <th>ชื่องาน</th>
                                <th>กลุ่ม</th>
                                <th>เทอม</th>
                                <th>ปี</th>
                                <th>วันที่สร้าง</th>
                              </tr>
                            </thead>
                            <tbody>
                              {assignments.map((assignment) => (
                                <tr
                                  key={assignment.assignment_id}
                                  className="assignment-row"
                                  style={{
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                  }}
                                  onClick={() =>
                                    handleAssignmentClick(assignment)
                                  }
                                  onMouseOver={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "#e9f5ff")
                                  }
                                  onMouseOut={(e) =>
                                    (e.currentTarget.style.backgroundColor = "")
                                  }>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <span>{assignment.assignment_name}</span>
                                      <span className="ms-2 text-primary small">
                                        (คลิกเพื่อดูรายละเอียด)
                                      </span>
                                    </div>
                                  </td>
                                  <td>{assignment.section_id}</td>
                                  <td>{assignment.semester_id}</td>
                                  <td>{assignment.year}</td>
                                  <td>
                                    {new Date(
                                      assignment.created_at
                                    ).toLocaleDateString("th-TH")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {selectedAssignment && (
                <div className="modal fade show" style={{ display: "block" }}>
                  <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                      <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">
                          รายละเอียด Assignment:{" "}
                          {selectedAssignment.assignment_name}
                        </h5>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => setSelectedAssignment(null)}></button>
                      </div>
                      <div className="modal-body">
                        {loading ? (
                          <div className="text-center py-4">
                            <div
                              className="spinner-border text-primary"
                              role="status">
                              <span className="visually-hidden">
                                กำลังโหลดข้อมูล...
                              </span>
                            </div>
                            <p className="mt-2">กำลังโหลดข้อมูล...</p>
                          </div>
                        ) : (
                          <div className="container-fluid">
                            <div className="row mb-3">
                              <div className="col-md-6">
                                <p>
                                  <strong>ชื่อ Assignment:</strong>{" "}
                                  {selectedAssignment.assignment_name}
                                </p>
                                {/* แก้ไขส่วนแสดงรายวิชา โดยใช้ค่า course_name โดยตรง */}
                                <p>
                                  <strong>รายวิชา:</strong>{" "}
                                  {
                                    programCourseData.courses.find(
                                      (c) =>
                                        c.course_id?.toString() ===
                                        selectedCourseId?.toString()
                                    )?.course_name
                                  }
                                </p>
                                <p>
                                  <strong>กลุ่มเรียน:</strong>{" "}
                                  {selectedAssignment.section_id}
                                </p>
                              </div>
                              <div className="col-md-6">
                                <p>
                                  <strong>ภาคเรียน:</strong>{" "}
                                  {semesters.find(
                                    (s) =>
                                      s.semester_id?.toString() ===
                                      selectedAssignment.semester_id?.toString()
                                  )?.semester_name ||
                                    selectedAssignment.semester_id}
                                </p>
                                <p>
                                  <strong>ปีการศึกษา:</strong>{" "}
                                  {selectedAssignment.year}
                                </p>
                                <p>
                                  <strong>วันที่สร้าง:</strong>{" "}
                                  {selectedAssignment.created_at
                                    ? new Date(
                                      selectedAssignment.created_at
                                    ).toLocaleDateString("th-TH")
                                    : "-"}
                                </p>
                              </div>
                            </div>

                            {/* แสดงข้อมูล CLO จากการค้นหาจาก CLOs ที่มีอยู่แล้ว */}
                            <h6 className="mt-4 mb-3">คะแนน CLO</h6>
                            {CLOs.length > 0 ? (
                              <div className="table-responsive">
                                <table className="table table-bordered table-hover">
                                  <thead className="table-light">
                                    <tr>
                                      <th
                                        className="text-center"
                                        style={{ width: "50px" }}>
                                        No.
                                      </th>
                                      <th
                                        className="text-center"
                                        style={{ width: "200px" }}>
                                        HW
                                      </th>
                                      {CLOs.map((clo) => (
                                        <th
                                          key={clo.CLO_id}
                                          className="text-center">
                                          {clo.CLO_code || `CLO${clo.CLO_id}`}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* แถว weight */}
                                    <tr className="table-warning">
                                      <td className="font-weight-bold"></td>
                                      <td className="font-weight-bold text-center">
                                        น้ำหนักคะแนน
                                      </td>
                                      {CLOs.map((clo) => {
                                        // ดึงค่า weight จาก cloWeights
                                        const weightValue =
                                          cloWeights[clo.CLO_id] || 0;
                                        return (
                                          <td
                                            key={clo.CLO_id}
                                            className="text-center font-weight-bold">
                                            {weightValue}
                                          </td>
                                        );
                                      })}
                                    </tr>

                                    {/* Homework rows */}
                                    {homeworks.map((hw, index) => (
                                      <tr key={hw.id}>
                                        <td className="text-center">
                                          {index + 1}
                                        </td>
                                        <td>{hw.name}</td>
                                        {CLOs.map((clo) => {
                                          const currentScore =
                                            hw.scores[clo.CLO_id] !== undefined
                                              ? hw.scores[clo.CLO_id]
                                              : 0;
                                          return (
                                            <td
                                              key={clo.CLO_id}
                                              className={getScoreColor(
                                                currentScore || 0
                                              )}>
                                              <span className="form-control-plaintext text-center">
                                                {currentScore}
                                              </span>
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}

                                    {/* Totals row */}
                                    <tr className="table-secondary font-weight-bold">
                                      <td></td>
                                      <td className="text-center">รวม</td>
                                      {CLOs.map((clo) => {
                                        const total = calculateCloTotal(
                                          clo.CLO_id
                                        );
                                        // ใช้ weight จากฐานข้อมูลโดยตรง
                                        const maxWeight =
                                          cloWeights[clo.CLO_id] || 0;
                                        const isValid = total <= maxWeight;

                                        return (
                                          <td
                                            key={clo.CLO_id}
                                            className={`text-center ${!isValid ? "text-danger" : ""}`}>
                                            {total} / {maxWeight}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="alert alert-info">
                                <i className="fas fa-info-circle me-2"></i>
                                ไม่พบข้อมูล CLO สำหรับรายวิชานี้
                                กรุณาเลือกรายวิชาและตอนเรียนให้ถูกต้องเพื่อดูข้อมูล
                                CLO
                              </div>
                            )}

                            <h6 className="mt-4 mb-3">รายชื่อนักเรียน</h6>
                            <div className="d-flex justify-content-end mb-3">
                              <button
                                className="btn btn-info text-white btn-sm"
                                onClick={() => {
                                  setCurrentStep(3); // ไปยังขั้นตอนนำเข้านักเรียน
                                  setSelectedAssignment(null); // ปิด modal
                                }}>
                                <i className="fas fa-plus me-2"></i>
                                เพิ่มรายชื่อนักเรียน
                              </button>
                            </div>
                            {importedStudents.length > 0 ? (
                              <div
                                className="table-responsive"
                                style={{
                                  maxHeight: "300px",
                                  overflowY: "auto",
                                }}>
                                <table className="table table-sm table-striped">
                                  <thead className="sticky-top bg-light">
                                    <tr>
                                      <th style={{ width: "60px" }}>ลำดับ</th>
                                      <th style={{ width: "150px" }}>
                                        รหัสนักศึกษา
                                      </th>
                                      <th>ชื่อ-นามสกุล</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {importedStudents.map((student, index) => (
                                      <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{student.student_id}</td>
                                        <td>{student.name}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="alert alert-warning">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                ยังไม่มีรายชื่อนักเรียนในงานนี้ คลิกปุ่ม
                                "เพิ่มรายชื่อนักเรียน" เพื่อนำเข้ารายชื่อ
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setSelectedAssignment(null)}>
                          ปิด
                        </button>
                        <button
                          type="button"
                          className="btn btn-warning me-2"
                          onClick={() => {
                            // ตั้งค่าข้อมูลที่จำเป็นสำหรับการแก้ไข CLO ในขั้นตอนที่ 2
                            setAssignmentName(
                              selectedAssignment.assignment_name || ""
                            );
                            setSelectedCourseId(
                              selectedAssignment.course_id?.toString() || ""
                            );
                            setSelectedSectionId(
                              selectedAssignment.section_id?.toString() || ""
                            );
                            setSelectedSemesterId(
                              selectedAssignment.semester_id?.toString() || ""
                            );
                            setSelectedYear(
                              selectedAssignment.year?.toString() || ""
                            );
                            setCurrentAssignmentId(
                              selectedAssignment.assignment_id
                            );

                            // ดึงข้อมูลคะแนน CLO สำหรับการแก้ไขใน Step 2
                            const prepareDataForEdit = async () => {
                              try {
                                // ดึงข้อมูล CLO สำหรับรายวิชานี้
                                const cloResponse = await axios.get(
                                  "/course_clo",
                                  {
                                    params: {
                                      program_id: selectedAssignment.program_id,
                                      course_id: selectedAssignment.course_id,
                                      semester_id:
                                        selectedAssignment.semester_id,
                                      section_id: selectedAssignment.section_id,
                                      year: selectedAssignment.year,
                                    },
                                  }
                                );

                                if (
                                  cloResponse.data &&
                                  Array.isArray(cloResponse.data)
                                ) {
                                  setCLOs(cloResponse.data);

                                  // ดึงข้อมูลรายละเอียด Assignment เพื่อให้ได้คะแนน CLO
                                  const assignmentResponse = await axios.get(
                                    `/api/get_assignment_detail/${selectedAssignment.assignment_id}`
                                  );

                                  if (
                                    assignmentResponse.data &&
                                    assignmentResponse.data.success
                                  ) {
                                    // สร้าง homework สำหรับการแก้ไขคะแนน
                                    const homeworkData = {
                                      id: selectedAssignment.assignment_id,
                                      name: selectedAssignment.assignment_name,
                                      scores: {},
                                    };

                                    // ใส่คะแนนจากข้อมูลที่ดึงมา
                                    const scores =
                                      assignmentResponse.data.scores || {};
                                    const students =
                                      assignmentResponse.data.students || [];

                                    if (
                                      students.length > 0 &&
                                      Object.keys(scores).length > 0
                                    ) {
                                      // ถ้ามีข้อมูลนักศึกษาและคะแนน
                                      const firstStudentId =
                                        students[0].student_id;
                                      const studentScores =
                                        scores[firstStudentId] || {};

                                      // ใช้ CLO ที่พบในการเชื่อมโยงคะแนน
                                      assignmentResponse.data.clos.forEach(
                                        (clo) => {
                                          homeworkData.scores[clo.clo_id] =
                                            studentScores[
                                            clo.assignment_clo_id
                                            ] || 0;
                                        }
                                      );

                                      // ตั้งค่า CLO weight
                                      const cloWeightsObj = {};
                                      assignmentResponse.data.clos.forEach(
                                        (clo) => {
                                          cloWeightsObj[clo.clo_id] =
                                            clo.weight || 0;
                                        }
                                      );
                                      setCloWeights(cloWeightsObj);
                                    } else {
                                      // ถ้าไม่มีข้อมูลคะแนน ให้ตั้งค่าเริ่มต้นเป็น 0 สำหรับทุก CLO
                                      cloResponse.data.forEach((clo) => {
                                        homeworkData.scores[clo.CLO_id] = 0;
                                      });

                                      // ตั้งค่า CLO weight จากข้อมูล CLO
                                      const cloWeightsObj = {};
                                      cloResponse.data.forEach((clo) => {
                                        cloWeightsObj[clo.CLO_id] =
                                          clo.weight || 0;
                                      });
                                      setCloWeights(cloWeightsObj);
                                    }

                                    // ตั้งค่า homeworks สำหรับการแก้ไข
                                    setHomeworks([homeworkData]);
                                  }
                                }

                                // เคลียร์ validation errors
                                setValidationErrors({});
                              } catch (error) {
                                console.error(
                                  "เกิดข้อผิดพลาดในการเตรียมข้อมูล:",
                                  error
                                );
                              }
                            };

                            // เรียกใช้ฟังก์ชันเตรียมข้อมูล
                            prepareDataForEdit();

                            // เปลี่ยนไปยังขั้นตอนที่ 2
                            setCurrentStep(2);

                            // ปิด modal
                            setSelectedAssignment(null);
                          }}>
                          <i className="fas fa-edit me-1"></i> แก้ไขคะแนน CLO
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            // นำข้อมูลมาแสดงในฟอร์มเพื่อแก้ไข
                            setAssignmentName(
                              selectedAssignment.assignment_name || ""
                            );

                            // ตั้งค่าข้อมูลฟิลเตอร์ให้ตรงกับ Assignment ที่เลือก
                            setSelectedUniversity(
                              selectedAssignment.university_id?.toString() || ""
                            );
                            setSelectedFaculty(
                              selectedAssignment.faculty_id?.toString() || ""
                            );
                            setSelectedProgram(
                              selectedAssignment.program_id?.toString() || ""
                            );
                            setSelectedCourseId(
                              selectedAssignment.course_id?.toString() || ""
                            );
                            setSelectedSectionId(
                              selectedAssignment.section_id?.toString() || ""
                            );
                            setSelectedSemesterId(
                              selectedAssignment.semester_id?.toString() || ""
                            );
                            setSelectedYear(
                              selectedAssignment.year?.toString() || ""
                            );

                            // ตั้งค่าข้อมูลสำหรับฟอร์มแก้ไข
                            setEditData({
                              assignment_name:
                                selectedAssignment.assignment_name || "",
                              course_name: selectedAssignment.course_name || "",
                              section_id: selectedAssignment.section_id || "",
                              semester_id: selectedAssignment.semester_id || "",
                              year: selectedAssignment.year || "",
                              program_id: selectedAssignment.program_id || "",
                              faculty_id: selectedAssignment.faculty_id || "",
                              university_id:
                                selectedAssignment.university_id || "",
                            });

                            // ตั้งค่า assignment ID สำหรับอัพเดต
                            setCurrentAssignmentId(
                              selectedAssignment.assignment_id
                            );

                            // เปลี่ยนไปยังขั้นตอนที่ 1 (แก้ไขข้อมูลทั่วไป)
                            setCurrentStep(1);

                            // เปิดโหมดแก้ไข
                            setIsEditing(true);

                            // ปิด modal
                            setSelectedAssignment(null);
                          }}>
                          <i className="fas fa-pen me-1"></i> แก้ไขข้อมูลทั่วไป
                        </button>
                        {isEditing ? (
                          // แสดงฟอร์มแก้ไขเมื่ออยู่ในโหมดการแก้ไข
                          <div style={styles.editForm}>
                            <h1 className="btn btn-warning">
                              แก้ไขข้อมูล Assignment
                            </h1>

                            <div style={styles.formGroup}>
                              <label style={styles.label}>
                                ชื่อ Assignment:
                              </label>
                              <input
                                type="text"
                                name="assignment_name"
                                value={editData.assignment_name}
                                onChange={handleEditChange}
                                style={styles.input}
                              />
                            </div>

                            <div style={styles.formGroup}>
                              <label style={styles.label}>ชื่อวิชา:</label>
                              <input
                                type="text"
                                name="course_name"
                                value={editData.course_name}
                                onChange={handleEditChange}
                                style={styles.input}
                              />
                            </div>

                            <div style={styles.formGroup}>
                              <label style={styles.label}>เซคชัน:</label>
                              <input
                                type="text"
                                name="section_id"
                                value={editData.section_id}
                                onChange={handleEditChange}
                                style={styles.input}
                              />
                            </div>

                            <div style={styles.formGroup}>
                              <label style={styles.label}>ภาคการศึกษา:</label>
                              <input
                                type="text"
                                name="semester_id"
                                value={editData.semester_id}
                                onChange={handleEditChange}
                                style={styles.input}
                              />
                            </div>

                            <div style={styles.formGroup}>
                              <label style={styles.label}>ปีการศึกษา:</label>
                              <input
                                type="text"
                                name="year"
                                value={editData.year}
                                onChange={handleEditChange}
                                style={styles.input}
                              />
                            </div>

                            <div style={styles.buttonContainer}>
                              <button
                                style={
                                  saving
                                    ? styles.primaryButtonDisabled
                                    : styles.primaryButton
                                }
                                onClick={saveEditAssignment}
                                disabled={saving}>
                                {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                              </button>

                              <button
                                style={styles.cancelButton}
                                onClick={cancelEdit}
                                disabled={saving}>
                                ยกเลิก
                              </button>
                            </div>
                          </div>
                        ) : (
                          // แสดงข้อมูล Assignment ปกติ
                          <>
                            <h1 style={styles.heading}>
                              {assignment.assignment_name} - คะแนนนักเรียน
                            </h1>

                            <div style={styles.assignmentInfo}>
                              <p>
                                <strong>วิชา:</strong> {assignment.course_name}
                                &nbsp;&nbsp;|&nbsp;&nbsp;
                                <strong>เซคชัน:</strong> {assignment.section_id}
                                &nbsp;&nbsp;|&nbsp;&nbsp;
                                <strong>ภาคการศึกษา:</strong>{" "}
                                {assignment.semester_id}/{assignment.year}
                              </p>
                            </div>

                            <div style={styles.buttonContainer}>
                              {/* เพิ่มปุ่มแก้ไข Assignment */}
                              <button
                                style={styles.editButton}
                                onClick={() => setIsEditing(true)}>
                                แก้ไขข้อมูล Assignment
                              </button>

                              <button
                                style={
                                  saving
                                    ? styles.primaryButtonDisabled
                                    : styles.primaryButton
                                }
                                onClick={saveScores}
                                disabled={saving}>
                                {saving ? "กำลังบันทึก..." : "บันทึกคะแนน"}
                              </button>

                              <label htmlFor="excel-file-input">
                                <button
                                  style={styles.secondaryButton}
                                  onClick={() =>
                                    document
                                      .getElementById("excel-file-input")
                                      .click()
                                  }>
                                  นำเข้าจาก Excel
                                </button>
                              </label>
                              <input
                                id="excel-file-input"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileImport}
                                style={styles.hidden}
                              />

                              <button
                                style={styles.outlineButton}
                                onClick={downloadExcelTemplate}>
                                ดาวน์โหลดเทมเพลต Excel
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
