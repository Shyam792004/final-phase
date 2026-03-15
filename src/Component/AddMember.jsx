import React, { useState, useEffect } from "react";
import "./FamilySignup.css";
import { Shield, ArrowLeft, Users } from "lucide-react";
import { toast } from "sonner";
import { ENDPOINTS } from "../lib/api";
import { useLocation } from "wouter";

const AddMember = () => {
  const [, setLocation] = useLocation();
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
    const fetchContacts = async () => {
      const rawId = localStorage.getItem("currentUserId");
      const username = localStorage.getItem("currentUserName");
      const userId = (rawId && rawId !== "undefined" && rawId !== "null") ? rawId : null;

      if (!userId && !username) return;

      try {
        const url = userId ? ENDPOINTS.CONTACTS_BY_USER_ID(userId) : ENDPOINTS.CONTACTS(username);
        console.log(`AddMember: Syncing contacts from ${url}`);

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setMemberList(data);
        } else {
          toast.error("Failed to fetch contacts from cloud.");
        }
      } catch (err) {
        console.error("AddMember fetch error:", err);
      }
    };
    fetchContacts();
  }, []);

  const handleMemberChange = (e) => {
    setMemberInput({ ...memberInput, [e.target.name]: e.target.value });
  };

  const addMember = async () => {
    if (!memberInput.role || !memberInput.name || !memberInput.phone) {
      setError("Please fill all member details.");
      return;
    }

    const username = localStorage.getItem("currentUserName");
    if (!username) {
      setError("Session expired. Please login again.");
      return;
    }

    try {
      if (editingId) {
        // Simple strategy: Delete and Re-add for "Update" if there isn't a dedicated PUT
        // Or just keep the UI local if we want to batch. 
        // Let's implement individual API calls for better reliability.
        await fetch(ENDPOINTS.CONTACT_BY_ID(editingId), { method: "DELETE" });
      }

      const response = await fetch(ENDPOINTS.CONTACTS(username), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: memberInput.name,
          phone: memberInput.phone,
          relationship: memberInput.role
        })
      });

      if (!response.ok) throw new Error("Failed to save contact");

      // Refresh list
      const fetchResponse = await fetch(ENDPOINTS.CONTACTS(username));
      const updatedList = await fetchResponse.json();
      setMemberList(updatedList);

      setEditingId(null);
      setSuccess(editingId ? "Member updated!" : "Member added!");
      toast.success(editingId ? "Member updated!" : "Member added!");
      setMemberInput({ role: "", name: "", phone: "" });
    } catch (err) {
      setError("Cloud sync failed. Member added locally.");
      toast.error("Cloud sync failed");
    }

    setError("");
    setTimeout(() => setSuccess(""), 2000);
  };

  const editMember = (member) => {
    setMemberInput({
      role: member.relationship || member.role,
      name: member.name,
      phone: member.phone,
    });
    setEditingId(member.id);
    setShowMembers(false);
  };

  const removeMember = async (id) => {
    try {
      const response = await fetch(ENDPOINTS.CONTACT_BY_ID(id), { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");

      const updated = memberList.filter(m => m.id !== id);
      setMemberList(updated);
      toast.success("Member removed");
    } catch (err) {
      toast.error("Failed to remove member from database");
    }
  };

  const handleSaveAndReturn = async () => {
    // If the user filled the form but hasn't clicked "Add Member" yet, save it now
    if (memberInput.name && memberInput.phone && memberInput.role) {
      try {
        const username = localStorage.getItem("currentUserName");
        if (username) {
          await fetch(ENDPOINTS.CONTACTS(username), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: memberInput.name,
              phone: memberInput.phone,
              relationship: memberInput.role
            })
          });
        }
      } catch (err) {
        console.error("Auto-save failed on return", err);
      }
    }
    toast.success("Contacts synchronized with database!");
    setLocation("/home");
  };

  return (
    <div className="signup-container">
      {/* Redesigned Header */}
      <nav className="nav-header">
        <div className="nav-brand">
          <Shield size={32} className="logo-icon" />
          <span className="brand-name">NightSafe</span>
        </div>
      </nav>

      <div className="signup-card">
        <div className="back-link" onClick={() => setLocation("/home")}>
          <ArrowLeft size={18} /> Back to Dashboard
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
              maxLength="10"
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
                        <p className="text-xs text-blue-400">{member.relationship}</p>
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
        {success && <p className="success-msg text-center mt-4 text-green-400">{success}</p>}

        <button
          type="button"
          className="primary-btn mt-8"
          onClick={handleSaveAndReturn}
        >
          Save and Register
        </button>
      </div>
    </div>
  );
};

export default AddMember;
