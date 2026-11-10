import { BrowserRouter, useRoutes } from "react-router-dom";
import { useAudioSettingsSync } from "./hooks/useAudio";
import { useMotionAttribute } from "./hooks/useReducedMotion";
import { routes } from "./routes";

function AppRoutes() {
  useMotionAttribute();
  useAudioSettingsSync();
  return useRoutes(routes);
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
