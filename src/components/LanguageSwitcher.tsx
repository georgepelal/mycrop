import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language || 'en';
  }, [i18n.language]);

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <Globe className="w-4 h-4 text-slate-500" />
      <select 
        value={i18n.resolvedLanguage || 'en'} 
        onChange={changeLanguage}
        className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
        <option value="pt">Português</option>
        <option value="zh">中文</option>
        <option value="hi">हिन्दी</option>
        <option value="ru">Русский</option>
        <option value="ar">العربية</option>
        <option value="el">Ελληνικά</option>
      </select>
    </div>
  );
}
