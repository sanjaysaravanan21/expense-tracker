import { createRoot } from "react-dom/client";
import App from "@/app/app";
import "./index.css";
import { AppProvider } from "@/lib/app-context";

createRoot(document.getElementById("root")!).render(
  <AppProvider>
    <App />
  </AppProvider>
);
