import { useState } from 'react';
import { Users, Calendar, Clock, Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

export function AdminPortal() {
    const [activeTab, setActiveTab] = useState('doctors');
    const [searchQuery, setSearchQuery] = useState('');

    const navigate = useNavigate()

    const handleLogout = () => {
        navigate("/login");
    };



    const doctors = [
        {
            id: '1',
            name: 'Dr. Amanda Clara',
            specialty: 'Pediatric Specialist',
            experience: '12 years',
            patients: 850,
            rating: 4.9,
            status: 'Active',
            image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop'
        },
        {
            id: '2',
            name: 'Dr. Michael Johnson',
            specialty: 'Cardiologist',
            experience: '15 years',
            patients: 920,
            rating: 4.8,
            status: 'Active',
            image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop'
        },
        {
            id: '3',
            name: 'Dr. Sarah Mitchell',
            specialty: 'Obstetrician',
            experience: '10 years',
            patients: 680,
            rating: 4.9,
            status: 'Active',
            image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop'
        }
    ];

    const appointments = [
        {
            id: '1',
            patientName: 'John Smith',
            doctorName: 'Dr. Amanda Clara',
            date: '2026-02-10',
            time: '10:00 AM',
            type: 'Video Call',
            status: 'Confirmed'
        },
        {
            id: '2',
            patientName: 'Emily Davis',
            doctorName: 'Dr. Michael Johnson',
            date: '2026-02-10',
            time: '11:30 AM',
            type: 'In-Person',
            status: 'Confirmed'
        },
        {
            id: '3',
            patientName: 'Sarah Wilson',
            doctorName: 'Dr. Sarah Mitchell',
            date: '2026-02-11',
            time: '02:00 PM',
            type: 'Video Call',
            status: 'Pending'
        }
    ];

    const patients = [
        {
            id: '1',
            name: 'John Smith',
            email: 'john.smith@email.com',
            phone: '+1 (555) 123-4567',
            age: 35,
            lastVisit: '2026-02-05',
            appointments: 12
        },
        {
            id: '2',
            name: 'Emily Davis',
            email: 'emily.davis@email.com',
            phone: '+1 (555) 234-5678',
            age: 28,
            lastVisit: '2026-02-08',
            appointments: 8
        },
        {
            id: '3',
            name: 'Sarah Wilson',
            email: 'sarah.wilson@email.com',
            phone: '+1 (555) 345-6789',
            age: 31,
            lastVisit: '2026-01-30',
            appointments: 15
        }
    ];

    return (
        <div className="flex-1 overflow-auto bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Admin Portal</h1>
                        <p className="text-gray-600 text-sm mt-1">
                            Manage doctors, appointments, and patients
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        Logout
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mt-6 border-b border-gray-200">
                    {['doctors', 'appointments', 'patients', 'timeslots'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 px-4 font-medium transition-colors ${activeTab === tab
                                    ? 'text-blue-700 border-b-2 border-blue-700'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-8">
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search ${activeTab}...`}
                            className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <button className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filter
                    </button>
                    <button className="px-4 py-2.5 bg-blue-700 text-white rounded-lg hover:bg-blue-800 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Add New
                    </button>
                </div>
    {/* Doctors Tab */}
        {activeTab === 'doctors' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Doctor</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Specialty</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Experience</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Patients</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Rating</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {doctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={doctor.image}
                          alt={doctor.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="font-medium">{doctor.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{doctor.specialty}</td>
                    <td className="px-6 py-4 text-gray-600">{doctor.experience}</td>
                    <td className="px-6 py-4 text-gray-600">{doctor.patients}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-yellow-600">{doctor.rating}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {doctor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Patient</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Doctor</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Time</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">#{appointment.id}</td>
                    <td className="px-6 py-4 text-gray-600">{appointment.patientName}</td>
                    <td className="px-6 py-4 text-gray-600">{appointment.doctorName}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{appointment.time}</td>
                    <td className="px-6 py-4 text-gray-600">{appointment.type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        appointment.status === 'Confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Age</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Last Visit</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Total Visits</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">#{patient.id}</td>
                    <td className="px-6 py-4 font-medium">{patient.name}</td>
                    <td className="px-6 py-4 text-gray-600">{patient.email}</td>
                    <td className="px-6 py-4 text-gray-600">{patient.phone}</td>
                    <td className="px-6 py-4 text-gray-600">{patient.age}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(patient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{patient.appointments}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Time Slots Tab */}
        {activeTab === 'timeslots' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold">{doctor.name}</h3>
                    <p className="text-sm text-gray-600">{doctor.specialty}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Monday</span>
                    <span className="text-sm font-medium">09:00 AM - 05:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Tuesday</span>
                    <span className="text-sm font-medium">10:00 AM - 01:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Wednesday</span>
                    <span className="text-sm font-medium">Closed</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Thursday</span>
                    <span className="text-sm font-medium">10:00 AM - 01:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Friday</span>
                    <span className="text-sm font-medium">09:00 AM - 05:00 PM</span>
                  </div>
                </div>

                <button className="w-full mt-4 py-2 border border-blue-700 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Update Schedule
                </button>
              </div>
            ))}
          </div>
        )}
            </div>
        </div>
    );
}