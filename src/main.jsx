import App from "./App.jsx";
import HomePage from "./pages/HomePage.jsx";
import TablePage from "./pages/TablePage.jsx";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/table" element={<TablePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    <Toaster richColors closeButton position="top-center" />
  </StrictMode>
);
