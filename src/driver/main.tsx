import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DriverApp } from "./DriverApp";
import { DriverLogin } from "./DriverLogin";
import "../styles.css";

const filename = window.location.pathname.split("/").pop() || "driver.html";
const root = document.getElementById("root");
if (!root) throw new Error("The page is missing its React root.");

createRoot(root).render(
  <StrictMode>
    {filename === "driver-login.html" ? <DriverLogin /> : <DriverApp />}
  </StrictMode>,
);
