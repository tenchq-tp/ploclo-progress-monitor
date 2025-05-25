import { useState } from "react";
import styles from "./styles/EditClo.module.css";
import { useTranslation } from "react-i18next";

export default function EditCloModal({ clo, onSave, onClose }) {
  const { t } = useTranslation();

  const [cloCode, setCloCode] = useState(clo?.CLO_code || "");
  const [cloName, setCloName] = useState(clo?.CLO_name || "");
  const [cloEngName, setCloEngName] = useState(clo?.CLO_engname || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedClo = {
      ...clo,
      CLO_code: cloCode,
      CLO_name: cloName,
      CLO_engname: cloEngName,
    };
    onSave(updatedClo);
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>{t("Edit CLO")}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t("CLO Code")}</label>
            <input
              type="text"
              value={cloCode}
              onChange={(e) => setCloCode(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              {t("CLO Name (Local Language)")}
            </label>
            <textarea
              value={cloName}
              onChange={(e) => setCloName(e.target.value)}
              className={styles.textarea}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t("CLO Name (English)")}</label>
            <textarea
              value={cloEngName}
              onChange={(e) => setCloEngName(e.target.value)}
              className={styles.textarea}
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.btnSave}>
              {t("Save")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnCancel}>
              {t("Cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
