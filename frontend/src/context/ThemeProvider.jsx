import { useEffect, useMemo, useState } from "react";
import ThemeContext from "./themeContext";

const THEME_STORAGE_KEY = "rms_theme";
const THEME_DARK = "dark";
const THEME_LIGHT = "light";

const getPreferredTheme = () => {
  if (typeof window === "undefined") {
    return THEME_DARK;
  }

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === THEME_DARK || savedTheme === THEME_LIGHT) {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? THEME_LIGHT
    : THEME_DARK;
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK));
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
