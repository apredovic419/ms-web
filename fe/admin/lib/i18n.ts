import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import enTranslation from '../locales/en.json';
import zhTranslation from '../locales/zh.json';

// 定义翻译资源
const resources = {
  en: {
    translation: enTranslation
  },
  zh: {
    translation: zhTranslation
  }
};

// 初始化i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // 默认语言
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React已经安全地处理了转义
    }
  });

export default i18n; 