import axios from "axios";

const api = axios.create({
  baseURL: "https://nhbackend.onrender.com/api",
});

const getId = () => localStorage.getItem("doctorId");

export const doctorApi = {

  // ───────── PROFILE ─────────

  getProfile: async () => {
    const { data } = await api.get(`/doctor/profile/${getId()}`);
    return data;
  },

  updateSection: async (section, sectionData) => {
    const { data } = await api.put(
      `/doctor/profile/${getId()}/${section}`,
      sectionData
    );
    return data;
  },

  updatePhoto: async (base64) => {
    const { data } = await api.put(
      `/doctor/profile/${getId()}/photo`,
      { photo: base64 }
    );
    return data;
  },


  // ───────── SCHEDULE ─────────

  getSchedule: async () => {
    const { data } = await api.get(`/doctor/schedule/${getId()}`);
    return data;
  },

  saveSchedule: async (scheduleData) => {
    const { data } = await api.put(
      `/doctor/schedule/${getId()}`,
      scheduleData
    );
    return data;
  },

};