import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { BookingPage } from "@/pages/BookingPage";
import { AppointmentsPage } from "@/pages/AppointmentsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { FaqPage } from "@/pages/FaqPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<AppLayout />}>
          <Route path="/agendar" element={<BookingPage />} />
          <Route path="/citas" element={<AppointmentsPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/preguntas" element={<FaqPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/agendar" replace />} />
        <Route path="*" element={<Navigate to="/agendar" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
