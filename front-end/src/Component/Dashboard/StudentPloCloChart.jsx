import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const studentData = {
  student_id: "50565600",
  year: 2025,
  clo_scores: [
    { clo_id: 1, total_score_clo: "11.000000" },
    { clo_id: 2, total_score_clo: "18.700000" },
    { clo_id: 3, total_score_clo: "9.900000" },
    { clo_id: 4, total_score_clo: "11.000000" },
    { clo_id: 5, total_score_clo: "4.400000" },
    { clo_id: 7, total_score_clo: "9.900000" },
    { clo_id: 9, total_score_clo: "0.400000" },
    { clo_id: 10, total_score_clo: "0.200000" },
    { clo_id: 12, total_score_clo: "0.300000" },
  ],
  plo_scores: [
    { PLO_id: 1, plo_score: 2.2 },
    { PLO_id: 2, plo_score: 7.7 },
    { PLO_id: 3, plo_score: 3.7 },
    { PLO_id: 4, plo_score: 0.3 },
    { PLO_id: 11, plo_score: 3.08 },
    { PLO_id: 14, plo_score: 9.9 },
  ],
};

const StudentCloPloChart = () => {
  const cloLabels = studentData.clo_scores.map((clo) => `CLO${clo.clo_id}`);
  const cloValues = studentData.clo_scores.map((clo) =>
    parseFloat(clo.total_score_clo)
  );

  const ploLabels = studentData.plo_scores.map((plo) => `PLO${plo.PLO_id}`);
  const ploValues = studentData.plo_scores.map((plo) =>
    parseFloat(plo.plo_score)
  );

  const cloChartData = {
    labels: cloLabels,
    datasets: [
      {
        label: "CLO Scores",
        data: cloValues,
        backgroundColor: "rgba(54, 162, 235, 0.7)",
      },
    ],
  };

  const ploChartData = {
    labels: ploLabels,
    datasets: [
      {
        label: "PLO Scores",
        data: ploValues,
        backgroundColor: "rgba(255, 159, 64, 0.7)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Student CLO / PLO Performance" },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div>
      <h2>CLO Scores</h2>
      <Bar data={cloChartData} options={chartOptions} />

      <h2 style={{ marginTop: "40px" }}>PLO Scores</h2>
      <Bar data={ploChartData} options={chartOptions} />
    </div>
  );
};

export default StudentCloPloChart;
