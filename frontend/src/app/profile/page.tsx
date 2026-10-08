"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/ToastProvider";
import { User, Mail, Phone, Shield, Lock, Save, Loader2, ArrowLeft } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [gstin, setGstin] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingPincode, setBillingPincode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    api.auth.me()
      .then((data: any) => {
        if (!data.user) { router.push("/login"); return; }
        setUser(data.user);
        setName(data.user.name || "");
        setPhone(data.user.phone || "");
        setCountry(data.user.country || "IN");
        setGstin(data.user.gstin || "");
        setBillingAddress(data.user.billingAddress || "");
        setBillingCity(data.user.billingCity || "");
        setBillingState(data.user.billingState || "");
        setBillingPincode(data.user.billingPincode || "");
        localStorage.setItem("user", JSON.stringify(data.user));
      })
      .catch(() => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  const handleUpdateProfile = async () => {
    if (!name.trim()) { showToast("Name is required", "error"); return; }
    setSaving(true);
    try {
      await api.auth.updateMe({ name, phone, country, gstin, billingAddress, billingCity, billingState, billingPincode });
      const refreshed = await api.auth.me();
      setUser(refreshed.user);
      localStorage.setItem("user", JSON.stringify(refreshed.user));
      showToast("Profile updated successfully", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to update profile", "error");
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { showToast("All password fields are required", "error"); return; }
    if (newPassword !== confirmPassword) { showToast("Passwords do not match", "error"); return; }
    if (newPassword.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }
    setChangingPassword(true);
    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      showToast("Password changed successfully", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to change password", "error");
    } finally { setChangingPassword(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fcff] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00b7ff] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fcff] text-[#0f172a]">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#0f172a] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#00b7ff]/10 border border-[#00b7ff]/30 text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.name}</h1>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="text-xs text-slate-500 font-mono mt-1">ID: {user?.id?.slice(0, 12)}-GHC</p>
          </div>
        </div>

        {/* Profile Info */}
        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-[#00b7ff]" /> Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" value={user?.email || ""} disabled className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
            </div>
            <button onClick={handleUpdateProfile} disabled={saving} className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2 text-sm text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
          </div>
        </div>

        {/* Billing Details */}
        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Mail className="w-5 h-5 text-[#00b7ff]" /> Billing Details</h2>
          <p className="text-xs text-slate-500 mb-4">Used on GST invoices. Required for Indian customers.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
              <input type="text" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="Street / area / landmark" className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
              <input type="text" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
              <input type="text" value={billingState} onChange={(e) => setBillingState(e.target.value)} placeholder="e.g. Uttar Pradesh" className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">PIN Code</label>
              <input type="text" inputMode="numeric" maxLength={10} value={billingPincode} onChange={(e) => setBillingPincode(e.target.value.replace(/\D/g, ""))} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
              <input type="text" maxLength={2} value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} placeholder="IN" className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">GSTIN <span className="text-slate-400 font-normal">(optional — for GST input credit)</span></label>
              <input type="text" maxLength={15} value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none font-mono" />
            </div>
          </div>
          <button onClick={handleUpdateProfile} disabled={saving} className="mt-4 rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2 text-sm text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Billing Details
          </button>
        </div>

        {/* 2FA Status */}
        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-[#00b7ff]" /> Security</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-slate-500">{user?.twoFactorEnabled ? "Enabled on your account" : "Not enabled"}</p>
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${user?.twoFactorEnabled ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20" : "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20"}`}>
              {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="mt-4">
            <Link href="/dashboard?tab=security" className="text-sm text-[#00b7ff] hover:underline">Manage 2FA in Dashboard &rarr;</Link>
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-[#00b7ff]" /> Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
            </div>
            <button onClick={handleChangePassword} disabled={changingPassword} className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2 text-sm text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all disabled:opacity-50 flex items-center gap-2">
              {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
