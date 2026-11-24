import React from "react";
import ReactDOM from "react-dom/client";
import "../i18n";
import "../styles/variables.css";
import "../styles/global.css";
import App from "./App";
import { installErrorLogging } from "../lib/errorLog";

installErrorLogging();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
