import {
  LayoutGrid,
  Users,
  CalendarCheck,
  FileText,
  Clock,
  User,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import logo from '../assets/logo.png'

import { NavLink, useLocation, useNavigate } from 'react-router-dom';

export function DoctorSidebar( {onLogout}) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/doctor',               label: 'Dashboard',      icon: LayoutGrid    },
    { path: '/doctor/patients',      label: 'My Patients',    icon: Users         },
    { path: '/doctor/appointments',  label: 'Appointments',   icon: CalendarCheck },
    { path: '/doctor/prescriptions', label: 'Prescriptions',  icon: FileText      },
    { path: '/doctor/schedule',      label: 'Schedule',       icon: Clock         },
    { path: '/doctor/profile',       label: 'Profile',        icon: User          },
    { path: '/doctor/help',          label: 'Help & Support', icon: HelpCircle    },
  ];

  return (
    <div className="w-[230px] bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col shadow-sm">

      {/* Brand */}
      <div className="p-4 border-b">
        <h1 className="text-blue-700 text-2xl font-bold">
          <img src={logo} alt="Namma Hospitals Logo" className="w-[80%] h-[48px]" />
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex flex-col px-3 flex-1 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`w-full flex items-center gap-2 px-3 py-3 rounded-xl mb-2 transition-all duration-200
                ${isActive
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}