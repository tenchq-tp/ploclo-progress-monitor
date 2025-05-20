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

const HorizontalBarChart = ({ datas }) => {
  const labels = datas.map((item) => item.CLO_code);
  const scores = datas.map((item) => parseFloat(item.clo_score));
  const cloNames = datas.map((item) => item.CLO_name);

  const data = {
    labels,
    datasets: [
      {
        label: "CLO Score",
        data: scores,
        backgroundColor: "rgba(75, 192, 192, 0.7)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: "y", // <-- ทำเป็น horizontal bar
    responsive: true,
    plugins: {
      legend: { display: true },
      title: {
        display: true,
        text: "CLO Scores",
        font: { size: 18 },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const index = context.dataIndex;
            return `${cloNames[index]}: ${context.parsed.x}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 1,
        ticks: {
          stepSize: 0.05,
        },
      },
      y: {
        ticks: {
          autoSkip: false,
        },
        barPercentage: 0.5,
        categoryPercentage: 0.6,
      },
    },
  };

  return <Bar data={data} options={options} />;
};

export default HorizontalBarChart;
