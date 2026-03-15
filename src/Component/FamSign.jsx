import React, { useState, useEffect } from "react";
import "./FamilySignup.css";
import { Shield, UserPlus, ArrowLeft, Users } from "lucide-react";
import { toast } from "sonner";
import { ENDPOINTS } from "../lib/api";

const FamSign = () => {
  const [step, setStep] = useState("account"); // 'account' or 'members'
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    username: "",
    password: "",
    email: "",
    location: "",
  });

  const [memberInput, setMemberInput] = useState({
    role: "",
    name: "",
    phone: "",
  });

  const [memberList, setMemberList] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // No longer loading from localStorage as everything is in DB
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleMemberChange = (e) => {
    setMemberInput({ ...memberInput, [e.target.name]: e.target.value });
  };

  const addMember = () => {
    if (!memberInput.role || !memberInput.name || !memberInput.phone) {
      setError("Please fill all member details.");
      return;
    }

    if (editingId) {
      setMemberList(
        memberList.map((m) =>
          m.id === editingId ? { ...memberInput, id: editingId } : m
        )
      );
      setEditingId(null);
      setSuccess("Member updated!");
    } else {
      setMemberList([...memberList, { ...memberInput, id: Date.now() }]);
      setSuccess("Member added!");
    }

    setMemberInput({ role: "", name: "", phone: "" });
    setError("");
    setTimeout(() => setSuccess(""), 2000);
  };

  const editMember = (member) => {
    setMemberInput({
      role: member.role,
      name: member.name,
      phone: member.phone,
    });
    setEditingId(member.id);
    setShowMembers(false);
  };

  const removeMember = (id) => {
    setMemberList(memberList.filter(m => m.id !== id));
  };

  const handleSaveMembers = () => {
    toast.success("Local contacts updated!");
    setStep("account");
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const missingFields = [];
    if (!formData.name) missingFields.push("Name");
    if (!formData.phone) missingFields.push("Phone");
    if (!formData.username) missingFields.push("Username");
    if (!formData.password) missingFields.push("Password");
    if (!formData.email) missingFields.push("Email");

    if (missingFields.length > 0) {
      const errorMsg = `Required fields missing: ${missingFields.join(", ")}`;
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      // 1. Register User in MySQL via Spring Boot (including contacts)
      const response = await fetch(ENDPOINTS.AUTH.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          location: formData.location,
          contacts: memberList.map(member => ({
            name: member.name,
            phone: member.phone,
            relationship: member.role
          }))
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Registration failed");
      }

      // Store only minimal session info in localStorage
      localStorage.setItem("loggedInUser", formData.name);
      localStorage.setItem("currentUserName", formData.username);

      toast.success("Account created successfully!");
      setTimeout(() => {
        window.location.href = "/FamilyLogin";
      }, 1500);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  return (
    <div className="signup-container">
      {/* Redesigned Header */}
      <nav className="nav-header">
        <div className="nav-brand">
          <Shield size={32} className="logo-icon" />
          <span className="brand-name">NightSafe</span>
        </div>
        <div className="nav-links">
          {/* Links removed as per user request */}
        </div>
      </nav>

      <div className="signup-card">
        {step === "account" ? (
          <>
            <h2 className="signup-title">Create Family Account</h2>
            <p className="signup-subtitle">Join the NightSafe Map network</p>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Name</label>
                <input
                  type="text"
                  name="name"
                  className="input-field"
                  value={formData.name}
                  placeholder="Enter your full name"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="input-field"
                  value={formData.phone}
                  placeholder="Enter your phone number"
                  onChange={handleChange}
                  pattern="[0-9]{10}"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Set Username</label>
                <input
                  type="text"
                  name="username"
                  className="input-field"
                  value={formData.username}
                  placeholder="Choose a username"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="input-field"
                  value={formData.email}
                  placeholder="Enter your email address"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="input-field"
                  value={formData.password}
                  placeholder="Create a strong password"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Location (City in Tamil Nadu)</label>
                <select
                  name="location"
                  className="select-field"
                  value={formData.location}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Your City</option>
                  {[
                    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
                    "Erode", "Tirunelveli", "Vellore", "Thanjavur", "Dindigul",
                    "Thoothukudi", "Nagercoil", "Karur", "Cuddalore", "Kanchipuram"
                  ].map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="network-box">
                <h3 className="network-title">Build Your Network</h3>
                <p className="network-desc">
                  Add family, friends, or guardians to your emergency contact list.
                </p>
                <button
                  type="button"
                  className="manage-btn"
                  onClick={() => setStep("members")}
                >
                  <UserPlus size={18} /> Manage Contacts
                </button>
              </div>

              {error && <p className="error-msg text-center mb-4">{error}</p>}

              <button type="submit" className="primary-btn">
                Complete Registration
              </button>
            </form>

            <p className="login-footer">
              Already have an account? <a href="/FamilyLogin" className="login-link">Login</a>
            </p>
          </>
        ) : (
          <>
            <div className="back-link" onClick={() => setStep("account")}>
              <ArrowLeft size={18} /> Back to Sign Up
            </div>

            <h2 className="signup-title">Add Family Members</h2>
            <p className="signup-subtitle">Build your NightSafe contact network</p>

            <div className="form-sub-card">
              <h3 className="manage-contacts-header">Manage Contacts</h3>

              <div className="input-group">
                <select
                  name="role"
                  className="select-field"
                  value={memberInput.role}
                  onChange={handleMemberChange}
                >
                  <option value="">Select Role</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Sister">Sister</option>
                  <option value="Brother">Brother</option>
                  <option value="Friend">Friend</option>
                </select>
              </div>

              <div className="input-group">
                <input
                  type="text"
                  name="name"
                  className="input-field"
                  placeholder="Enter Name"
                  value={memberInput.name}
                  onChange={handleMemberChange}
                />
              </div>

              <div className="input-group">
                <input
                  type="tel"
                  name="phone"
                  className="input-field"
                  placeholder="Enter Phone Number"
                  value={memberInput.phone}
                  onChange={handleMemberChange}
                />
              </div>

              <div className="action-row">
                <button type="button" className="add-btn" onClick={addMember}>
                  {editingId ? "Update Member" : "Add Member"}
                </button>
                <button
                  type="button"
                  className="view-btn"
                  onClick={() => setShowMembers(true)}
                >
                  <Users size={16} style={{ display: 'inline', marginRight: '5px' }} />
                  View Members ({memberList.length})
                </button>
              </div>
            </div>

            {showMembers && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
                <div className="bg-[#1e303a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Added Members</h3>
                    <button
                      onClick={() => setShowMembers(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {memberList.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">No members added yet.</p>
                    ) : (
                      memberList.map((member) => (
                        <div key={member.id} className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5">
                          <div className="text-left">
                            <p className="text-sm font-bold text-white">{member.name}</p>
                            <p className="text-xs text-blue-400">{member.role}</p>
                            <p className="text-xs text-gray-400 mt-1">{member.phone}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => editMember(member)}
                              className="text-blue-400 hover:text-blue-300 text-sm font-bold bg-blue-500/10 px-3 py-1 rounded-lg"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => removeMember(member.id)}
                              className="text-red-400 hover:text-red-300 text-sm font-bold bg-red-500/10 px-3 py-1 rounded-lg"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    className="primary-btn mt-6 mb-0"
                    onClick={() => setShowMembers(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {error && <p className="error-msg text-center mt-4">{error}</p>}
            {success && <p className="success-msg text-center mt-4">{success}</p>}

            <button
              type="button"
              className="primary-btn mt-8"
              onClick={handleSaveMembers}
            >
              Save and Register
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FamSign;
