'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sun, Mail, Lock, Building2, ArrowRight, 
  CheckCircle, Loader2, Globe, Sparkles 
} from 'lucide-react';

export default function MainPage() {
  const router = useRouter();
  
  // State
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', companyName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }
    if (!isLogin && !formData.companyName) {
      setError('Company Name is required for registration.');
      setLoading(false);
      return;
    }

    // Simulate Login API
    setTimeout(() => {
      const userProfile = {
        id: Date.now(),
        email: formData.email,
        companyName: isLogin ? "Solar Tech Solutions" : formData.companyName, 
        role: 'supplier',
        isLoggedIn: true
      };
      localStorage.setItem('currentUser', JSON.stringify(userProfile));
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white flex font-sans text-slate-800">
      
      {/* LEFT SIDE: Branding & Public Access */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-between p-12 overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80 z-0"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl z-0"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900 to-transparent z-10"></div>

        {/* Brand Header */}
        <div className="relative z-20 flex items-center gap-3">
          <div className="p-2 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/30">
            <Sun size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">SolarChain Ops</span>
        </div>

        {/* Hero Text */}
        <div className="relative z-20 mb-12">
           <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
             Powering the Future of <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">Solar Supply Chain</span>
           </h2>
           <p className="text-slate-400 text-lg max-w-md leading-relaxed">
             Connect with global distributors, manage inventory in real-time, and scale your solar business with our unified platform.
           </p>
           
           <div className="mt-8 flex gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500"/> Verified Suppliers
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500"/> Global Reach
              </div>
           </div>
        </div>

        {/* NEW BUTTON: Public Marketplace Access */}
        <div className="relative z-20">
           <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                 <div>
                   <p className="text-white font-bold mb-1">Looking for products?</p>
                   <p className="text-slate-400 text-xs">Browse our public catalog without signing in.</p>
                 </div>
                 <button 
                   onClick={() => router.push('/suppliers')}
                   className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-bold text-sm transition-all flex items-center gap-2 group shadow-lg"
                 >
                   <Globe size={16}/> Browse Marketplace
                   <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform opacity-50"/>
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50 lg:bg-white">
        <div className="w-full max-w-md">
          
          {/* Mobile Header (Visible only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex p-3 bg-orange-500 rounded-xl mb-4 shadow-lg shadow-orange-500/30">
               <Sun size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">SolarChain Ops</h1>
          </div>

          <div className="bg-white lg:bg-transparent rounded-2xl shadow-xl lg:shadow-none p-8 lg:p-0 border border-slate-100 lg:border-none">
            
            <div className="mb-8">
               <h2 className="text-2xl font-bold text-slate-900">{isLogin ? 'Welcome back' : 'Create an account'}</h2>
               <p className="text-slate-500 text-sm mt-2">
                 {isLogin ? 'Enter your credentials to access your dashboard.' : 'Join the network to start listing your products.'}
               </p>
            </div>

            {/* Toggle Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
              <button 
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Log In
              </button>
              <button 
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">Company Name</label>
                  <div className="relative group">
                    <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm font-medium"
                      placeholder="e.g. GreenEnergy PV Pvt Ltd"
                      value={formData.companyName}
                      onChange={e => setFormData({...formData, companyName: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">Email Address</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                  <input 
                    type="email" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm font-medium"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between ml-1">
                   <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                   {isLogin && <a href="#" className="text-xs text-orange-600 hover:text-orange-700 font-medium">Forgot?</a>}
                </div>
                <div className="relative group">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                  <input 
                    type="password" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm font-medium"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></div> {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign In to Dashboard' : 'Create Supplier Account'}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Mobile Only: Browse Marketplace Link */}
            <div className="lg:hidden mt-8 pt-6 border-t border-slate-100 text-center">
               <button 
                 onClick={() => router.push('/suppliers')}
                 className="text-sm font-medium text-slate-500 hover:text-orange-600 flex items-center justify-center gap-2 w-full"
               >
                 <Globe size={16}/> Browse Products as Guest
               </button>
            </div>
          </div>
          
          <p className="text-center text-xs text-slate-400 mt-8">
            &copy; 2024 SolarChain Operations. Secure Enterprise Connection.
          </p>
        </div>
      </div>
    </div>
  );
}