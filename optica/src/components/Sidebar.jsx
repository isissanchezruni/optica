import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../api/supabaseClient";
import "../styles/Sidebar.css";
import {
  FaUser,
  FaCalendarAlt,
  FaFileAlt,
  FaGamepad,
  FaUsersCog,
  FaStethoscope,
  FaSignOutAlt,
} from "react-icons/fa";

const Sidebar = ({ role }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/signin");
  };

  // 🔹 Menu items según rol
  const menuItems =
    role === "admin"
      ? [
          { label: "Users / Patients", icon: <FaUsersCog />, path: "/admin/users" },
          { label: "Appointments", icon: <FaCalendarAlt />, path: "/admin/appointments" },
          { label: "Exams", icon: <FaFileAlt />, path: "/admin/Exams" },
          { label: "Referrals", icon: <FaStethoscope />, path: "/admin/referrals" },
        ]
      : role === "optometrist" || role === "ortoptist"
      ? [
          { label: "My Profile", icon: <FaUser />, path: "/specialist/profile" },
          { label: "Appointments", icon: <FaCalendarAlt />, path: "/specialist/appointments" },
          { label: "Exams", icon: <FaFileAlt />, path: "/specialist/exams" },
          { label: "Referrals", icon: <FaStethoscope />, path: "/specialist/referrals" },
          { label: "Users", icon: <FaStethoscope />, path: "/specialist/users" },
        ]
      : [
          { label: "My Profile", icon: <FaUser />, path: "/patient/profile" },
          { label: "My Appointments", icon: <FaCalendarAlt />, path: "/patient/appointments" },
          { label: "Exams", icon: <FaFileAlt />, path: "/patient/exams" },
          { label: "Referrals", icon: <FaStethoscope />, path: "/patient/referrals" },
          { label: "Games", icon: <FaGamepad />, path: "/patient/games" },
        ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>
          {role === "admin"
            ? "Administrator"
            : role === "optometrist" || role === "ortoptist"
            ? "Specialist"
            : "Patient"}
        </h2>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.label}>
            <Link to={item.path} className="sidebar-link">
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt /> Log out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
