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

const rawData = [
  {
    CLO_id: 9,
    CLO_code: "CLO2",
    CLO_name: "มีความรู้ที่กว้างขวาง...",
    average_clo_score: "0.2012000000",
  },
  {
    CLO_id: 10,
    CLO_code: "CLO3",
    CLO_name: "ประยุกต์ใช้ทักษะและความเข้าใจ...",
    average_clo_score: "0.1006000000",
  },
  {
    CLO_id: 12,
    CLO_code: "CLO5",
    CLO_name: "สามารถสื่อสาร วิเคราะห์ สังเคราะห์...",
    average_clo_score: "0.1509000000",
  },
];

const BarChartExample = ({ closAverage }) => {
  const labels = closAverage.map((item) => item.CLO_code);
  const scores = closAverage.map((item) => parseFloat(item.average_clo_score));

  const data = {
    labels,
    datasets: [
      {
        label: "Average CLO Score",
        data: scores,
        backgroundColor: "rgba(54, 162, 235, 0.7)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: {
        display: true,
        text: "Average CLO Scores",
        font: { size: 18 },
      },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1, // เพราะคะแนนเฉลี่ยน่าจะไม่เกิน 1
        ticks: {
          stepSize: 0.1,
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
};

export default BarChartExample;
