import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  User, 
  Mail, 
  Shield, 
  Trophy, 
  TrendingUp, 
  Settings, 
  Copy, 
  Edit2,
  MapPin,
  Zap,
  Heart,
  ArrowUpRight,
  Clock,
  Award,
  Users,
  DollarSign,
  LogOut
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";

export default function UserProfile() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user || !profile) {
    return (
      <div className="h-full flex items-center justify-center bg-bg p-8">
        <div className="text-center">
          <div className="animate-spin inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-accent-blue border-t-transparent mb-4" />
          <p className="text-text-dim">Loading profile...</p>
        </div>
      </div>
    );
  }

  const isAdmin = profile.role === 'ADMIN';
  const isMasterInstructor = user.email === 'malatjimaphalle1@gmail.com';

  return (
    <div className="min-h-full bg-bg overflow-y-auto custom-scrollbar">
      {/* Header Background */}
      <div className="relative h-64 bg-gradient-to-br from-accent-blue/20 via-accent-gold/10 to-bg border-b border-border-dim overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div style={{ backgroundImage: 'radial-gradient(circle, #00f2ff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 flex items-end p-8 z-10"
        >
          <div className="flex gap-8 items-end w-full">
            {/* Avatar */}
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="relative"
            >
              <div className="w-32 h-32 rounded-2xl border-4 border-accent-blue/50 overflow-hidden bg-surface shadow-2xl">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-blue to-accent-gold">
                    <User className="w-16 h-16 text-bg" />
                  </div>
                )}
              </div>
              {isMasterInstructor && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -top-2 -right-2 px-4 py-2 bg-accent-gold text-bg text-[10px] font-black uppercase tracking-widest rounded-full border-2 border-accent-gold/50 shadow-lg"
                >
                  🎓 Master Instructor
                </motion.div>
              )}
              {isAdmin && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute top-0 -left-2 px-4 py-2 bg-accent-blue text-bg text-[10px] font-black uppercase tracking-widest rounded-full border-2 border-accent-blue/50 shadow-lg"
                >
                  🛡️ Admin
                </motion.div>
              )}
            </motion.div>

            {/* Info */}
            <div className="flex-1 pb-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-text-main mb-2">
                  {user.displayName || 'Sovereign Agent'}
                </h1>
                <div className="flex items-center gap-4 text-sm text-text-dim">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-border-dim" />
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-accent-blue" />
                    Level {profile.level}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Balance"
            value={`$${profile.balance?.toLocaleString() || '0'}`}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Referral Earnings"
            value={`$${profile.referralEarnings?.toLocaleString() || '0'}`}
            color="gold"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Referral Count"
            value={profile.referralCount || '0'}
            color="blue"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Account Status"
            value={profile.role === 'ADMIN' ? 'Admin' : 'Active'}
            color="gold"
          />
        </motion.div>

        {/* Profile Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Account Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface border border-border-dim rounded-2xl p-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-text-main mb-6 flex items-center gap-3">
                <User className="w-5 h-5 text-accent-blue" />
                Account Information
              </h2>

              <div className="space-y-6">
                <InfoField
                  label="Display Name"
                  value={user.displayName || 'Not set'}
                  icon={<User className="w-4 h-4" />}
                />
                <InfoField
                  label="Email"
                  value={user.email || 'Not available'}
                  icon={<Mail className="w-4 h-4" />}
                />
                <InfoField
                  label="Account Type"
                  value={profile.role === 'ADMIN' ? 'Administrator' : 'Standard User'}
                  icon={<Shield className="w-4 h-4" />}
                />
                <InfoField
                  label="User ID"
                  value={user.uid}
                  icon={<Zap className="w-4 h-4" />}
                  copyable
                  onCopy={() => copyToClipboard(user.uid)}
                  copied={copied}
                />
                <InfoField
                  label="Member Since"
                  value={new Date(profile.createdAt).toLocaleDateString()}
                  icon={<Clock className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Referral Section */}
            <div className="bg-surface border border-border-dim rounded-2xl p-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-text-main mb-6 flex items-center gap-3">
                <Users className="w-5 h-5 text-accent-gold" />
                Referral Network
              </h2>

              <div className="space-y-6">
                <div className="p-6 bg-accent-gold/5 border border-accent-gold/20 rounded-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent-gold mb-3">Your Referral Code</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-3 bg-bg border border-border-dim rounded font-mono text-lg font-black tracking-widest text-text-main">
                      {profile.referralCode}
                    </div>
                    <button
                      onClick={() => copyToClipboard(profile.referralCode)}
                      className="p-3 hover:bg-accent-gold/10 rounded-lg transition-colors text-accent-gold"
                      title="Copy referral code"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-bg border border-border-dim rounded-xl">
                    <p className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-2">Total Referrals</p>
                    <p className="text-3xl font-black text-accent-blue">{profile.referralCount || 0}</p>
                  </div>
                  <div className="p-4 bg-bg border border-border-dim rounded-xl">
                    <p className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-2">Earnings</p>
                    <p className="text-3xl font-black text-accent-gold">${profile.referralEarnings?.toLocaleString() || 0}</p>
                  </div>
                </div>

                {profile.referredBy && (
                  <div className="p-4 bg-accent-blue/5 border border-accent-blue/20 rounded-xl">
                    <p className="text-[10px] font-black uppercase text-accent-blue tracking-widest mb-2">Referred By</p>
                    <p className="text-text-main font-mono">{profile.referredBy}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-text-main mb-4">Quick Actions</h3>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue rounded-lg transition-colors text-[11px] font-black uppercase tracking-widest">
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-accent-gold/10 hover:bg-accent-gold/20 text-accent-gold rounded-lg transition-colors text-[11px] font-black uppercase tracking-widest">
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-[11px] font-black uppercase tracking-widest"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            {/* Status Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-accent-blue/10 to-accent-gold/10 border border-accent-blue/30 rounded-2xl p-6 text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-accent-blue/20 border border-accent-blue flex items-center justify-center animate-pulse">
                  <Zap className="w-6 h-6 text-accent-blue" />
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-accent-blue mb-2">Status</p>
              <p className="text-sm font-black text-text-main mb-2">Neural Sync Active</p>
              <p className="text-[10px] text-text-dim">Your autonomous systems are operating at optimal capacity.</p>
            </motion.div>

            {/* Master Instructor Badge */}
            {isMasterInstructor && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-accent-gold/20 to-accent-gold/5 border-2 border-accent-gold rounded-2xl p-6 text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-accent-gold/20 border border-accent-gold flex items-center justify-center animate-bounce">
                    <Award className="w-6 h-6 text-accent-gold" />
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-accent-gold mb-2">🎓 Master Instructor</p>
                <p className="text-xs font-bold text-text-main mb-3">Chief Knowledge Architect</p>
                <p className="text-[10px] text-text-dim italic">Leading the Freedom Wheels™ intelligence protocols</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Crypto Balances */}
        {(profile.btcBalance || profile.usdtBalance) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-surface border border-border-dim rounded-2xl p-8"
          >
            <h2 className="text-2xl font-black uppercase tracking-tighter text-text-main mb-6 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-accent-gold" />
              Digital Assets
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profile.btcBalance > 0 && (
                <div className="p-6 bg-gradient-to-br from-accent-gold/10 to-bg border border-accent-gold/20 rounded-xl">
                  <p className="text-[10px] font-black uppercase text-accent-gold tracking-widest mb-3">Bitcoin Balance</p>
                  <p className="text-2xl font-black text-text-main">{profile.btcBalance} BTC</p>
                </div>
              )}
              {profile.usdtBalance > 0 && (
                <div className="p-6 bg-gradient-to-br from-accent-blue/10 to-bg border border-accent-blue/20 rounded-xl">
                  <p className="text-[10px] font-black uppercase text-accent-blue tracking-widest mb-3">USDT Balance</p>
                  <p className="text-2xl font-black text-text-main">${profile.usdtBalance} USDT</p>
                </div>
              )}
              <div className="p-6 bg-gradient-to-br from-purple-500/10 to-bg border border-purple-500/20 rounded-xl">
                <p className="text-[10px] font-black uppercase text-purple-400 tracking-widest mb-3">Total Value</p>
                <p className="text-2xl font-black text-text-main">
                  ${(profile.balance + (profile.usdtBalance || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-6 rounded-xl border transition-all",
        color === 'blue' ? "bg-accent-blue/5 border-accent-blue/20 hover:border-accent-blue/50" : "bg-accent-gold/5 border-accent-gold/20 hover:border-accent-gold/50"
      )}
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4", 
        color === 'blue' ? "bg-accent-blue/20 text-accent-blue" : "bg-accent-gold/20 text-accent-gold"
      )}>
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-black text-text-main">{value}</p>
    </motion.div>
  );
}

function InfoField({ label, value, icon, copyable, onCopy, copied }: any) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-text-dim tracking-widest mb-2">
        {icon}
        {label}
      </div>
      <div className={cn(
        "flex items-center gap-2 p-4 rounded-lg border",
        copyable ? "bg-accent-blue/5 border-accent-blue/20 group hover:border-accent-blue/50" : "bg-bg border-border-dim"
      )}>
        <p className={cn("flex-1 font-mono text-sm", copyable && "text-accent-blue font-bold")}>
          {value}
        </p>
        {copyable && (
          <button
            onClick={onCopy}
            className="p-2 hover:bg-accent-blue/20 rounded transition-colors text-accent-blue"
            title={copied ? "Copied!" : "Copy to clipboard"}
          >
            <Copy className={cn("w-4 h-4 transition-all", copied && "scale-125")} />
          </button>
        )}
      </div>
    </div>
  );
}
