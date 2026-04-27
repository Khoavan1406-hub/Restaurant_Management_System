import { FiMoon, FiSun } from "react-icons/fi";
import useTheme from "../hooks/useTheme";
import "./themeSwitcher.css";

const ThemeSwitcher = ({ compact = false }) => {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const nextLabel = theme === "dark" ? "Light Mode" : "Dark Mode";

  return (
    <button
      type="button"
      className={`theme-switcher ${compact ? "compact" : ""}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      <span className="theme-switcher-icon">
        {theme === "dark" ? <FiSun /> : <FiMoon />}
      </span>
      <span className="theme-switcher-label">{nextLabel}</span>
    </button>
  );
};

export default ThemeSwitcher;