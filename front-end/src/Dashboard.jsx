import axios from "./axios";
import BarChartExample from "./Component/Dashboard/CloAverage";
import { useEffect, useState } from "react";
import HorizontalBarChart from "./Component/Dashboard/CloScores";
import StudentCloPloChart from "./Component/Dashboard/StudentPloCloChart";
import { Box, Typography, Grid, Paper } from "@mui/material";

export default function Dashboard() {
  const [datas, setDatas] = useState([]);
  const [closScore, setClosScore] = useState([]);
  const [studentPloClo, setStudentPloClo] = useState([]);

  async function fetchData() {
    try {
      const result = await axios.get(
        "/api/dashboard/clo-average?course_id=305100"
      );
      setDatas(result.data);
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchCloScores() {
    try {
      const result = await axios.get(
        "/api/dashboard/student/50565600/clo-scores?course_id=3051234"
      );
      setClosScore(result.data);
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchStudentPloClo() {
    try {
      const result = await axios.get("/api/dashboard/student-score/50565600");
      console.log(result.data);
      setStudentPloClo(result.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchData();
    fetchCloScores();
    fetchStudentPloClo();
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        สรุปผลการประเมินผลลัพธ์การเรียนรู้ (Learning Outcome Dashboard)
      </Typography>

      <Grid container spacing={4}>
        {/* Section 1: CLO & PLO ของนักเรียน */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              ผลการเรียนรู้ของนักเรียน (CLO / PLO)
            </Typography>
            <StudentCloPloChart studentData={studentPloClo} />
          </Paper>
        </Grid>

        {/* Section 2: คะแนน CLO แบบแนวนอน */}
        <Grid item xs={12} md={6}>
          <Paper elevation={6} sx={{ p: 3 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ color: "#0d47a1", fontWeight: "bold" }}>
              📊 คะแนน CLO รายตัวของนักเรียน
            </Typography>
            <HorizontalBarChart datas={closScore} />
          </Paper>
        </Grid>

        {/* Section 3: ค่าเฉลี่ย CLO ของทุกคน */}
        <Grid item xs={12} md={6}>
          <Paper elevation={6} sx={{ p: 3 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ color: "#33691e", fontWeight: "bold" }}>
              🌟 ค่าเฉลี่ยคะแนน CLO ของนักเรียนทั้งหมด
            </Typography>
            <BarChartExample closAverage={datas} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
