import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { useClipboard } from 'use-clipboard-copy';
import { Button, Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
// import ViewCourseInfo from "../ViewCourseInfo.jsx";
import DataTable from './DataTable.jsx';

function StudentData() {
  const [typeError, setTypeError] = useState(null);
  const clipboard = useClipboard();
  const { t } = useTranslation();

  // State for parsed and uploaded data
  const [excelData, setExcelData] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [students, setStudents] = useState([]); // State for fetched students
  const [show, setShow] = useState(false);

  // Function to fetch student data from the backend
const fetchStudents = async () => {
  try {
    const response = await axios.get('/students');
    const data = response.data;

    if (Array.isArray(data)) {
      setStudents(data);
    } else if (data.students && Array.isArray(data.students)) {
      setStudents(data.students);
    } else {
      setStudents([data]);
    }
  } catch (error) {
    console.error('Error fetching students:', error);
    alert('Failed to fetch student data. Please check the API or try again later.');
  }
};




const handleDeleteStudent = async (studentid) => {
  try {
    const response = await axios.delete(`/students/${studentid}`);

    if (response.status !== 200) {
      throw new Error(response.data || 'Failed to delete student');
    }

    alert('Student deleted successfully');

    // ลบข้อมูลนักเรียนออกจาก state
    setStudents((prevStudents) =>
      prevStudents.filter(student => student.studentid !== studentid)
    );
  } catch (error) {
    console.error('Error deleting student:', error);
    alert(error.response?.data || error.message || 'Failed to delete student');
  }
};





  // Fetch students on component mount
  useEffect(() => {
    fetchStudents(); // Fetch student data when component is mounted
  }, []);

  // Function to handle file upload and parse it
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.includes('sheet')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        setParsedData(json);
        setExcelData(json);  // Set the uploaded data to excelData for uploading
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Please upload a valid Excel file (.xlsx, .xls)');
    }
  };


  const handleUploadButtonClick = async () => {
    if (excelData) {
      try {
        const response = await axios.post('/insert', excelData, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        alert('Data Uploaded Successfully!');
        fetchStudents(); // รีเฟรชข้อมูลหลังอัปโหลด
      } catch (error) {
        console.error('Error:', error);
        alert(error.response?.data || error.message || 'Upload failed');
      }
    } else {
      console.error('No data to upload');
      alert('No data to upload');
    }
  };

  const handleClipboardButtonClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const json = convertExcelDataToJson(text);

      if (json) {
        setParsedData(json);
        setExcelData(json); // Store clipboard data for uploading
      }
    } catch (error) {
      console.error('Error reading from clipboard:', error);
    }
  };

  const convertExcelDataToJson = (text) => {
    try {
      const rows = text.trim().split('\n');
      const headers = rows[0].split('\t');

      const jsonData = rows.slice(1).map((row) => {
        const values = row.split('\t');
        return headers.reduce((acc, header, index) => {
          acc[header] = values[index];
          return acc;
        }, {});
      });

      return jsonData;
    } catch (error) {
      console.error('Error converting text to JSON:', error);
      return null;
    }
  };

const handleSaveButtonClick = async () => {
  if (parsedData && parsedData.length > 0) {
    try {
      const response = await axios.post('/insert', parsedData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      alert('Data saved successfully!');
      fetchStudents(); // รีเฟรชข้อมูลหลังบันทึก
    } catch (error) {
      console.error('Save Error:', error);
      alert(error.response?.data || error.message || 'Save failed');
    }
  } else {
    alert('No data to save');
  }
};


  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Button variant="primary" onClick={handleShow}>
        {t('ImportData')}
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{t('ImportData')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            type="file"
            aria-describedby="inputGroupFileAddon04"
            aria-label="Upload"
            onChange={handleFileUpload}
            accept=".xlsx"
          />
          
          <Button variant="outline-secondary" className="w-100 mb-3" onClick={handleUploadButtonClick}>
            {t('uploadFile')}
          </Button>
          <Button variant="outline-secondary" className="w-100" onClick={handleClipboardButtonClick}>
            {t('clipboard')}
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>{t('close')}</Button>
        </Modal.Footer>
      </Modal>

      {/* Display Students */}
      <div className="student-list mt-4">
  <h3>{t('YourStudents')}</h3>
  <ul className="list-group">
    {students.length > 0 ? (
      students.map(student => (
        <li key={student.studentid} className="list-group-item d-flex justify-content-between align-items-center">
          <div>
          <strong>{student.studentid}</strong> {/* ชื่อ */}
          
            <strong>{student.name}</strong> {/* ชื่อ */}
            <br />
            <small>{student.course}</small> {/* คอร์ส */}
          </div>
          <Button variant="danger" size="sm" onClick={() => handleDeleteStudent(student.studentid)}>
            {t('delete')}
          </Button>
        </li>
      ))
    ) : (
      <li className="list-group-item">{t('noStudents')}</li> // ข้อความเมื่อไม่มีข้อมูล
    )}
  </ul>
</div>


      <div className="table-container mt-4">
        <DataTable data={excelData || parsedData} />
        <Button variant="success" className="mt-3" onClick={handleSaveButtonClick}>
          {t('saveData')}
        </Button>
      </div>
    </>
  );
}

export default StudentData;
