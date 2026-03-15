import React from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";

const Lognav2 = () => {
  const handleHomeClick = (e) => {
    e.preventDefault();
    toast.warn("Login to access the Home page!", {
      position: "bottom-right",
      autoClose: 2500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      style: {
        background: "#f6c76bff",
        color: "#000000ff",
        fontWeight: "bold",
        borderRadius: "10px",
      },
    });
  };

  return (
    <>
      <nav className="w-full bg-gradient-to-r from-indigo-700 via-indigo-900 to-purple-800 text-white shadow-lg fixed top-0 left-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left: Logo + Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/20 shadow-md">
              <Shield size={28} className="text-yellow-300" />
            </div>
            <h1 className="text-2xl font-bold tracking-wide">NightSafe</h1>
          </div>

          {/* Right: Navigation Links */}
          <div className="flex items-center space-x-6">
            <a
              href="/"
              onClick={handleHomeClick}
              className="text-white/90 font-medium hover:text-yellow-300 transition duration-300 ease-in-out"
            >
              Home
            </a>

            <a
              href="/famsign"
              className="px-4 py-2 bg-red-400 text-indigo-900 font-semibold rounded-lg shadow-md hover:bg-yellow-300 transition-all duration-300"
            >
              SignUp
            </a>
          </div>
        </div>
      </nav>

    </>
  );
};

export default Lognav2;
