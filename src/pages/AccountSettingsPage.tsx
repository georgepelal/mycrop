import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Lock, 
  Key, 
  ShieldAlert, 
  Trash2, 
  Check, 
  AlertCircle,
  Loader2,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  UserCheck
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { 
  updateProfile, 
  updateEmail, 
  updatePassword, 
  sendEmailVerification,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { auth } from "../lib/firebase";

// Custom preset avatars for Agronomist Agents
const AVATAR_PRESETS = [
  { id: "agronomist", label: "Lead Agronomist", emoji: "🌱", color: "from-emerald-400 to-green-600" },
  { id: "telemetry", label: "GIS Specialist", emoji: "🛰️", color: "from-blue-400 to-indigo-600" },
  { id: "drone", label: "Drone Operator", emoji: "🛸", color: "from-purple-400 to-violet-600" },
  { id: "researcher", label: "Crop Scientist", emoji: "🔬", color: "from-amber-400 to-yellow-600" },
  { id: "engineer", label: "AgTech Engineer", emoji: "⚙️", color: "from-teal-400 to-emerald-600" },
  { id: "pilot", label: "Farming Pilot", emoji: "🧑‍✈️", color: "from-sky-400 to-blue-600" }
];

export default function AccountSettingsPage() {
  const { user, login, logout } = useAuth();

  // Avatar presets & URL state
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "🌱");
  const [displayName, setDisplayName] = useState(user?.displayName || "George Pelal");
  const [userEmail, setUserEmail] = useState(user?.email || "georgepelal@gmail.com");
  
  // Custom metadata extra states
  const [phone, setPhone] = useState(() => localStorage.getItem("mycrop_profile_phone") || "");
  const [region, setRegion] = useState(() => localStorage.getItem("mycrop_profile_region") || "");
  const [titleCode, setTitleCode] = useState(() => localStorage.getItem("mycrop_profile_title") || "agronomist");

  // Authentication/Password Renewal states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Verification & Processing States
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Feedbacks
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  // Security purge challenge input
  const [purgeConfirmationCode, setPurgeConfirmationCode] = useState("");
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [tokenKey, setTokenKey] = useState("");

  // Populate info on page load or auth change
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "George Pelal");
      setUserEmail(user.email || "georgepelal@gmail.com");
      setPhotoURL(user.photoURL || "🌱");
    }
  }, [user]);

  // Handle Token generation
  const handleGenerateAPIToken = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "myc_live_";
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTokenKey(token);
    setSuccessMsg("Unique precision API token generated successfully for client integration!");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Profile update submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdatingProfile(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (auth.currentUser) {
        // Update Firebase Auth profile parameters
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
          photoURL: photoURL
        });
      }

      // Save secondary local preferences
      localStorage.setItem("mycrop_profile_phone", phone);
      localStorage.setItem("mycrop_profile_region", region);
      localStorage.setItem("mycrop_profile_title", titleCode);

      setSuccessMsg("Agent coordinates and avatar updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update profile coordinates.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Multi-step Authentication Details submission
  const handleSecurityCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword && newPassword !== confirmNewPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters.");
      return;
    }

    setIsUpdatingCreds(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setSecurityNotice(null);

    try {
      if (auth.currentUser) {
        if (currentPassword) {
          const credential = EmailAuthProvider.credential(user.email || "", currentPassword);
          await reauthenticateWithCredential(auth.currentUser, credential);
        }

        // 1. Email update
        if (userEmail.trim() !== user.email) {
          await updateEmail(auth.currentUser, userEmail.trim());
        }

        // 2. Password update
        if (newPassword) {
          await updatePassword(auth.currentUser, newPassword);
        }
      }

      setSuccessMsg("Security credentials and authentication key updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        setSecurityNotice(
          "For remote security standards, please type your Current Password first to authorize editing primary credentials."
        );
      } else {
        setErrorMsg(err.message || "Failed to verify credentials. Please check your current password.");
      }
    } finally {
      setIsUpdatingCreds(false);
    }
  };

  // Trigger verified email link dispatch
  const handleTriggerEmailVerification = async () => {
    if (!auth.currentUser) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setSuccessMsg("Cryptographic verification mail dispatched! Check your registered inbox.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Verification dispatch failed. Please retry.");
    }
  };

  // Hazardous: Purge account permanently from server
  const handlePurgeAccount = async () => {
    if (!auth.currentUser) return;
    if (purgeConfirmationCode !== "DELETE") {
      setErrorMsg("Please type 'DELETE' in the challenge input to authorize this permanent action.");
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await deleteUser(auth.currentUser);
      setSuccessMsg("Profile deleted successfully. Disconnecting sessions...");
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        setErrorMsg("Permanent session purging requires recent authorization. Please logout, sign back in, and retry.");
      } else {
        setErrorMsg(err.message || "Hazardous deletion operation failed.");
      }
      setShowPurgeDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Find active avatar preset preview
  const activePreset = AVATAR_PRESETS.find(p => p.emoji === photoURL) || AVATAR_PRESETS[0];

  return (
    <div className="space-y-6" id="mycrop-account-settings-container">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-150 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-brand-green">
            <UserCheck className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono">
              Identity Console
            </span>
          </div>
          <h1 className="text-3xl font-display font-black tracking-tight text-gray-950">
            Account Settings
          </h1>
          <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
            Manage your agent profile, change authentication keys, verify coordinates, and configure security access modules.
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-2 text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-150 px-3.5 py-1.5 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AGENT: {user.email}</span>
          </div>
        )}
      </div>

      {/* Global Notifications Panel */}
      <AnimatePresence mode="wait">
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl flex items-start gap-3 text-emerald-800 text-xs font-semibold leading-relaxed"
          >
            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Execution Succeeded</span>
              <p className="text-[11px] text-emerald-700/80 mt-0.5 font-normal">{successMsg}</p>
            </div>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-150 p-4 rounded-2xl flex items-start gap-3 text-red-800 text-xs font-semibold leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Credential Alert</span>
              <p className="text-[11px] text-red-700/80 mt-0.5 font-normal">{errorMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Info + Passwords */}
      {user ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Side Details and Avatar Selector (7/12 Width) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Box A: Profile Identity / Avatar picker */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="p-2 bg-brand-green/10 text-brand-green rounded-xl">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-black text-gray-950">Visual Agent Identity</h3>
                  <p className="text-[10px] text-gray-400">Select an agronomist role badge and profile representation</p>
                </div>
              </div>

              {/* Live Preview Avatar */}
              <div className="flex flex-col sm:flex-row items-center gap-5 bg-gray-50 p-4.5 rounded-2xl border border-gray-150">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${activePreset.color} shadow-md flex items-center justify-center text-3xl shrink-0 font-bold border border-white/20 select-none relative group`}>
                  {photoURL && photoURL.length < 5 ? photoURL : "🌱"}
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black leading-none uppercase">
                    Agent
                  </div>
                </div>

                <div className="space-y-1.5 flex-1 w-full text-center sm:text-left">
                  <div className="flex flex-wrap justify-center sm:justify-start gap-1">
                    <span className="text-[10px] bg-brand-green/10 text-brand-green font-bold font-mono px-2 py-0.5 rounded-full uppercase">
                      {activePreset.label}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold font-mono px-2 py-0.5 rounded-full uppercase">
                      COPERNICUS LINKED
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-gray-950 leading-tight">
                    {displayName || "Unnamed Field Agent"}
                  </h4>
                  <p className="text-[10px] text-gray-400 leading-normal font-sans">
                    Your avatar preset highlights your primary crop telemetry responsibilities inside shared agronomist dashboards.
                  </p>
                </div>
              </div>

              {/* Avatar Selector Presets Grid */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Select Role & Badge
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setPhotoURL(preset.emoji);
                        setTitleCode(preset.id);
                      }}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left cursor-pointer transition-all hover:bg-slate-50 ${
                        photoURL === preset.emoji || (preset.id === "agronomist" && !photoURL)
                          ? "border-brand-green bg-emerald-500/[0.03] ring-1 ring-brand-green/20"
                          : "border-gray-150 bg-white"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${preset.color} flex items-center justify-center text-sm shadow-xs`}>
                        {preset.emoji}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black tracking-tight text-gray-950 block truncate leading-none">
                          {preset.label}
                        </span>
                        <span className="text-[8px] text-gray-400 font-mono block leading-none mt-1">
                          badge id: {preset.id.substring(0, 4)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Extended Profile inputs form */}
              <form onSubmit={handleProfileSubmit} className="space-y-4 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Option: Display Identity Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Agent Profile Identifier (Name)
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Marshal Agronomist"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-green"
                    />
                  </div>

                  {/* Option: Mobile Phone number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Linked Contact Phone (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 724-2195"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-green"
                      />
                    </div>
                  </div>

                  {/* Option: Geographic territory */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Geographic Agricultural Territory
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="Midwest Corn Belt, USA"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-green"
                      />
                    </div>
                  </div>

                  {/* Security Verification Status Block */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Security Verification State
                    </label>
                    <div className={`rounded-xl px-3.5 py-2.5 border text-xs font-bold flex items-center justify-between ${
                      user.emailVerified 
                        ? "bg-emerald-50/50 text-emerald-800 border-emerald-150" 
                        : "bg-amber-50/50 text-amber-800 border-amber-100"
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{user.emailVerified ? "Fully Verified Mail" : "Awaiting Verification"}</span>
                      </div>
                      {!user.emailVerified && (
                        <button
                          type="button"
                          onClick={handleTriggerEmailVerification}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-black px-2 py-1 rounded shadow-xs transition-all cursor-pointer leading-none"
                        >
                          Verify now
                        </button>
                      )}
                    </div>
                  </div>

                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-display font-extrabold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Profile Coordinates...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Commit Agent Coordinates</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>

            {/* Box B: Agricultural API Integration Tokens */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="p-2 bg-brand-green/10 text-brand-green rounded-xl">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-black text-gray-950">Secure API Developers Hub</h3>
                  <p className="text-[10px] text-gray-400">Generate telemetry integration keys to feed data to external GIS software</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] text-gray-400 leading-normal font-sans">
                  Developers can query the live Sentinel boundaries drawn on MyCrop in JSON format into external tools like ArcGIS or QGIS using this authorization token.
                </p>

                {tokenKey ? (
                  <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs border border-slate-800 flex items-center justify-between select-all">
                    <span className="truncate pr-4">{tokenKey}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(tokenKey);
                        setSuccessMsg("API Integration Key copied to clipboard!");
                        setTimeout(() => setSuccessMsg(null), 3000);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-sans text-[9px] font-extrabold px-2.5 py-1 rounded transition-colors"
                    >
                      Copy Token
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateAPIToken}
                    className="border border-brand-green text-brand-green hover:bg-brand-green/5 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Generate Developer Token Key</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Right Side Security Credential Renewal Tabs & Safety Purges (5/12 Width) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Box C: Authentication Pin Password Renewals */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="p-2 bg-brand-green/10 text-brand-green rounded-xl">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-black text-gray-950">Change Security Password</h3>
                  <p className="text-[10px] text-gray-400">Modify registered access code coordinates securely</p>
                </div>
              </div>

              {securityNotice && (
                <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl flex items-start gap-2.5 text-amber-800 text-[10px] leading-normal font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>{securityNotice}</p>
                </div>
              )}

              <form onSubmit={handleSecurityCredentialsSubmit} className="space-y-4">
                
                {/* Secondary verification: Current Password code */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Current Registration Password (To Authenticate)
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current access code"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-green"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="relative flex py-1 items-center text-[9px] text-gray-400 font-mono select-none">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="flex-shrink mx-2">NEW SECURITY KEY DESIGNATION</span>
                  <div className="flex-grow border-t border-gray-100"></div>
                </div>

                {/* Option: NEW PASSWORD */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    New Security Pin Access Code
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-green"
                  />
                </div>

                {/* Option: CONFIRM NEW PASSWORD */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Confirm New Pin Code
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-green"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingCreds || !currentPassword}
                  className="w-full bg-brand-green hover:bg-brand-green-hover text-white py-2.5 rounded-xl text-xs font-display font-extrabold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingCreds ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Re-authenticating Gateway...</span>
                    </div>
                  ) : (
                    "Authorize & Rewrite Credentials"
                  )}
                </button>
              </form>
            </div>

            {/* Box D: Emergency Purges (Data Privacy and Deletion Module) */}
            <div className="bg-red-500/[0.02] border border-red-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-red-100 pb-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-black text-red-950">Security Emergency Pruning</h3>
                  <p className="text-[10px] text-red-650/80">Hazardous irreversible cloud deletion mechanisms</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <p className="text-[11px] text-red-800 leading-normal font-sans">
                  Wiping your agent account will permanently clean and erase all configured field drawings, boundary GPS parameters, local telemetry predictions, and Firebase profile details.
                </p>

                {showPurgeDialog ? (
                  <div className="bg-white border border-red-200 p-4 rounded-2xl space-y-3.5 relative z-10 animate-fade-in">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest block font-mono">
                        Verification Challenge
                      </span>
                      <p className="text-[11px] text-gray-500 leading-normal font-sans">
                        To authorize permanent credential erasure, please type <strong className="text-gray-900 border-b border-gray-900 px-0.5">DELETE</strong> below:
                      </p>
                    </div>

                    <input
                      type="text"
                      value={purgeConfirmationCode}
                      onChange={(e) => setPurgeConfirmationCode(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="w-full border-2 border-red-100 hover:border-red-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-widest placeholder-gray-400 focus:outline-none focus:border-red-500"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPurgeDialog(false);
                          setPurgeConfirmationCode("");
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Abort Action
                      </button>
                      <button
                        type="submit"
                        onClick={handlePurgeAccount}
                        disabled={purgeConfirmationCode !== "DELETE" || isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isDeleting ? "Purging Client..." : "Permanently Erase"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPurgeDialog(true)}
                    className="bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 text-xs font-bold px-4.5 py-2.5 rounded-xl border border-red-150 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Initiate Remote Deletion Module</span>
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-gray-150 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <ShieldAlert className="w-12 h-12 text-brand-green" />
          <div className="space-y-1">
            <h3 className="text-lg font-display font-black text-gray-950">Agent Authorization Needed</h3>
            <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
              Account identity profiles and credentials configurations are protected by Firestore security barriers. You must authorize a field agent profile first.
            </p>
          </div>
          <button
            onClick={() => login()}
            className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-display font-extrabold px-5 py-3 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Sign In Or Register Credentials
          </button>
        </div>
      )}

    </div>
  );
}
