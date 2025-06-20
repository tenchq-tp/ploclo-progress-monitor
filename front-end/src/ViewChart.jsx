import React, { useEffect, useState } from "react";
import axios from "./axios";
import LoadingSpinner from "./Component/dashboard/LoadingSpinner";
import ErrorAlert from "./Component/dashboard/ErrorAlert";

function ViewChart() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cloSummary, setCloSummary] = useState([]);
  const [ploSummary, setPloSummary] = useState([]);
  const [cloStats, setCloStats] = useState([]);
  const [ploStats, setPloStats] = useState([]);

  useEffect(() => {
    fetchSummary();
  }, []);

  async function fetchSummary() {
    setLoading(true);
    setError(null);
    try {
      const [cloRes, ploRes, cloStatRes, ploStatRes] = await Promise.all([
        axios.get("/api/dashboard/clo-summary"),
        axios.get("/api/dashboard/plo-summary"),
        axios.get("/api/dashboard/clo-statistics"),
        axios.get("/api/dashboard/plo-statistics"),
      ]);

      setCloSummary(cloRes.data);
      setPloSummary(ploRes.data);
      setCloStats(cloStatRes.data);
      setPloStats(ploStatRes.data);
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูลสรุป CLO/PLO");
    } finally {
      setLoading(false);
    }
  }

  function transformWide(data, keyField, codeField, scoreField) {
    const grouped = {};
    const codes = new Set();

    data.forEach((item) => {
      const id = item[keyField];
      const name = item.student_name || "";
      const code = item[codeField];
      const score = item[scoreField];

      if (!grouped[id]) {
        grouped[id] = { student_id: id, student_name: name };
      }

      const numScore = Number(score);
      grouped[id][code] = !isNaN(numScore) ? numScore : null;

      codes.add(code);
    });

    const sortedCodes = Array.from(codes).sort((a, b) => {
      const aNum = parseInt(a.replace(/\D/g, ""), 10);
      const bNum = parseInt(b.replace(/\D/g, ""), 10);
      return aNum - bNum;
    });

    const rows = Object.values(grouped).map((row) => {
      let total = 0;
      sortedCodes.forEach((code) => {
        const val = row[code];
        if (val != null) total += val;
      });
      return { ...row, __total__: total };
    });

    return { columns: sortedCodes, rows };
  }

  if (loading) return <LoadingSpinner message="กำลังโหลดข้อมูลสรุป..." />;
  if (error) return <ErrorAlert error={error} onRetry={fetchSummary} />;

  const cloTable = transformWide(cloSummary, "student_id", "CLO_code", "clo_score");
  const ploTable = transformWide(ploSummary, "student_id", "PLO_code", "plo_score");

  const findStat = (stats, code) =>
    stats.find((s) => s.CLO_code === code || s.PLO_code === code) || {};

  const formatScore = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? "-" : num.toFixed(4);
  };

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">สรุปคะแนน CLO / PLO ของนักศึกษา</h1>

      {/* CLO Summary */}
      <h3 className="mt-4">CLO Summary</h3>
      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th>Student ID</th>
            <th>ชื่อ - สกุล</th>
            {cloTable.columns.map((clo) => (
              <th key={clo}>{clo}</th>
            ))}
            <th>Total CLO</th>
          </tr>
        </thead>
        <tbody>
          {cloTable.rows.map((row, idx) => (
            <tr key={idx}>
              <td>{row.student_id}</td>
              <td>{row.student_name}</td>
              {cloTable.columns.map((clo) => (
                <td key={clo}>
                  {row[clo] != null ? Number(row[clo]).toFixed(4) : "-"}
                </td>
              ))}
              <td>{Number(row.__total__).toFixed(2)}</td>
            </tr>
          ))}
          <tr className="table-secondary">
            <td colSpan={2}><strong>Max</strong></td>
            {cloTable.columns.map((code) => (
              <td key={`max-${code}`}>
                {formatScore(findStat(cloStats, code).max_score)}

              </td>
            ))}
            <td>-</td>
          </tr>
          <tr className="table-secondary">
            <td colSpan={2}><strong>Min</strong></td>
            {cloTable.columns.map((code) => (
              <td key={`min-${code}`}>
                {formatScore(findStat(cloStats, code).min_score)}

              </td>
            ))}
            <td>-</td>
          </tr>
          <tr className="table-secondary">
            <td colSpan={2}><strong>Avg</strong></td>
            {cloTable.columns.map((code) => (
              <td key={`avg-${code}`}>
                {formatScore(findStat(cloStats, code).avg_score)}

              </td>
            ))}
            <td>-</td>
          </tr>
        </tbody>
      </table>

      {/* PLO Summary */}
      <h3 className="mt-5">PLO Summary</h3>
      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th>Student ID</th>
            <th>ชื่อ - สกุล</th>
            {ploTable.columns.map((plo) => (
              <th key={plo}>{plo}</th>
            ))}
            <th>Total PLO</th>
          </tr>
        </thead>
        <tbody>
          {ploTable.rows.map((row, idx) => (
            <tr key={idx}>
              <td>{row.student_id}</td>
              <td>{row.student_name}</td>
              {ploTable.columns.map((plo) => (
                <td key={plo}>
                  {row[plo] != null ? Number(row[plo]).toFixed(4) : "-"}
                </td>
              ))}
              <td>{Number(row.__total__).toFixed(2)}</td>
            </tr>
          ))}
          <tr className="table-secondary">
            <td colSpan={2}><strong>Max</strong></td>
            {ploTable.columns.map((code) => (
              <td key={`max-${code}`}>
                {formatScore(findStat(ploStats, code).max_score)} 
              </td>
            ))}
            <td>-</td>
          </tr>
          <tr className="table-secondary">
            <td colSpan={2}><strong>Min</strong></td>
            {ploTable.columns.map((code) => (
              <td key={`min-${code}`}>
                {formatScore(findStat(ploStats, code).min_score)} 
              </td>
            ))}
            <td>-</td>
          </tr>
          <tr className="table-secondary">
            <td colSpan={2}><strong>Avg</strong></td>
            {ploTable.columns.map((code) => (
              <td key={`avg-${code}`}>
                {formatScore(findStat(ploStats, code).avg_score)} 
              </td>
            ))}
            <td>-</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default ViewChart;
