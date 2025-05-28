import { useTranslation } from "react-i18next";
import styles from "./styles/CloTable.module.css";
import { useState } from "react";
import EditCloModal from "./EditClo";
import axios from "./../axios";

export default function CloTable({ cloArray, role }) {
  const { t } = useTranslation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClo, setSelectedClo] = useState({
    clo_id: 1,
    CLO_code: "CLO1",
    CLO_name: "อธิบายแนวคิด...",
    CLO_engname: "Describe the concept...",
  });
  const handleSave = async (updatedClo) => {
    try {
      await axios.put(
        "/api/clo/",
        { updatedClo },
        { params: updatedClo.clo_id }
      );
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th className={styles.header}>{t("CLO Code")}</th>
            <th className={styles.header}>{t("CLO Name")}</th>
            {role === "Curriculum Admin" && (
              <th className={styles.header}>{t("Actions")}</th>
            )}
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {cloArray.map((clo, index) => (
            <tr key={index} className={styles.row}>
              <td className={styles.cell}>
                <div className={styles.cellContentCenter}>{clo.CLO_code}</div>
              </td>
              <td className={styles.cell}>
                <div className={styles.cellContent}>{clo.CLO_name}</div>
                {clo.CLO_engname && (
                  <>
                    <div className={styles.divider}></div>
                    <div className={styles.cellSecondary}>
                      {clo.CLO_engname}
                    </div>
                  </>
                )}
              </td>
              {role === "Curriculum Admin" && (
                <td className={styles.cell}>
                  <button
                    className={styles.btnEdit}
                    onClick={() => {
                      setSelectedClo({
                        clo_id: clo.CLO_id,
                        CLO_code: clo.CLO_code,
                        CLO_name: clo.CLO_name,
                        CLO_engname: clo.CLO_engname,
                      });
                      setShowEditModal(true);
                    }}>
                    {t("Edit")}
                  </button>
                  <button className={styles.btnDelete}>{t("Delete")}</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {showEditModal && (
        <EditCloModal
          clo={selectedClo}
          onSave={handleSave}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
