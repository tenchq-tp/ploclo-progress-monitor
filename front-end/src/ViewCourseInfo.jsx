// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { useTranslation } from "react-i18next"; // เพิ่มการ import useTranslation

// function ViewCourseInfo() {
//   const [programs, setPrograms] = useState([]);
//   const [selectedProgram, setSelectedProgram] = useState(null);
//   const [courses, setCourses] = useState([]);
//   const { t, i18n } = useTranslation(); // เรียกใช้ hook useTranslation และดึง i18n object

//   useEffect(() => {
//     axios.get("http://localhost:8000/api/program")
//       .then(response => {
//         setPrograms(response.data);
//       })
//       .catch(error => {
//         console.error("There was an error fetching the data!", error);
//       });
//   }, []);

//   const handleProgramClick = (program) => {
//     setSelectedProgram(program);
//     setCourses([]); // เคลียร์ courses ก่อนดึงข้อมูลใหม่
//     fetchCourses(program.program_id);
//   };

//   const fetchCourses = async (programId) => {
//     try {
//       const response = await axios.get("http://localhost:8000/program_courses_detail", {
//         params: { program_id: programId }
//       });
//       setCourses(response.data || []);
//     } catch (err) {
//       console.error("Error fetching courses:", err);
//     }
//   };

//   return (
//     <div className="app">
//       <main>
//         <div>
//           <h1>{t('Course Information')}</h1>
//           <ul>
//             {programs.map((program, index) => (
//               <li 
//                 key={index} 
//                 onClick={() => handleProgramClick(program)} 
//                 style={{ 
//                   cursor: "pointer",
//                 }}
//                 className="program-item"
//               >
//                 {i18n.language === 'th' ? program.program_name_th : program.program_name}
//               </li>
//             ))}
//           </ul>
//           {selectedProgram && (
//             <div>
//               <h1>{t('Courses in')} {i18n.language === 'th' ? selectedProgram.program_name_th : selectedProgram.program_name}</h1>
//               <ul>
//                 {courses.length > 0 ? (
//                   courses.map((course, index) => (
//                     <li key={index}>{course.course_name}</li>
//                   ))
//                 ) : (
//                   <li>{t('No courses available')}</li>
//                 )}
//               </ul>
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }

// export default ViewCourseInfo;