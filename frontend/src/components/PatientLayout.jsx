import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';

export function PatientLayout({ onLogout }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
    <>
        <Outlet/>
    </>
    </div>
  );
}