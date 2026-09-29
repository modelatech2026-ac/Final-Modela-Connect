import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initClientApiMock } from "./services/apiMock";

// Initialize client-side API mock engine for seamless static Vercel deployment
initClientApiMock();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
