import { useEffect, useState } from "react";
import styles from "./DataDisplay.module.css";

export default function ExcelDataDisplay({ dataArray, onClose, onAdd }) {
  const [headers, setHeaders] = useState([]);

  useEffect(() => {
    if (dataArray.length > 0) {
      setHeaders(Object.keys(dataArray[0]));
    } else {
      setHeaders([]);
    }
  }, [dataArray]);

  return (
    <div className={styles.popup_container}>
      <div className={styles.content_wrapper}>
        <div className={styles.header}>
          <h2>ข้อมูลจาก Excel</h2>
          <button
            aria-label="Close"
            title="Close"
            onClick={onClose}
            className={`${styles.btn} ${styles.danger}`}>
            ✕
          </button>
        </div>

        {dataArray.length > 0 ? (
          <div className={styles.table_container}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataArray.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {headers.map((header) => (
                      <td key={`${header}-${rowIndex}`}>{row[header]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={`${styles.btn_container}`}>
              <button
                className={`${styles.btn} ${styles.success}`}
                onClick={onAdd}>
                Add
              </button>
            </div>
          </div>
        ) : (
          <p className={styles.empty_message}>ไม่มีข้อมูลให้แสดง</p>
        )}
      </div>
    </div>
  );
}
