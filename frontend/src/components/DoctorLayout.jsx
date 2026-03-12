import { Outlet } from 'react-router-dom';
import { DoctorSidebar } from './doctorsidebar';

export function DoctorLayout({ onLogout }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <DoctorSidebar onLogout={onLogout} />
    <>
        <Outlet/>
    </>
    </div>
  );
}