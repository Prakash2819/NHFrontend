import './App.css';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/login';
import { PatientDashboard } from './components/patient-page';
import { PatientProfile } from './components/profile';
import { MyAppointments } from './components/appointments';
import { Prescriptions } from './components/prescription';
import { HelpPage } from './components/help';
import { DoctorLayout } from './components/DoctorLayout'
import { PatientLayout } from './components/PatientLayout';
import { DoctorDashboard } from './components/doctor-page';
import { MyPatients } from './components/Mypatients';
import { DoctorAppointments } from './components/DoctorAppointments';
import { DoctorPrescriptions } from './components/DoctorPrescriptions';
import { DoctorSchedule } from './components/DoctorSchedule';
import { DoctorProfile } from './components/DoctorProfile';
import { AdminPortal } from './components/Adminportal';

function App() {
  const [role, setRole] = useState(localStorage.getItem("role"));

  const handleLogin = (userRole) => {
    localStorage.setItem("role", userRole);
    setRole(userRole);
  };

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    setRole(null);
  };

  return (
    <Router>
      <Routes>
        {/* Login page */}
        <Route
          path="/login"
          element={role ? <Navigate to={role === 'patient' ? '/patient' : '/doctor'} /> : <LoginPage onLogin={handleLogin} />}
        />

        {/* Patient dashboard */}
        <Route
          path="/patient"
          element={<PatientLayout onLogout={handleLogout} />}
        >
          <Route index element={<PatientDashboard />} />
          <Route path="appointments" element={<MyAppointments />} />
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="help" element={<HelpPage />} />

        </Route>

        {/* Doctor dashboard */}
        <Route
          path="/doctor"
          element={<DoctorLayout onLogout={handleLogout} />}
        >
          <Route index element={<DoctorDashboard />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="patients" element={<MyPatients />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="prescriptions" element={<DoctorPrescriptions />} />
          <Route path="schedule" element={<DoctorSchedule/>} />
          <Route path="profile" element={<DoctorProfile />} />
        </Route>

        {/* Default route */}
        <Route
          path="/"
          element={<Navigate to="/login" />}
        />
        {/* 
        Catch all unknown routes
        <Route
          path="*"
          element={<Navigate to="/login" />}
        /> */}

        <Route path="/admin-123" element={<AdminPortal />} />
      </Routes>
    </Router >
  );
}

export default App;