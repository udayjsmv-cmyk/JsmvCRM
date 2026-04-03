import React, { createContext, useState, useEffect } from "react";

// Translation dictionary
export const translations = {
  en: {
    appearance: "Appearance",
    theme: "Theme",
    light: "🌞 Light",
    dark: "🌙 Dark",
    fontSize: "Font Size",
    fontStyle: "Font Style",
    preferences: "Preferences",
    notifications: "Enable Notifications",
    language: "Language",
    system: "System",
    profileSettings: "Go to Profile Settings",
    exportData: "Export Data Backup",
    resetData: "Reset All Data",
    saveSettings: "💾 Save Settings",
    dashboard: "Dashboard",
    role: "Role",
  },
  hi: {
    appearance: "रूपरेखा",
    theme: "थीम",
    light: "🌞 हल्का",
    dark: "🌙 अंधेरा",
    fontSize: "फ़ॉन्ट आकार",
    fontStyle: "फ़ॉन्ट शैली",
    preferences: "वरीयताएँ",
    notifications: "सूचनाएँ सक्षम करें",
    language: "भाषा",
    system: "सिस्टम",
    profileSettings: "प्रोफ़ाइल सेटिंग्स पर जाएं",
    exportData: "डेटा बैकअप निर्यात करें",
    resetData: "सभी डेटा रीसेट करें",
    saveSettings: "💾 सेटिंग्स सहेजें",
    dashboard: "डैशबोर्ड",
    role: "भूमिका",
  },
  es: {
    appearance: "Apariencia",
    theme: "Tema",
    light: "🌞 Claro",
    dark: "🌙 Oscuro",
    fontSize: "Tamaño de Fuente",
    fontStyle: "Estilo de Fuente",
    preferences: "Preferencias",
    notifications: "Habilitar Notificaciones",
    language: "Idioma",
    system: "Sistema",
    profileSettings: "Ir a Configuración de Perfil",
    exportData: "Exportar Respaldo de Datos",
    resetData: "Restablecer Todos los Datos",
    saveSettings: "💾 Guardar Configuración",
    dashboard: "Tablero",
    role: "Rol",
  },
  fr: {
    appearance: "Apparence",
    theme: "Thème",
    light: "🌞 Clair",
    dark: "🌙 Sombre",
    fontSize: "Taille de Police",
    fontStyle: "Style de Police",
    preferences: "Préférences",
    notifications: "Activer les notifications",
    language: "Langue",
    system: "Système",
    profileSettings: "Aller aux Paramètres",
    saveSettings: "💾 Enregistrer",
  },
  de: {
    appearance: "Aussehen",
    theme: "Thema",
    light: "🌞 Hell",
    dark: "🌙 Dunkel",
    fontSize: "Schriftgröße",
    fontStyle: "Schriftstil",
    preferences: "Einstellungen",
    notifications: "Benachrichtigungen aktivieren",
    language: "Sprache",
    system: "System",
    profileSettings: "Zu den Profileinstellungen",
    saveSettings: "💾 Speichern",
  },
};

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en");
  const [fontSize, setFontSize] = useState("medium");
  const [fontStyle, setFontStyle] = useState("sans-serif");

  const applySettings = (themeValue, fontSizeValue, fontStyleValue) => {
    document.documentElement.classList.toggle("dark", themeValue === "dark");
    const sizeMap = { small: "14px", medium: "16px", large: "18px" };
    document.documentElement.style.fontSize = sizeMap[fontSizeValue] || "16px";
    document.body.style.fontFamily = fontStyleValue || "sans-serif";
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    const savedLanguage = localStorage.getItem("language") || "en";
    const savedFontSize = localStorage.getItem("fontSize") || "medium";
    const savedFontStyle = localStorage.getItem("fontStyle") || "sans-serif";

    setTheme(savedTheme);
    setLanguage(savedLanguage);
    setFontSize(savedFontSize);
    setFontStyle(savedFontStyle);

    applySettings(savedTheme, savedFontSize, savedFontStyle);
  }, []);

  const saveSettings = (newTheme, newLanguage, newFontSize, newFontStyle) => {
    setTheme(newTheme);
    setLanguage(newLanguage);
    setFontSize(newFontSize);
    setFontStyle(newFontStyle);

    localStorage.setItem("theme", newTheme);
    localStorage.setItem("language", newLanguage);
    localStorage.setItem("fontSize", newFontSize);
    localStorage.setItem("fontStyle", newFontStyle);

    applySettings(newTheme, newFontSize, newFontStyle);
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        language,
        fontSize,
        fontStyle,
        setTheme,
        setLanguage,
        setFontSize,
        setFontStyle,
        saveSettings,
        t: translations[language] || translations.en,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
