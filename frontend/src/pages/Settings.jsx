import React, { useContext } from "react";
import { SettingsContext } from "../context/SettingsContext";
import "../App.css";

const Settings = () => {
  const {
    theme,
    fontSize,
    fontStyle,
    language,
    setTheme,
    setFontSize,
    setFontStyle,
    setLanguage,
    saveSettings,
    t,
  } = useContext(SettingsContext);

  return (
    <div className="max-w-4xl mx-auto p-8 mt-10 bg-[#F1FAFA] dark:bg-[#002B3D] rounded-2xl shadow-xl space-y-8 transition-all duration-300">
      <h2 className="text-3xl font-semibold text-[#002B3D] dark:text-[#F1FAFA] mb-6">
        {t.preferences}
      </h2>

      {/* Theme */}
      <div className="flex items-center justify-between bg-white dark:bg-[#004357] p-4 rounded-lg shadow-sm">
        <label className="font-medium text-[#002B3D] dark:text-[#F1FAFA]">{t.theme}</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="border border-[#00B4D8] px-4 py-2 rounded-lg bg-[#F1FAFA] dark:bg-[#002B3D] text-[#002B3D] dark:text-[#F1FAFA] focus:outline-none focus:ring-2 focus:ring-[#00B4D8] transition"
        >
          <option value="light">{t.light}</option>
          <option value="dark">{t.dark}</option>
        </select>
      </div>

      {/* Font Size */}
      <div className="flex items-center justify-between bg-white dark:bg-[#004357] p-4 rounded-lg shadow-sm">
        <label className="font-medium text-[#002B3D] dark:text-[#F1FAFA]">{t.fontSize}</label>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          className="border border-[#00B4D8] px-4 py-2 rounded-lg bg-[#F1FAFA] dark:bg-[#002B3D] text-[#002B3D] dark:text-[#F1FAFA] focus:outline-none focus:ring-2 focus:ring-[#00B4D8] transition"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      {/* Font Style */}
      <div className="flex items-center justify-between bg-white dark:bg-[#004357] p-4 rounded-lg shadow-sm">
        <label className="font-medium text-[#002B3D] dark:text-[#F1FAFA]">{t.fontStyle}</label>
        <select
          value={fontStyle}
          onChange={(e) => setFontStyle(e.target.value)}
          className="border border-[#00B4D8] px-4 py-2 rounded-lg bg-[#F1FAFA] dark:bg-[#002B3D] text-[#002B3D] dark:text-[#F1FAFA] focus:outline-none focus:ring-2 focus:ring-[#00B4D8] transition"
        >
          <option value="sans-serif">Sans-serif</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
        </select>
      </div>

      {/* Language */}
      <div className="flex items-center justify-between bg-white dark:bg-[#004357] p-4 rounded-lg shadow-sm">
        <label className="font-medium text-[#002B3D] dark:text-[#F1FAFA]">{t.language}</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border border-[#00B4D8] px-4 py-2 rounded-lg bg-[#F1FAFA] dark:bg-[#002B3D] text-[#002B3D] dark:text-[#F1FAFA] focus:outline-none focus:ring-2 focus:ring-[#00B4D8] transition"
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
      </div>

      {/* Save Button */}
      <div className="text-center mt-6">
        <button
          onClick={() => saveSettings(theme, language, fontSize, fontStyle)}
          className="px-8 py-3 text-white font-semibold rounded-xl shadow-md transition duration-300 transform hover:scale-105 hover:shadow-[0_0_15px_rgba(0,180,216,0.6)]"
          style={{
            background: "linear-gradient(135deg, #006989, #00B4D8, #7F00FF)", // Blue → Cyan → Purple
            backgroundSize: "300% 300%",
            animation: "gradientShift 6s ease infinite",
          }}
        >
          {t.saveSettings}
        </button>

        <style>{`
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`}</style>

      </div>

      {/* Live Preview */}
      <div
        className={`mt-6 p-5 text-center rounded-lg border border-[#00B4D8] text-[#002B3D] dark:text-[#F1FAFA] bg-[#E0F7FA] dark:bg-[#004357] transition-all`}
      >
        ✨ {t.livePreview || "This is a live preview!"}
      </div>
    </div>
  );
};

export default Settings;
