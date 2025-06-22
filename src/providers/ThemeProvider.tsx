import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useEffect, useState } from "react";

type ThemeMode = "system" | "light" | "dark";

export const ThemeContext = createContext({
  mode: "system" as ThemeMode,
  setMode: (mode: ThemeMode) => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>("system");

  // Load mode from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const storedMode = await AsyncStorage.getItem("themeMode");
        if (
          storedMode === "light" ||
          storedMode === "dark" ||
          storedMode === "system"
        ) {
          setModeState(storedMode);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Save mode to AsyncStorage when it changes
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem("themeMode", newMode).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
