import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply persisted theme on initial load to prevent flash
const persisted = localStorage.getItem('gpu-cloud-auth');
if (persisted) {
  try {
    const parsed = JSON.parse(persisted);
    if (parsed?.state?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch {}
}

createRoot(document.getElementById("root")!).render(<App />);
