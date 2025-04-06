import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
// import HttpBackend from 'i18next-http-backend';
// import { Translate } from '@google-cloud/translate/build/src/v2';
// import React, { useState, useEffect } from 'react';


const resources = {
    th: {
        translation: {
            "CourseInfo": "ข้อมูลหลักสูตร",
            "ViewChart": "แผนภูมิ",
            "Assignment": "การบ้าน",
            "Program": "หลักสูตร",
            "Edit Program": "แก้ไขหลักสูตร",
            "Edit PLO": "แก้ไข PLO",
            "Course": "รายวิชา",
            "Edit Course": "แก้ไขรายวิชา",
            "Edit CLO": "แก้ไข CLO",
            "About": "เกี่ยวกับ",
            "Select Language": "เลือกภาษา"
        }
    },
    en: {
        translation: {
            "CourseInfo": "Course Information",
            "ViewChart": "View Chart",
            "Assignment": "Assignment",
            "Program": "Program",
            "Edit Program": "Edit Program",
            "Edit PLO": "Edit PLO",
            "Course": "Course",
            "Edit Course": "Edit Course",
            "Edit CLO": "Edit CLO",
            "About": "About",
            "Select Language": "Select Language"
        }
    },
    ch: {
        translation: {
            "CourseInfo": "课程信息",
            "ViewChart": "查看图表",
            "Assignment": "任务",
            "Program": "研究课程",
            "Edit Program": "教学课程",
            "Edit PLO": "编辑 PLO",
            "Course": "课程",
            "Edit Course": "编辑课程",
            "Edit CLO": "编辑 CLO",
            "About": "關於",
            "Select Language": "選擇語言"
        }
    }
};

// const translate = new Translate({ key: 'YOUR_GOOGLE_API_KEY' });

// export const translateText = async (text, targetLang) => {
//     try {
//         const [translation] = await translate.translate(text, targetLang);
//         return translation;
//     } catch (error) {
//         console.error('Translation error:', error);
//         return text;
//     }
// };


// i18n
//     .use(HttpBackend) // โหลดคำแปลจาก API หรือไฟล์ JSON
//     .use(LanguageDetector) // ตรวจจับภาษาของเบราว์เซอร์
//     .use(initReactI18next)
//     .init({
//         resources,
//         fallbackLng: 'en',
//         interpolation: {
//             escapeValue: false
//         },
//         backend: {
//             loadPath: '/locales/{{lng}}.json' // โหลดไฟล์ JSON ถ้ามี
//         }
//     });

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
