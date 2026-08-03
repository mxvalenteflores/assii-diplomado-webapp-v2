import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import "./index.css"

import { ProtectedRoute } from "./components/ProtectedRoute"
import Login from "./pages/Login"
import DashboardLayout from "./pages/DashboardLayout"
import FormResponsesPage from "./pages/FormResponsesPage"
import StudentsPage from "./pages/StudentsPage"
import StudentDetail from "./pages/StudentDetail"
import ResponseDetail from "./pages/ResponseDetail"
import ClassesPage from "./pages/ClassesPage"
import FormPage from "./pages/FormPage"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forms/:diplomado" element={<FormPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="responses" replace />} />
            <Route path="responses" element={<FormResponsesPage />} />
            <Route path="responses/:studentId" element={<ResponseDetail />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/:enrollmentId" element={<StudentDetail />} />
            <Route path="classes" element={<ClassesPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
