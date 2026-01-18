import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './MonthlyChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function MonthlyChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>아직 데이터가 없습니다. 책을 추가하면 차트가 표시됩니다.</p>
      </div>
    );
  }

  const labels = data.map(item => item.month);
  const counts = data.map(item => item.count);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: '읽은 책 수',
        data: counts,
        backgroundColor: 'rgba(52, 152, 219, 0.8)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <Bar data={chartData} options={options} />
    </div>
  );
}

export default MonthlyChart;
