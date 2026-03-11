import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets, 
  PlusCircle, 
  Bell, 
  User, 
  Home, 
  Search, 
  Share2, 
  Phone, 
  MapPin, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  LogOut,
  ChevronRight,
  Heart
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { signUpUser, signInUser, signOutUser, getCurrentProfile, ProfileData } from './lib/auth';
import { checkEligibility, getShareLinks } from './lib/utils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = ({ userProfile }: { userProfile: any }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50 sm:top-0 sm:bottom-auto sm:border-b sm:border-t-0">
      <Link to="/" className={cn("flex flex-col items-center gap-1 transition-colors", isActive('/') ? "text-premium-red" : "text-gray-400 hover:text-gray-600")}>
        <Home size={22} strokeWidth={isActive('/') ? 2.5 : 2} />
        <span className="text-[10px] font-semibold">হোম</span>
      </Link>
      <Link to="/requests" className={cn("flex flex-col items-center gap-1 transition-colors", isActive('/requests') ? "text-premium-red" : "text-gray-400 hover:text-gray-600")}>
        <Bell size={22} strokeWidth={isActive('/requests') ? 2.5 : 2} />
        <span className="text-[10px] font-semibold">অনুরোধ</span>
      </Link>
      <Link to="/post-request" className="bg-premium-red text-white p-3.5 rounded-2xl -mt-12 shadow-xl shadow-red-200 active:scale-95 transition-transform sm:mt-0 sm:relative">
        <PlusCircle size={24} />
      </Link>
      <Link to="/search" className={cn("flex flex-col items-center gap-1 transition-colors", isActive('/search') ? "text-premium-red" : "text-gray-400 hover:text-gray-600")}>
        <Search size={22} strokeWidth={isActive('/search') ? 2.5 : 2} />
        <span className="text-[10px] font-semibold">খুঁজুন</span>
      </Link>
      <Link to="/profile" className={cn("flex flex-col items-center gap-1 transition-colors", isActive('/profile') ? "text-premium-red" : "text-gray-400 hover:text-gray-600")}>
        <User size={22} strokeWidth={isActive('/profile') ? 2.5 : 2} />
        <span className="text-[10px] font-semibold">প্রোফাইল</span>
      </Link>
    </nav>
  );
};

const EmergencyRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('blood_requests')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!error) setRequests(data);
      setLoading(false);
    };

    fetchRequests();

    // Real-time listener
    const channel = supabase
      .channel('blood_requests_changes')
      .on('postgres_changes' as any, { event: 'INSERT', table: 'blood_requests' }, (payload: any) => {
        setRequests(prev => [payload.new, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <div className="p-4 text-center text-gray-500">লোড হচ্ছে...</div>;

  return (
    <div className="space-y-4 px-4 pb-24">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <AlertCircle className="text-premium-red" size={18} />
          জরুরি অনুরোধসমূহ
        </h2>
        <Link to="/requests" className="text-premium-red text-xs font-bold hover:underline">সব দেখুন</Link>
      </div>
      
      {requests.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
          <Droplets className="mx-auto text-gray-200 mb-3" size={40} />
          <p className="text-gray-400 text-sm font-medium">বর্তমানে কোনো জরুরি অনুরোধ নেই</p>
        </div>
      ) : (
        requests.map((req) => (
          <motion.div 
            key={req.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow"
          >
            <div className="bg-premium-red-light text-premium-red w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-inner">
              <span className="text-lg font-black leading-none">{req.blood_group}</span>
              <span className="text-[9px] font-black uppercase tracking-tighter">রক্ত</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-900 text-sm leading-tight">{req.hospital}</h3>
                <span className={cn(
                  "text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider",
                  req.urgency === 'Critical' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                )}>
                  {req.urgency === 'Critical' ? 'জরুরি' : 'সাধারণ'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-400 text-[11px] mt-1.5 font-medium">
                <MapPin size={12} />
                <span>{req.location}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <a 
                  href={`tel:${req.contact_phone}`}
                  className="flex-1 bg-premium-red text-white text-[11px] font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-red-100 active:scale-95 transition-transform"
                >
                  <Phone size={14} /> কল করুন
                </a>
                <button 
                  onClick={() => {
                    const links = getShareLinks(req.id, req.blood_group, req.location);
                    window.open(links.whatsapp, '_blank');
                  }}
                  className="flex-1 bg-green-50 text-green-600 text-[11px] font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-green-100 active:scale-95 transition-transform"
                >
                  <Share2 size={14} /> শেয়ার
                </button>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
};

const AuthPage = ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const isSupabaseConfigured = 
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    blood_group: 'A+',
    location: '',
    phone: '',
    last_donation_date: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError('Supabase কনফিগার করা হয়নি। অনুগ্রহ করে সেটিংস থেকে API কী যোগ করুন।');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInUser(formData.email, formData.password);
      } else {
        const profile: ProfileData = {
          name: formData.name,
          blood_group: formData.blood_group,
          location: formData.location,
          phone: formData.phone,
          last_donation_date: formData.last_donation_date || null
        };
        await signUpUser(formData.email, formData.password, profile);
        if (!isLogin) {
          setError('রেজিস্ট্রেশন সফল! অনুগ্রহ করে আপনার ইমেইল চেক করুন (যদি কনফার্মেশন চালু থাকে) অথবা লগইন করুন।');
          setIsLogin(true);
          return;
        }
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error('Auth Error:', err);
      let errorMessage = err.message;
      
      if (errorMessage === 'Invalid login credentials') {
        errorMessage = 'ইমেইল বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে পুনরায় চেক করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'আপনার ইমেইলটি এখনো ভেরিফাই করা হয়নি। অনুগ্রহ করে আপনার ইনবক্স চেক করুন।';
      } else {
        errorMessage = errorMessage || 'কিছু ভুল হয়েছে। সম্ভবত ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে অথবা ডাটাবেস টেবিল তৈরি করা হয়নি।';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-6 pt-12 pb-24">
      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex items-start gap-4 shadow-sm">
          <AlertCircle className="text-amber-600 shrink-0" size={22} />
          <div>
            <p className="text-amber-800 text-xs font-black uppercase tracking-widest mb-1">কনফিগারেশন প্রয়োজন</p>
            <p className="text-amber-700 text-[11px] leading-relaxed font-medium">
              Supabase URL এবং Anon Key সেট করা নেই। অ্যাপটি কাজ করার জন্য আপনাকে অবশ্যই আপনার Supabase প্রজেক্টের তথ্য সেটিংস (Secrets) প্যানেলে যোগ করতে হবে।
            </p>
          </div>
        </div>
      )}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-premium-red-light text-premium-red rounded-[28px] mb-6 shadow-inner">
          <Droplets size={40} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">রক্তবন্ধন</h1>
        <p className="text-gray-400 mt-2 text-sm font-medium">মানবতার টানে, রক্ত দিন জনে জনে</p>
      </div>

      <div className="bg-gray-100/50 p-1.5 rounded-2xl flex mb-10 border border-gray-100">
        <button 
          onClick={() => setIsLogin(true)}
          className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300", isLogin ? "bg-white shadow-md text-premium-red" : "text-gray-400 hover:text-gray-600")}
        >
          লগইন
        </button>
        <button 
          onClick={() => setIsLogin(false)}
          className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300", !isLogin ? "bg-white shadow-md text-premium-red" : "text-gray-400 hover:text-gray-600")}
        >
          রেজিস্ট্রেশন
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLogin && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-5"
          >
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">নাম</label>
              <input 
                type="text" 
                required
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-red-100 focus:bg-white transition-all outline-none"
                placeholder="আপনার পূর্ণ নাম"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">রক্তের গ্রুপ</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-red-100 focus:bg-white transition-all outline-none appearance-none"
                  value={formData.blood_group}
                  onChange={e => setFormData({...formData, blood_group: e.target.value})}
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">ফোন</label>
                <input 
                  type="tel" 
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-red-100 focus:bg-white transition-all outline-none"
                  placeholder="০১XXXXXXXXX"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">অবস্থান (শহর)</label>
              <input 
                type="text" 
                required
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-red-100 focus:bg-white transition-all outline-none"
                placeholder="আপনার শহর"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">শেষ রক্তদানের তারিখ</label>
              <input 
                type="date" 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-red-100 focus:bg-white transition-all outline-none"
                value={formData.last_donation_date}
                onChange={e => setFormData({...formData, last_donation_date: e.target.value})}
              />
            </div>
          </motion.div>
        )}

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">ইমেইল</label>
          <input 
            type="email" 
            required
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-red-100 focus:bg-white transition-all outline-none"
            placeholder="example@mail.com"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">পাসওয়ার্ড</label>
          <input 
            type="password" 
            required
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-red-100 focus:bg-white transition-all outline-none"
            placeholder="••••••••"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 text-red-600 text-xs font-bold p-4 rounded-2xl border border-red-100 text-center"
          >
            {error}
          </motion.div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-premium-red text-white font-black py-4.5 rounded-[24px] shadow-2xl shadow-red-200 active:scale-[0.97] transition-all disabled:opacity-50 text-base tracking-wide mt-4"
        >
          {loading ? 'অপেক্ষা করুন...' : (isLogin ? 'লগইন করুন' : 'অ্যাকাউন্ট তৈরি করুন')}
        </button>
      </form>
    </div>
  );
};

const ProfileView = ({ profile, onLogout }: { profile: any, onLogout: () => void }) => {
  const eligibility = checkEligibility(profile.last_donation_date);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-premium-red pt-14 pb-24 px-6 rounded-b-[48px] text-white relative overflow-hidden shadow-2xl shadow-red-100">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse"></div>
        <div className="flex justify-between items-start mb-8 relative z-10">
          <h1 className="text-2xl font-black tracking-tight">আমার প্রোফাইল</h1>
          <button onClick={onLogout} className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md hover:bg-white/20 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-premium-red shadow-2xl border-4 border-white/20">
            <span className="text-4xl font-black">{profile.blood_group}</span>
          </div>
          <div>
            <h2 className="text-2xl font-black leading-tight">{profile.name}</h2>
            <p className="text-white/80 text-sm font-medium flex items-center gap-1.5 mt-1.5">
              <MapPin size={14} className="text-white/60" /> {profile.location}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-12 space-y-5 relative z-10">
        <div className="bg-white rounded-[32px] p-7 shadow-xl shadow-gray-200/50 border border-gray-50">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">রক্তদানের যোগ্যতা</h3>
            {eligibility.isEligible ? (
              <span className="bg-green-100 text-green-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">যোগ্য</span>
            ) : (
              <span className="bg-red-100 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">অযোগ্য</span>
            )}
          </div>
          
          {eligibility.isEligible ? (
            <div className="flex items-center gap-4 text-green-600 bg-green-50/50 p-4 rounded-2xl border border-green-50">
              <CheckCircle2 size={28} />
              <p className="text-sm font-bold">আপনি এখন রক্তদান করতে পারবেন!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-red-500 bg-red-50/50 p-4 rounded-2xl border border-red-50">
                <AlertCircle size={28} />
                <p className="text-sm font-bold">আপনি বর্তমানে রক্তদানের জন্য প্রস্তুত নন।</p>
              </div>
              <div className="bg-gray-50/80 rounded-2xl p-5 flex justify-between items-center border border-gray-100">
                <div>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">পরবর্তী তারিখ</p>
                  <p className="text-sm font-black text-gray-800">{eligibility.nextAvailableDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">বাকি দিন</p>
                  <p className="text-sm font-black text-premium-red">{eligibility.daysRemaining} দিন</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-[28px] p-6 shadow-lg shadow-gray-100 border border-gray-50">
            <Calendar className="text-blue-500 mb-3" size={24} />
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">শেষ রক্তদান</p>
            <p className="text-sm font-black text-gray-800">{profile.last_donation_date || 'কখনো নয়'}</p>
          </div>
          <div className="bg-white rounded-[28px] p-6 shadow-lg shadow-gray-100 border border-gray-50">
            <Phone className="text-green-500 mb-3" size={24} />
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">ফোন নম্বর</p>
            <p className="text-sm font-black text-gray-800">{profile.phone}</p>
          </div>
        </div>

        <button className="w-full bg-white text-gray-800 font-black py-5 rounded-[28px] border border-gray-100 flex items-center justify-between px-8 shadow-lg shadow-gray-100 active:scale-[0.98] transition-all">
          <span>তথ্য আপডেট করুন</span>
          <ChevronRight size={20} className="text-gray-300" />
        </button>
      </div>
    </div>
  );
};

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 pt-14 pb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">রক্তবন্ধন</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">স্বাগতম, মানবতার সেবায়</p>
        </div>
        <div className="relative">
          <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-premium-red transition-colors">
            <Bell size={22} />
          </div>
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-premium-red border-4 border-white rounded-full"></span>
        </div>
      </header>

      <div className="px-6 mb-10">
        <div className="bg-premium-red rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-red-100">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-2 leading-tight">রক্তদাতা খুঁজছেন?</h2>
            <p className="text-white/80 text-sm font-medium mb-8 max-w-[200px]">আপনার এলাকায় জরুরি রক্তের প্রয়োজনে অনুরোধ পোস্ট করুন।</p>
            <Link to="/post-request" className="bg-white text-premium-red px-8 py-3.5 rounded-2xl text-sm font-black inline-block shadow-xl shadow-red-900/20 active:scale-95 transition-transform">
              অনুরোধ করুন
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">রক্তের গ্রুপসমূহ</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
            <div key={bg} className="bg-white min-w-[72px] h-20 rounded-[24px] flex flex-col items-center justify-center shrink-0 border border-gray-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all group">
              <span className="text-lg font-black text-gray-800 group-hover:text-premium-red">{bg}</span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">রক্ত</span>
            </div>
          ))}
        </div>
      </div>

      <EmergencyRequests />
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile();
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile();
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getCurrentProfile();
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-[#D32F2F]"
        >
          <Droplets size={48} />
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  return (
    <Router>
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl shadow-gray-200">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={profile ? <ProfileView profile={profile} onLogout={signOutUser} /> : <div className="p-10 text-center">লোড হচ্ছে...</div>} />
          <Route path="/requests" element={
            <div className="min-h-screen bg-white pt-24 px-6">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-premium-red-light text-premium-red rounded-[28px] mb-6">
                  <Bell size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-3">সব অনুরোধ</h2>
                <p className="text-gray-400 text-sm font-medium max-w-[240px] mx-auto">বর্তমানে কোনো নতুন অনুরোধ নেই। শীঘ্রই আরও ফিচার যুক্ত করা হবে।</p>
              </div>
            </div>
          } />
          <Route path="/search" element={
            <div className="min-h-screen bg-white pt-24 px-6">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 text-blue-600 rounded-[28px] mb-6">
                  <Search size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-3">দাতা খুঁজুন</h2>
                <p className="text-gray-400 text-sm font-medium max-w-[240px] mx-auto">আপনার এলাকায় রক্তদাতা খুঁজে পেতে এই ফিচারটি শীঘ্রই চালু হবে।</p>
              </div>
            </div>
          } />
          <Route path="/post" element={
            <div className="min-h-screen bg-white pt-24 px-6">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-50 text-pink-600 rounded-[28px] mb-6">
                  <Heart size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-3">গল্প শেয়ার করুন</h2>
                <p className="text-gray-400 text-sm font-medium max-w-[240px] mx-auto">আপনার রক্তদানের অভিজ্ঞতা অন্যদের সাথে শেয়ার করুন।</p>
              </div>
            </div>
          } />
          <Route path="/post-request" element={
            <div className="min-h-screen bg-white pt-24 px-6 pb-32">
              <div className="mb-8">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">জরুরি রক্ত প্রয়োজন?</h2>
                <p className="text-gray-400 text-sm font-medium mt-1">নিচের তথ্যগুলো পূরণ করে অনুরোধ পোস্ট করুন।</p>
              </div>
              <form className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">রক্তের গ্রুপ</label>
                  <select className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-red-100 focus:bg-white transition-all outline-none appearance-none">
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">হাসপাতালের নাম</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-red-100 focus:bg-white transition-all outline-none" placeholder="হাসপাতালের নাম ও ঠিকানা" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">অবস্থান (শহর)</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-red-100 focus:bg-white transition-all outline-none" placeholder="শহরের নাম" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">যোগাযোগের নম্বর</label>
                  <input type="tel" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-red-100 focus:bg-white transition-all outline-none" placeholder="০১XXXXXXXXX" />
                </div>
                <button type="button" className="w-full bg-premium-red text-white font-black py-4.5 rounded-[24px] shadow-2xl shadow-red-200 active:scale-[0.97] transition-all text-base tracking-wide mt-4">
                  অনুরোধ পোস্ট করুন
                </button>
              </form>
            </div>
          } />
        </Routes>
        <Navbar userProfile={profile} />
      </div>
    </Router>
  );
}
