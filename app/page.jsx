'use client';
import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Factory, 
  Truck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Plus,
  LogOut,
  Package,
  Tag,
  ArrowLeft,
  MapPin,
  Sun,
  Globe,
  Zap,
  Battery,
  Trash2
} from 'lucide-react';

// --- Mock Data (Solar Focused) ---
const INITIAL_PRODUCTS = [
  { id: 1, name: "Monocrystalline Solar Panels 450W", category: "Solar Modules", price: 210, supplier: "Helios Manufactory", description: "High-efficiency PERC cells suitable for residential.", supplyRegion: "North America", technology: "Monocrystalline", power: "450 W" },
  { id: 2, name: "Hybrid Inverter 10kW", category: "Inverters", price: 1250, supplier: "CurrentFlow Tech", description: "Smart grid-tie inverter with battery backup support.", supplyRegion: "Europe", technology: "Hybrid", power: "10 kW" },
  { id: 3, name: "Solar Aluminum Rail System", category: "Mounting", price: 45, supplier: "Structura Solar", description: "Corrosion-resistant anodized aluminum mounting rails.", supplyRegion: "Asia Pacific", technology: "Fixed Tilt", power: "N/A" },
  { id: 4, name: "LiFePO4 Battery Wall 5kWh", category: "Energy Storage", price: 2800, supplier: "VoltWorks Energy", description: "Long cycle life lithium battery for daily cycling.", supplyRegion: "Global", technology: "LiFePO4", power: "5 kWh" },
  { id: 5, name: "Solar Cable 4mm² (100m)", category: "Cabling", price: 120, supplier: "WireTech Solutions", description: "UV resistant double insulated PV cable.", supplyRegion: "Europe", technology: "Copper", power: "N/A" },
];

const CATEGORIES = ["Solar Modules", "Inverters", "Mounting", "Energy Storage", "Cabling", "Accessories"];
const REGIONS = ["North America", "Europe", "Asia Pacific", "Global", "South America", "Africa"];

// --- Helper for Category Specific Options ---
const getTechnologyOptions = (category) => {
  switch(category) {
    case "Solar Modules": return ["Monocrystalline", "Polycrystalline", "Bifacial", "Thin-Film", "PERC", "TOPCon"];
    case "Inverters": return ["String", "Microinverter", "Central", "Hybrid", "Off-Grid"];
    case "Energy Storage": return ["Li-Ion", "LiFePO4", "Lead-Acid", "Flow Battery"];
    case "Mounting": return ["Fixed Tilt", "Single-Axis Tracker", "Dual-Axis Tracker", "Roof Mount"];
    default: return ["Standard", "N/A"];
  }
};

const getPowerUnit = (category) => {
  switch(category) {
    case "Solar Modules": return "W";
    case "Inverters": return "kW";
    case "Energy Storage": return "kWh";
    default: return "Unit";
  }
};

// --- Shared Components ---

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20",
    secondary: "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20",
    outline: "border border-slate-200 hover:border-slate-300 text-slate-600 bg-white",
    ghost: "text-slate-500 hover:text-slate-700 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    solar: "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20",
    icon: "p-2 w-auto h-auto bg-transparent hover:bg-slate-100 text-slate-500",
  };

  return (
    <button className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
};

const InputField = ({ label, icon: Icon, type = "text", error, className = "", ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors">
            <Icon size={16} />
          </div>
        )}
        <input
          type={inputType}
          className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2 bg-white border rounded-lg outline-none transition-all duration-200 text-sm
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/10' 
              : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
            }
            text-slate-800 placeholder:text-slate-400`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}
    </div>
  );
};

const RoleCard = ({ selected, onClick, icon: Icon, title, description, colorClass }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative flex-1 p-4 rounded-xl border-2 text-left transition-all duration-300 group
      ${selected 
        ? `border-${colorClass}-500 bg-${colorClass}-50/50 ring-1 ring-${colorClass}-500/20` 
        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
      }`}
  >
    {selected && (
      <div className={`absolute -top-2 -right-2 bg-${colorClass}-500 text-white p-1 rounded-full shadow-sm`}>
        <CheckCircle2 size={12} />
      </div>
    )}
    <div className={`mb-3 p-2 w-fit rounded-lg ${selected ? `bg-${colorClass}-100 text-${colorClass}-600` : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
      <Icon size={20} />
    </div>
    <div className="space-y-1">
      <h3 className={`font-semibold text-sm ${selected ? `text-${colorClass}-900` : 'text-slate-700'}`}>
        {title}
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed">
        {description}
      </p>
    </div>
  </button>
);

// --- Sub-Views ---

/**
 * Authentication View
 */
const AuthView = ({ onLogin, onGuestAccess, onNetworkAccess }) => {
  const [authMode, setAuthMode] = useState('login');
  const [userRole, setUserRole] = useState('manufacturer');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', companyName: '', taxId: '' });

  const theme = userRole === 'manufacturer' 
    ? { primary: 'amber', gradient: 'from-amber-600 to-orange-600', text: 'text-amber-600', button: 'secondary' }
    : { primary: 'blue', gradient: 'from-blue-600 to-indigo-600', text: 'text-blue-600', button: 'primary' };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin({ ...formData, role: userRole });
    }, 1500);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[600px] w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden">
      {/* Left Side */}
      <div className={`relative w-full lg:w-5/12 p-8 lg:p-12 flex flex-col justify-between overflow-hidden bg-gradient-to-br ${theme.gradient} text-white`}>
        {/* Solar Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
           <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
             <defs>
               <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                 <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
               </pattern>
             </defs>
             <rect width="100%" height="100%" fill="url(#grid)" />
           </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8 opacity-90">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg"><Sun size={24} /></div>
            <span className="font-bold text-xl tracking-tight">SolarChain</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {authMode === 'login' ? 'Welcome Back.' : 'Power the Future.'}
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-sm">
            {userRole === 'manufacturer' ? "Connect with top-tier PV component manufacturers." : "Distribute your solar technology globally."}
          </p>
        </div>
        <div className="relative z-10 mt-8 space-y-3">
           <button onClick={onGuestAccess} className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors group">
             <span>Browse Solar Marketplace</span>
             <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
           </button>
           <button onClick={onNetworkAccess} className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors group">
             <span>View Global Supply Network</span>
             <Globe size={16} className="group-hover:rotate-12 transition-transform" />
           </button>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-7/12 p-8 lg:p-12 bg-white">
        <div className="max-w-md mx-auto h-full flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">{authMode === 'login' ? 'Sign In' : 'Create Account'}</h2>
          
          <div className="flex gap-4 mb-8">
            <RoleCard role="manufacturer" selected={userRole === 'manufacturer'} onClick={() => setUserRole('manufacturer')} icon={Factory} title="Manufacturer" description="Sourcing Components" colorClass="amber" />
            <RoleCard role="supplier" selected={userRole === 'supplier'} onClick={() => setUserRole('supplier')} icon={Truck} title="Supplier" description="Distribution & Sales" colorClass="blue" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {authMode === 'signup' && (
              <>
                <InputField label="Company Name" name="companyName" icon={Building2} placeholder="Helios Solar Inc." value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} required />
                <InputField label="Tax ID" name="taxId" icon={Lock} placeholder="XX-XXXX" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} required />
              </>
            )}
            <InputField label="Email" name="email" icon={Mail} type="email" placeholder="work@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            <InputField label="Password" name="password" icon={Lock} type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
            
            <Button type="submit" variant={theme.button} disabled={isLoading}>
              {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (authMode === 'login' ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              {authMode === 'login' ? "New here?" : "Have an account?"} <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className={`font-semibold ${theme.text} hover:underline`}>{authMode === 'login' ? 'Sign up' : 'Log in'}</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Dashboard View (Excel-like Design)
 */
const DashboardView = ({ user, products, onAddProduct, onDeleteProduct, onLogout }) => {
  const [newRow, setNewRow] = useState({ name: '', category: CATEGORIES[0], price: '', supplyRegion: REGIONS[0], description: '', technology: '', power: '' });
  
  const myProducts = products.filter(p => user.companyName ? p.supplier === user.companyName : true);

  const handleAddRow = () => {
    if (!newRow.name || !newRow.price) return;
    const powerUnit = getPowerUnit(newRow.category);
    const finalPower = newRow.power ? `${newRow.power} ${powerUnit}` : 'N/A';
    
    onAddProduct({ 
      ...newRow, 
      supplier: user.companyName || "My Company", 
      id: Date.now(),
      power: finalPower,
      technology: newRow.technology || 'Standard'
    });
    setNewRow({ name: '', category: CATEGORIES[0], price: '', supplyRegion: REGIONS[0], description: '', technology: '', power: '' });
  };

  const currentTechOptions = getTechnologyOptions(newRow.category);
  const currentPowerUnit = getPowerUnit(newRow.category);

  return (
    <div className="w-full max-w-7xl mx-auto bg-white min-h-[90vh] rounded-none md:rounded-2xl shadow-xl overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/20"><Sun size={20} className="text-white" /></div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">SolarChain Ops</h1>
            <p className="text-xs text-slate-400">Inventory Management Console • {user.companyName || user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs text-slate-300 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                System Online
            </div>
            <button onClick={onLogout} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"><LogOut size={16}/> Sign Out</button>
        </div>
      </header>

      {/* Excel-like Grid Area */}
      <div className="flex-1 bg-slate-50 p-4 md:p-8 overflow-x-auto">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden min-w-[1000px]">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-semibold text-slate-700 flex items-center gap-2"><Package size={18}/> Product Inventory</h2>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-8 text-xs"><Filter size={14}/> Filter</Button>
                    <Button variant="outline" className="h-8 text-xs"><Tag size={14}/> Export CSV</Button>
                </div>
            </div>

            {/* Table Header - Optimized for grid-cols-12 */}
            <div className="grid grid-cols-12 gap-0 bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-2 p-3 border-r border-slate-200">Product Name</div>
                <div className="col-span-2 p-3 border-r border-slate-200">Category</div>
                <div className="col-span-2 p-3 border-r border-slate-200 bg-orange-50/50">Type</div>
                <div className="col-span-1 p-3 border-r border-slate-200 bg-orange-50/50">Power</div>
                <div className="col-span-1 p-3 border-r border-slate-200">Price ($)</div>
                <div className="col-span-1 p-3 border-r border-slate-200">Region</div>
                <div className="col-span-2 p-3 border-r border-slate-200">Description</div>
                <div className="col-span-1 p-3 text-center">Action</div>
            </div>

            {/* Existing Rows */}
            <div className="divide-y divide-slate-100">
                {myProducts.length > 0 ? myProducts.map(p => (
                    <div key={p.id} className="grid grid-cols-12 gap-0 hover:bg-slate-50 transition-colors text-sm group">
                        <div className="col-span-2 p-3 border-r border-slate-100 flex items-center font-medium text-slate-900 truncate" title={p.name}>{p.name}</div>
                        <div className="col-span-2 p-3 border-r border-slate-100 flex items-center text-slate-600">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs border border-slate-200">{p.category}</span>
                        </div>
                        <div className="col-span-2 p-3 border-r border-slate-100 flex items-center text-slate-600 truncate bg-orange-50/10">
                            <span className="text-xs font-medium text-slate-500">{p.technology || '-'}</span>
                        </div>
                        <div className="col-span-1 p-3 border-r border-slate-100 flex items-center font-mono text-slate-700 bg-orange-50/10">{p.power || '-'}</div>
                        <div className="col-span-1 p-3 border-r border-slate-100 flex items-center font-mono text-slate-700 font-bold">${p.price}</div>
                        <div className="col-span-1 p-3 border-r border-slate-100 flex items-center text-slate-600 truncate">{p.supplyRegion}</div>
                        <div className="col-span-2 p-3 border-r border-slate-100 flex items-center text-slate-500 truncate text-xs" title={p.description}>{p.description}</div>
                        <div className="col-span-1 p-3 flex items-center justify-center">
                            <button onClick={() => onDeleteProduct(p.id)} aria-label="Delete product" className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="p-8 text-center text-slate-400 italic">No products in inventory. Add one below.</div>
                )}
            </div>

            {/* Add New Row (Excel Input Style) */}
            <div className="grid grid-cols-12 gap-0 bg-blue-50/30 border-t border-blue-100">
                <div className="col-span-2 p-2 border-r border-blue-100">
                    <input 
                        className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" 
                        placeholder="Name..."
                        value={newRow.name}
                        onChange={e => setNewRow({...newRow, name: e.target.value})}
                        aria-label="Product Name"
                    />
                </div>
                <div className="col-span-2 p-2 border-r border-blue-100">
                    <select 
                        className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={newRow.category}
                        onChange={e => setNewRow({...newRow, category: e.target.value, technology: '', power: ''})}
                        aria-label="Category"
                    >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="col-span-2 p-2 border-r border-blue-100 bg-white/50">
                    <select 
                        className="w-full bg-white border border-orange-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-600"
                        value={newRow.technology}
                        onChange={e => setNewRow({...newRow, technology: e.target.value})}
                        aria-label="Technology Type"
                    >
                        <option value="" disabled>Select Type</option>
                        {currentTechOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="col-span-1 p-2 border-r border-blue-100 bg-white/50 relative">
                    <input 
                        type="number"
                        className="w-full bg-white border border-orange-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none pr-8" 
                        placeholder="0"
                        value={newRow.power}
                        onChange={e => setNewRow({...newRow, power: e.target.value})}
                        aria-label="Power Rating"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">{currentPowerUnit}</span>
                </div>
                <div className="col-span-1 p-2 border-r border-blue-100">
                    <input 
                        type="number"
                        className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" 
                        placeholder="0.00"
                        value={newRow.price}
                        onChange={e => setNewRow({...newRow, price: e.target.value})}
                        aria-label="Price"
                    />
                </div>
                <div className="col-span-1 p-2 border-r border-blue-100">
                    <select 
                        className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={newRow.supplyRegion}
                        onChange={e => setNewRow({...newRow, supplyRegion: e.target.value})}
                        aria-label="Region"
                    >
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="col-span-2 p-2 border-r border-blue-100">
                    <input 
                        className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" 
                        placeholder="Desc..."
                        value={newRow.description}
                        onChange={e => setNewRow({...newRow, description: e.target.value})}
                        aria-label="Description"
                    />
                </div>
                <div className="col-span-1 p-2 flex items-center justify-center">
                    <button 
                        onClick={handleAddRow}
                        className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-700 shadow-sm w-full justify-center"
                    >
                        <Plus size={14}/> Add
                    </button>
                </div>
            </div>
        </div>
        <p className="mt-4 text-xs text-slate-400 flex items-center gap-1"><AlertCircle size={12}/> Tips: Category selection updates available &apos;Type&apos; and &apos;Power&apos; fields.</p>
      </div>
    </div>
  );
};

/**
 * Solar Network View (Enhanced with Filters & List)
 */
const SolarNetworkView = ({ products, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.supplier.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
        const matchesRegion = regionFilter === 'All' || p.supplyRegion === regionFilter;
        return matchesSearch && matchesCategory && matchesRegion;
    });
  }, [products, searchTerm, categoryFilter, regionFilter]);

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
        {/* Navigation Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-20">
            <div className="flex items-center gap-4">
                <button onClick={onBack} aria-label="Go back" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="bg-orange-500 p-1.5 rounded-lg"><Globe size={20} className="text-white"/></div>
                    <h1 className="text-xl font-bold text-slate-800">Global Solar Network</h1>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-sm text-slate-500 hidden md:block">
                    Connected Suppliers: <strong className="text-slate-800">{new Set(products.map(p => p.supplier)).size}</strong>
                </div>
                <Button variant="primary" className="h-9">Partner Login</Button>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Filters */}
            <div className="w-80 bg-white border-r border-slate-200 p-6 flex-col gap-6 hidden md:flex overflow-y-auto z-10">
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Search & Filter</h3>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                            placeholder="Search keywords..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            aria-label="Search products"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Component Category</label>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                            <input type="radio" name="cat" checked={categoryFilter === 'All'} onChange={() => setCategoryFilter('All')} className="text-orange-500 focus:ring-orange-500" />
                            All Components
                        </label>
                        {CATEGORIES.map(c => (
                            <label key={c} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                <input type="radio" name="cat" checked={categoryFilter === c} onChange={() => setCategoryFilter(c)} className="text-orange-500 focus:ring-orange-500" />
                                {c}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Supply Region</label>
                    <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-orange-500"
                        value={regionFilter}
                        onChange={e => setRegionFilter(e.target.value)}
                        aria-label="Filter by region"
                    >
                        <option value="All">Global (All Regions)</option>
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800">Available Inventory ({filteredProducts.length})</h2>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50">Sort by: Price</button>
                            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50">Sort by: Region</button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row gap-6">
                                {/* Image / Icon */}
                                <div className="w-full md:w-48 h-32 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-slate-200/50 skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                    {product.category === "Inverters" ? <Zap size={32} className="text-slate-400"/> : product.category === "Energy Storage" ? <Battery size={32} className="text-slate-400"/> : <Sun size={32} className="text-slate-400"/>}
                                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 shadow-sm">
                                        ID: {product.id}
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                                                    ${product.category === 'Solar Modules' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}
                                                `}>
                                                    {product.category}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={10}/> {product.supplyRegion || "Global"}</span>
                                            </div>
                                            <span className="text-lg font-bold text-slate-900">${product.price}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-1">{product.name}</h3>
                                        
                                        {/* Specs Row */}
                                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                                           {product.technology && (
                                              <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                <Tag size={10} /> {product.technology}
                                              </span>
                                           )}
                                           {product.power && product.power !== 'N/A' && (
                                              <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                <Zap size={10} className="text-yellow-500" /> {product.power}
                                              </span>
                                           )}
                                        </div>

                                        <p className="text-sm text-slate-500 line-clamp-2">{product.description}</p>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold">
                                                {product.supplier.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">{product.supplier}</span>
                                            <CheckCircle2 size={14} className="text-blue-500" />
                                        </div>
                                        <button className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                            View Details &rarr;
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

// --- Main Application Component ---

export default function App() {
  const [view, setView] = useState('auth'); // 'auth' | 'dashboard' | 'marketplace' | 'network'
  const [user, setUser] = useState(null); // { role, companyName, ... }
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [notification, setNotification] = useState(null);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
        setNotification(null);
    }, 3000);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setView('dashboard');
    showNotification(`Welcome, ${userData.companyName || 'User'}!`);
  };

  const handleLogout = () => {
    setUser(null);
    setView('auth');
    showNotification('Logged out successfully.');
  };

  const handleAddProduct = (newProduct) => {
    setProducts([...products, newProduct]);
    showNotification('Product added to inventory.');
  };

  const handleDeleteProduct = (id) => {
      setProducts(products.filter(p => p.id !== id));
      showNotification('Product removed.');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
      
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 text-sm font-medium">
            <CheckCircle2 size={16} className="text-green-400" />
            {notification}
          </div>
        </div>
      )}

      {/* View Routing */}
      <div className={`w-full transition-all duration-500 ${view === 'auth' ? 'p-4 md:p-6 flex items-center justify-center' : ''}`}>
        {view === 'auth' && (
            <AuthView 
            onLogin={handleLogin} 
            onGuestAccess={() => setView('network')}
            onNetworkAccess={() => setView('network')}
            />
        )}
        
        {view === 'dashboard' && user && (
            <DashboardView 
            user={user} 
            products={products}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            onLogout={handleLogout}
            />
        )}

        {view === 'network' && (
            <SolarNetworkView 
            products={products}
            onBack={() => setView('auth')}
            />
        )}
      </div>

      {/* Global Footer (only show on Auth) */}
      {view === 'auth' && (
        <div className="fixed bottom-4 left-0 w-full text-center pointer-events-none mix-blend-multiply opacity-50">
            <p className="text-xs text-slate-500">
            SolarChain Platform © 2026
            </p>
        </div>
      )}
    </div>
  );
}