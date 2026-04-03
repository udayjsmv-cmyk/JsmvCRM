import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getUserRole } from "../../utils/auth";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [deptOpen, setDeptOpen] = useState(false);
  const location = useLocation();
  const role = getUserRole();

  // ✅ Role flags
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isPreparer = role === "preparer";
  const isReviewer = role === "reviewer";

  useEffect(() => {
    if (location.pathname.startsWith("/departments")) setDeptOpen(true);
  }, [location.pathname]);

  // ✅ Active link styling
  const linkClasses = (path) =>
    `flex items-center px-4 py-2 rounded-md transition-all duration-200 
     ${
       location.pathname.startsWith(path)
         ? "bg-[#00B4D8] text-[#002B3D] font-semibold"
         : "text-[#F1FAFA] hover:bg-[#00B4D8] hover:text-[#002B3D]"
     }`;

  const isDepartmentActive = location.pathname.startsWith("/departments");

  return (
    <div
      className={`flex flex-col h-screen transition-all duration-300 shadow-lg ${
        isOpen ? "w-64" : "w-20"
      } bg-[#006989]`}
    >
      {/* Toggle Sidebar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-[#F1FAFA] hover:text-[#00B4D8] p-4 focus:outline-none self-start"
      >
        <i className="fa-solid fa-bars text-xl"></i>
      </button>

      {/* Navigation */}
      <nav className="flex flex-col mt-4 space-y-2 flex-1 overflow-auto">
        
        {/* Dashboard (Admin & Manager only) */}
        {(isAdmin || isManager) && (
          <Link to="/dashboard" className={linkClasses("/dashboard")}>
            <i className="fa-solid fa-gauge mr-3 w-5"></i>
            {isOpen && "Dashboard"}
          </Link>
        )}

        {/* Profile (All roles) */}
        <Link to="/profile" className={linkClasses("/profile")}>
          <i className="fa-solid fa-user mr-3 w-5"></i>
          {isOpen && "Profile"}
        </Link>

        {/* Employees (Admin & Manager) */}
        {(isAdmin || isManager) && (
          <Link to="/employees" className={linkClasses("/employees")}>
            <i className="fa-solid fa-users mr-3 w-5"></i>
            {isOpen && "Employees"}
          </Link>
        )}

        {/* Clients (Admin & Manager) */}
        {(isAdmin || isManager) && (
          <Link to="/clients" className={linkClasses("/clients")}>
            <i className="fa-solid fa-user-tie mr-3 w-5"></i>
            {isOpen && "Clients"}
          </Link>
        )}

        {/* Departments */}
        {(isPreparer || isReviewer) ? (
          <Link
            to={isPreparer ? "/departments/prepare" : "/departments/reviewer"}
            className={linkClasses(
              isPreparer
                ? "/departments/prepare"
                : "/departments/reviewer"
            )}
          >
            <i className="fa-solid fa-building mr-3 w-5"></i>
            {isOpen && (isPreparer ? "Prepare" : "Review")}
          </Link>
        ) : (
          <>
            <button
              onClick={() => setDeptOpen(!deptOpen)}
              className={`flex items-center justify-between px-4 py-2 rounded-md w-full focus:outline-none transition-all duration-200 ${
                isDepartmentActive
                  ? "bg-[#00B4D8] text-[#002B3D] font-semibold"
                  : "text-[#F1FAFA] hover:bg-[#00B4D8] hover:text-[#002B3D]"
              }`}
            >
              <div className="flex items-center">
                <i className="fa-solid fa-building mr-3 w-5"></i>
                {isOpen && "Departments"}
              </div>
              {isOpen && (
                <i
                  className={`fa-solid transition-transform duration-200 ${
                    deptOpen ? "fa-chevron-up" : "fa-chevron-down"
                  }`}
                ></i>
              )}
            </button>

            {deptOpen && isOpen && (
              <div className="flex flex-col ml-8 space-y-1">
                <Link
                  to="/departments/calling"
                  className={linkClasses("/departments/calling")}
                >
                  Calling
                </Link>
                <Link
                  to="/departments/prepare"
                  className={linkClasses("/departments/prepare")}
                >
                  Prepare
                </Link>
                <Link
                  to="/departments/reviewer"
                  className={linkClasses("/departments/reviewer")}
                >
                  Review
                </Link>
                <Link
                  to="/departments/account"
                  className={linkClasses("/departments/account")}
                >
                  Account
                </Link>
                <Link
                  to="/departments/payment"
                  className={linkClasses("/departments/payment")}
                >
                  Payment
                </Link>
              </div>
            )}
          </>
        )}

        {/* Settings (All roles) */}
        <Link to="/settings" className={linkClasses("/settings")}>
          <i className="fa-solid fa-cog mr-3 w-5"></i>
          {isOpen && "Settings"}
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;