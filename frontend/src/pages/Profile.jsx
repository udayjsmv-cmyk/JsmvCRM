import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { FiUpload } from "react-icons/fi";
import { SettingsContext } from "../context/SettingsContext";
import "../App.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Profile = () => {
  const { t, theme } = useContext(SettingsContext);

  const [user, setUser] = useState({
    _id: "",
    FirstName: "",
    LastName: "",
    email: "",
    role: "",
    profilePic: null,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState("");

  // ✅ Reusable fetch function
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data?.user || res.data;

      if (!data?._id) {
        throw new Error("User ID missing from response");
      }

      setUser({
        ...data,
        profilePic: null, // reset file input state
      });

      // ✅ Set preview safely
      setPreview(
        `${API_BASE}/auth/profile-pic/${data._id}?t=${Date.now()}`
      );
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Correct useEffect
  useEffect(() => {
    fetchProfile();
  }, []);

  // Toggle edit
  const handleEditToggle = () => setEditing((prev) => !prev);

  // Input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  // Image select + instant preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file)); // instant UI preview
      setUser((prev) => ({ ...prev, profilePic: file }));
    }
  };

  // ✅ Save profile
  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Update basic info
      await axios.put(
        `${API_BASE}/auth/profile`,
        {
          FirstName: user.FirstName,
          LastName: user.LastName,
          email: user.email,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Upload profile pic
      if (user.profilePic instanceof File) {
        const formData = new FormData();
        formData.append("file", user.profilePic);

        await axios.post(`${API_BASE}/auth/profile-pic`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // ✅ ALWAYS refetch to sync state (critical fix)
      await fetchProfile();

      alert("Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg font-semibold text-gray-500">
          Loading profile...
        </p>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600 text-center mt-6">{error}</p>;
  }

  return (
    <div
      className={`max-w-4xl mx-auto mt-10 p-8 rounded-2xl shadow-lg transition-all
      ${
        theme === "dark"
          ? "bg-[#002B3D] text-[#F1FAFA]"
          : "bg-[#F1FAFA] text-[#002B3D]"
      }`}
    >
      <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-10">

        {/* Profile Image */}
        <div className="flex flex-col items-center space-y-4">
          <img
            src={preview || "/default-avatar.png"}
            alt="Profile"
            onError={(e) => {
              e.target.src = "/default-avatar.png"; // ✅ fallback fix
            }}
            className="w-40 h-40 rounded-full object-cover border-4 border-[#00B4D8] shadow-md"
          />

          {editing && (
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#006989] to-[#00B4D8] text-white rounded-lg shadow hover:scale-105 transition">
              <FiUpload />
              {t.changePhoto || "Change Photo"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Profile Details */}
        <div className="flex-1 w-full mt-6 md:mt-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold">
              {user.FirstName} {user.LastName}
            </h2>

            <button
              onClick={handleEditToggle}
              className={`px-5 py-2 rounded-lg text-white font-semibold transition ${
                editing
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gradient-to-r from-[#006989] to-[#00B4D8]"
              }`}
            >
              {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          <p className="mb-6 text-lg">
            Role: <span className="font-semibold">{user.role}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="text"
              name="FirstName"
              value={user.FirstName}
              disabled={!editing}
              onChange={handleChange}
              placeholder="First Name"
              className="px-4 py-2 border rounded-lg text-black"
            />

            <input
              type="text"
              name="LastName"
              value={user.LastName}
              disabled={!editing}
              onChange={handleChange}
              placeholder="Last Name"
              className="px-4 py-2 border rounded-lg text-black"
            />

            <input
              type="email"
              name="email"
              value={user.email}
              disabled={!editing}
              onChange={handleChange}
              placeholder="Email"
              className="px-4 py-2 border rounded-lg text-black md:col-span-2"
            />
          </div>

          {editing && (
            <div className="mt-8">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-3 text-white rounded-lg bg-gradient-to-r from-[#00B16A] to-[#00B4D8] hover:scale-105 transition"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;