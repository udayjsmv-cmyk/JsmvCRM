import React from "react";
import { logout, getUserRole } from "../../utils/auth";

const Navbar = () => {
  const role = getUserRole();

  return (
    <nav className="flex justify-between items-center p-4"
      style={{ backgroundColor: "#006989", color: "#F1FAFA" }}
    >
      <div style={{ color: "#F1FAFA", fontWeight: "500" }}>
        Welcome, {role}
      </div>
     <button
  onClick={logout}
  className="px-4 py-2 rounded-lg text-white font-semibold shadow-md transition duration-300 transform hover:scale-105 hover:shadow-[0_0_15px_rgba(0,180,216,0.6)]"
  style={{
    background: "linear-gradient(135deg, #006989, #00B4D8, #7F00FF)", // Blue → Cyan → Purple
    backgroundSize: "300% 300%",
    animation: "gradientShift 6s ease infinite",
  }}
>
  Logout
</button>

<style>{`
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`}</style>

    </nav>
  );
};

export default Navbar;
