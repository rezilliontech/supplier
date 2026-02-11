"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sun, LogOut, Package, Plus, Trash2, X, Edit2, ArrowLeft, ArrowRight,
  MapPin, Save, FileText, UploadCloud, Layers, Zap, Calendar, FileCode, 
  LayoutTemplate, DollarSign, Settings2, CheckCircle2, User, Mail, Phone, 
  Globe, Image as ImageIcon, Camera, MoreVertical, ChevronDown, Truck, Clock
} from "lucide-react";
import { ProductData, RowDefinition, DashboardResponse } from "@/types";

// --- TYPES ---
interface LocationEntry {
  state: string;
  city: string;
  price: number;
}

interface ExtendedProductData extends ProductData {
  id: number;
  name: string;
  supplier?: string;
  category?: "module" | "inverter";
  technology?: string;
  type?: string;
  power_kw?: number;
  min_order?: string;
  qty_mw?: number;
  price_ex_factory?: number;
  price_ex_10mw?: number;
  validity?: string; 
  datasheet?: string;
  panfile?: string;
  ondfile?: string;
  
  // New Fields
  stock_location?: string;
  availability_days?: number;
  row_order?: number;

  locations?: LocationEntry[]; 
  [key: string]: unknown;
}

interface RowDef {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "file" | "select";
  options?: string[];
  category: "module" | "inverter";
  isCustom?: boolean; 
}

interface UserProfile {
  companyName: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  aboutUs: string;
  gallery: string[];
}

interface User {
  id: string | number;
  companyName: string;
}

// --- CONSTANTS ---
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry'
];

const MODULE_FIELDS: RowDef[] = [
  { id: "type", label: "Module Type", type: "select", options: ["p-Type", "n-Type"], category: "module" },
  { id: "technology", label: "Technology", type: "select", options: ["Monocrystalline", "Polycrystalline", "Bifacial", "Thin Film", "TopCon", "HJT"], category: "module" },
  { id: "power_kw", label: "Power (Wp)", type: "number", category: "module" },
  { id: "min_order", label: "Min Order (MWp/KWp)", type: "text", category: "module" },
  { id: "qty_mw", label: "Qty (MW)", type: "number", category: "module" },
  { id: "validity", label: "Price Validity", type: "date", category: "module" }, 
  { id: "datasheet", label: "Datasheet (PDF)", type: "file", category: "module" },
  { id: "panfile", label: "PAN File (.pan)", type: "file", category: "module" },
];

const INVERTER_FIELDS: RowDef[] = [
  { id: "technology", label: "Technology", type: "text", category: "inverter" },
  { id: "power_kw", label: "Power (kW)", type: "number", category: "inverter" },
  { id: "min_order", label: "Min Order Qty", type: "text", category: "inverter" },
  { id: "qty_mw", label: "Qty (MW)", type: "number", category: "inverter" },
  { id: "validity", label: "Price Validity", type: "date", category: "inverter" }, 
  { id: "price_ex_10mw", label: "Price Ex-Factory (10 MWp)", type: "number", category: "inverter" },
  { id: "datasheet", label: "Datasheet (PDF)", type: "file", category: "inverter" },
  { id: "ondfile", label: "OND File (.ond)", type: "file", category: "inverter" },
];

const ROW_HEIGHT = "h-14"; 
const HEADER_HEIGHT = "h-[160px]";
const LOCATION_HEIGHT = "h-[200px]";

// --- COMPONENT: PROFILE MODAL ---
const ProfileModal = ({ 
  isOpen, onClose, user, initialProfile, onSave 
}: { 
  isOpen: boolean; onClose: () => void; user: User | null; initialProfile: UserProfile; onSave: (p: UserProfile) => void;
}) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setProfile(initialProfile); }, [initialProfile]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      try {
          const formData = new FormData();
          formData.append("file", e.target.files[0]);
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          const { url } = await res.json();
          if (url) setProfile(prev => ({ ...prev, gallery: [...prev.gallery, url] }));
      } catch (err) { console.error(err); alert("Upload failed."); } finally { setUploading(false); }
    }
  };

  const removeImage = (index: number) => { setProfile(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) })); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="h-16 bg-slate-50 border-b border-slate-200 flex justify-between items-center px-6 shrink-0">
          <div className="flex items-center gap-3"><div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><User size={20} /></div><div><h2 className="text-lg font-bold text-slate-800">Company Profile</h2></div></div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-0 flex flex-col md:flex-row">
          <div className="w-full md:w-1/3 border-r border-slate-100 p-6 bg-slate-50/50 space-y-5">
             <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Company Name</label><input className="w-full p-2 border border-slate-300 rounded bg-white text-sm" value={profile.companyName} onChange={e => setProfile({...profile, companyName: e.target.value})} /></div>
             <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Email</label><div className="flex items-center bg-white border border-slate-300 rounded"><div className="p-2 bg-slate-100 text-slate-400 border-r border-slate-200"><Mail size={14}/></div><input className="w-full p-2 text-sm" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} /></div></div>
             <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Phone</label><div className="flex items-center bg-white border border-slate-300 rounded"><div className="p-2 bg-slate-100 text-slate-400 border-r border-slate-200"><Phone size={14}/></div><input className="w-full p-2 text-sm" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} /></div></div>
             <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Location</label><div className="flex items-center bg-white border border-slate-300 rounded"><div className="p-2 bg-slate-100 text-slate-400 border-r border-slate-200"><MapPin size={14}/></div><input className="w-full p-2 text-sm" value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} /></div></div>
             <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Website</label><div className="flex items-center bg-white border border-slate-300 rounded"><div className="p-2 bg-slate-100 text-slate-400 border-r border-slate-200"><Globe size={14}/></div><input className="w-full p-2 text-sm" value={profile.website} onChange={e => setProfile({...profile, website: e.target.value})} /></div></div>
          </div>
          <div className="flex-1 p-6 space-y-6">
             <div className="space-y-2"><label className="text-sm font-bold text-slate-800 flex items-center gap-2"><FileText size={16} className="text-indigo-500"/> About Us</label><textarea className="w-full h-32 p-3 text-sm border border-slate-200 rounded-lg" value={profile.aboutUs} onChange={e => setProfile({...profile, aboutUs: e.target.value})} /></div>
             <div className="space-y-3">
                <div className="flex justify-between items-end border-b border-slate-100 pb-2"><label className="text-sm font-bold text-slate-800 flex items-center gap-2"><ImageIcon size={16} className="text-orange-500"/> Gallery</label><button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full"><Camera size={14}/> {uploading ? '...' : 'Add'}</button><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} /></div>
                <div className="grid grid-cols-3 gap-3">{profile.gallery.map((img, i) => (<div key={i} className="relative group aspect-video rounded-lg overflow-hidden border border-slate-200"><img src={img} className="w-full h-full object-cover" /><button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><Trash2 size={12}/></button></div>))}</div>
             </div>
          </div>
        </div>
        <div className="h-16 border-t border-slate-200 p-4 flex justify-end items-center gap-3 bg-slate-50 shrink-0"><button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-slate-600">Cancel</button><button onClick={() => { onSave(profile); onClose(); }} className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg flex items-center gap-2"><Save size={16}/> Save</button></div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
export default function DashboardPage() {
  const router = useRouter();

  // --- STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"module" | "inverter">("module");
  const [products, setProducts] = useState<ExtendedProductData[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Logic State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<UserProfile>({
    companyName: "", email: "", phone: "", website: "", location: "", aboutUs: "", gallery: []
  });

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<ExtendedProductData>>({});
  const [locInput, setLocInput] = useState<{state: string, city: string, price: string}>({ state: "", city: "", price: "" });
  const [locations, setLocations] = useState<LocationEntry[]>([]);
  const [customFields, setCustomFields] = useState<RowDef[]>([]);

  // --- API HELPER ---
  const apiCall = async (action: string, data: Record<string, unknown>) => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      if (!storedUser) return null;
      const parsedUser = JSON.parse(storedUser);
      const requestData = { ...data, supplierId: parsedUser.id };

      const res = await fetch("/api/supplierdashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data: requestData }),
      });
      return await res.json();
    } catch (err) { console.error(err); return null; }
  };

  // --- LOAD DATA ---
  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem("currentUser");
      if (!storedUser) { router.push("/"); return; }
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      try {
        const res = await fetch(`/api/supplierdashboard?supplierId=${parsedUser.id}`);
        const data = await res.json();
        
        const cleanProducts = (data.products || []).map((p: ExtendedProductData) => ({
            ...p,
            category: p.category || "module",
            locations: p.locations || [] 
        }));
        setProducts(cleanProducts);

        if (data.profile) {
            setCompanyProfile(prev => ({
                ...prev, ...data.profile,
                gallery: data.profile.gallery || [],
                companyName: data.profile.companyName || parsedUser.companyName || prev.companyName,
                email: data.profile.email || prev.email,
                phone: data.profile.phone || prev.phone
            }));
        }
        
        // Detect custom fields
        const standardIds = new Set([...MODULE_FIELDS, ...INVERTER_FIELDS].map(f => f.id));
        const detectedFields: RowDef[] = [];
        const seenKeys = new Set<string>();

        cleanProducts.forEach((p: ExtendedProductData) => {
            Object.keys(p).forEach(key => {
                if (!standardIds.has(key) && !['id', 'name', 'supplier', 'supplier_id', 'category', 'created_at', 'updated_at', 'locations', 'price_ex_factory', 'attributes', 'stock_location', 'availability_days', 'row_order'].includes(key)) {
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        detectedFields.push({ id: key, label: label, type: 'text', category: p.category || 'module', isCustom: true });
                    }
                }
            });
        });
        setCustomFields(detectedFields);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    init();
  }, [router]);

  const handleLogout = () => { localStorage.removeItem("currentUser"); router.push("/"); };

  const handleSaveProfile = async (newProfile: UserProfile) => {
      setCompanyProfile(newProfile);
      await apiCall("update_profile", { ...newProfile });
  };

  const handleAddCustomField = () => {
    const label = prompt("Enter Name for new field (e.g. Frame Color):");
    if (!label) return;
    const id = label.toLowerCase().replace(/\s+/g, '_');
    if (customFields.some(f => f.id === id) || [...MODULE_FIELDS, ...INVERTER_FIELDS].some(f => f.id === id)) { alert("Field exists!"); return; }
    setCustomFields([...customFields, { id, label, type: 'text', category: activeTab, isCustom: true }]);
  };

  const handleDeleteCustomField = (fieldId: string) => { if(window.confirm("Remove view?")) setCustomFields(customFields.filter(f => f.id !== fieldId)); };

  const startEditing = (product: ExtendedProductData) => { setEditingId(product.id as number); setFormData({ ...product }); setLocations(product.locations || []); };
  const cancelEditing = () => { setEditingId(null); setFormData({}); setLocations([]); setLocInput({ state: "", city: "", price: "" }); };

  const handleFileChange = async (field: string, file: File | undefined) => {
    if (!file) return;
    setFormData(prev => ({ ...prev, [field]: "Uploading..." }));
    try {
      const formData = new FormData(); formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const { url } = await res.json();
      setFormData(prev => ({ ...prev, [field]: url }));
    } catch { alert("Upload failed."); setFormData(prev => ({ ...prev, [field]: "" })); }
  };

  const addLocation = () => {
    if (!locInput.state || !locInput.city || !locInput.price) return alert("Fill all fields");
    setLocations([...locations, { state: locInput.state, city: locInput.city, price: Number(locInput.price) }]);
    setLocInput({ state: "", city: "", price: "" });
  };
  const removeLocation = (index: number) => { setLocations(locations.filter((_, i) => i !== index)); };

  const handleSaveProduct = async () => {
    if (!formData.name) return alert("Name required");
    const payload = { ...formData, supplier: user?.companyName || "My Company", category: activeTab, locations: locations };
    const action = editingId ? "update_product" : "create_product";
    const res = await apiCall(action, payload);
    if (res?.success) {
      if (editingId) {
        setProducts(products.map(p => p.id === editingId ? { ...payload, id: editingId } as ExtendedProductData : p));
      } else {
        setProducts([...products, { ...payload, id: res.newId } as ExtendedProductData]);
      }
      cancelEditing(); 
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Delete product?")) {
      setProducts(products.filter(p => p.id !== id));
      await apiCall("delete_product", { id });
      if (editingId === id) cancelEditing();
    }
  };

  // --- REORDER LOGIC ---
  const moveProduct = async (index: number, direction: "left" | "right") => {
    const currentList = filteredProducts;
    const newIndex = direction === "left" ? index - 1 : index + 1;

    // Safety check
    if (newIndex < 0 || newIndex >= currentList.length) return;

    // Create a copy of the *full* product list to modify
    const allProductsCopy = [...products];
    
    // Find global indices in the master list
    const itemA = currentList[index];
    const itemB = currentList[newIndex];
    
    const globalIndexA = allProductsCopy.findIndex(p => p.id === itemA.id);
    const globalIndexB = allProductsCopy.findIndex(p => p.id === itemB.id);

    // Swap locally
    [allProductsCopy[globalIndexA], allProductsCopy[globalIndexB]] = [allProductsCopy[globalIndexB], allProductsCopy[globalIndexA]];
    
    // Optimistic Update
    setProducts(allProductsCopy);

    // Send Reorder to API
    // We only need to send the items that changed, or the whole category list re-indexed
    const updatedCategoryList = allProductsCopy.filter(p => p.category === activeTab);
    const reorderPayload = updatedCategoryList.map((p, idx) => ({ id: p.id, row_order: idx }));

    await apiCall('reorder_products', { items: reorderPayload });
  };

  // --- RENDER HELPERS ---
  const filteredProducts = products.filter(p => p.category === activeTab);
  const activeFields = [...(activeTab === 'module' ? MODULE_FIELDS : INVERTER_FIELDS), ...customFields.filter(f => f.category === activeTab)];

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-400 animate-pulse">Loading Dashboard...</div>;

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-50 shrink-0 h-16 shadow-sm relative">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg shadow-sm ${activeTab === 'module' ? 'bg-orange-100' : 'bg-blue-100'}`}>
            {activeTab === 'module' ? <Sun size={20} className="text-orange-600" /> : <Zap size={20} className="text-blue-600" />}
          </div>
          <div><h1 className="font-bold text-lg leading-tight text-slate-900">Supplier Dashboard</h1><p className="text-xs text-slate-500 font-medium tracking-wide">MANAGEMENT PORTAL</p></div>
          <div className="h-8 w-px bg-slate-200 mx-2"></div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button onClick={() => { setActiveTab("module"); cancelEditing(); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'module' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}><Layers size={14} /> Modules</button>
             <button onClick={() => { setActiveTab("inverter"); cancelEditing(); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'inverter' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><Zap size={14} /> Inverters</button>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 group outline-none">
            <div className="text-right hidden sm:block"><div className="text-xs font-bold text-slate-700">{user?.companyName || "Company"}</div><div className="text-[10px] text-slate-400">Administrator</div></div>
            <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg"><span className="font-bold text-sm">{user?.companyName?.[0] || "U"}</span></div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}/>
          </button>
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50">
                 <div className="p-3 border-b border-slate-50 bg-slate-50/50"><p className="text-xs font-bold text-slate-800">{user?.companyName}</p><p className="text-[10px] text-slate-400 truncate">{companyProfile.email}</p></div>
                 <div className="p-1"><button onClick={() => { setShowProfileModal(true); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-indigo-50 rounded-lg"><User size={14}/> Company Profile</button></div>
                 <div className="border-t border-slate-100 p-1"><button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg"><LogOut size={14}/> Sign Out</button></div>
              </div>
            </>
          )}
        </div>
      </header>
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} user={user} initialProfile={companyProfile} onSave={handleSaveProfile} />

      {/* WORKSPACE AREA */}
      <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
        <div className="flex min-w-max h-full">
          
          {/* LEFT COLUMN */}
          <div className="w-[280px] flex-shrink-0 bg-white border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30 sticky left-0 flex flex-col h-full">
            <div className={`${HEADER_HEIGHT} p-6 border-b border-slate-200 flex flex-col justify-end shrink-0 bg-slate-50/50`}>
              <div className="flex items-center gap-2 text-slate-400 mb-2"><Package size={16} /><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{activeTab === 'inverter' ? 'Inverter Specs' : 'Module Specs'}</span></div>
              <h2 className="text-2xl font-bold text-slate-800">Parameters</h2>
            </div>
            <div className="flex-1 bg-white">
              <div className={`${ROW_HEIGHT} px-6 border-b border-slate-100 flex items-center text-sm font-semibold text-slate-700 bg-slate-50/50`}>Product Name</div>
              <div className={`${ROW_HEIGHT} px-6 border-b border-slate-100 flex items-center text-xs font-bold text-slate-700 bg-yellow-50`}> {activeTab === 'module' ? 'Price Ex-Factory (Rs/Wp)' : 'Price Ex-Factory (Rs/W)'}</div>
              
              {/* Labels for Stock & Availability added here to match rows */}
              <div className={`${ROW_HEIGHT} px-6 border-b border-slate-100 flex items-center gap-3 text-xs font-medium text-slate-500 bg-slate-50/20`}>
                  <Truck size={14} className="text-slate-400"/> Stock Location
              </div>
              <div className={`${ROW_HEIGHT} px-6 border-b border-slate-100 flex items-center gap-3 text-xs font-medium text-slate-500 bg-slate-50/20`}>
                  <Clock size={14} className="text-slate-400"/> Availability (Days)
              </div>

              {activeFields.map((row) => (
                <div key={row.id} className={`${ROW_HEIGHT} px-6 border-b border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500 hover:bg-slate-50 group`}>
                  <div className="flex items-center gap-3">
                     {row.type === 'select' && <LayoutTemplate size={14} className="text-purple-400"/>}
                     {row.type === 'file' && <FileText size={14} className="text-blue-400"/>}
                     {row.type === 'date' && <Calendar size={14} className="text-green-500"/>}
                     {row.type === 'number' && <DollarSign size={14} className="text-orange-400"/>}
                     {(row.type === 'text' || !row.type) && <Settings2 size={14} className="text-slate-400"/>}
                     <span className="text-slate-600">{row.label}</span>
                  </div>
                  {row.isCustom && <button onClick={() => handleDeleteCustomField(row.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity p-1"><Trash2 size={14}/></button>}
                </div>
              ))}
              <div className="p-4 border-b border-slate-100"><button onClick={handleAddCustomField} className="w-full py-2.5 border border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-md flex items-center justify-center gap-2"><Plus size={14}/> Add New Attribute</button></div>
              <div className={`${LOCATION_HEIGHT} px-6 border-b border-slate-100 flex flex-col justify-center gap-2 bg-slate-50/30`}><span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-700"><MapPin size={14} /> Price Location Wise</span><p className="text-[10px] text-slate-400">Specific pricing per city.</p></div>
            </div>
          </div>

          {/* MIDDLE: PRODUCT COLUMNS */}
          {filteredProducts.map((product, index) => (
            <div key={product.id} className={`w-[240px] flex-shrink-0 border-r border-slate-200 flex flex-col transition-all bg-white relative group ${editingId === product.id ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 z-10 shadow-lg' : 'hover:shadow-md hover:z-10'}`}>
                <div className={`${HEADER_HEIGHT} p-4 border-b border-slate-200 flex flex-col justify-between shrink-0 sticky top-0 bg-white z-20 group-hover:bg-slate-50 transition-colors`}>
                  <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                    <button onClick={() => moveProduct(index, "left")} disabled={index === 0} className="hover:text-blue-600 disabled:opacity-0 p-1 rounded hover:bg-slate-200"><ArrowLeft size={14} /></button>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{index + 1}</span>
                    <button onClick={() => moveProduct(index, "right")} disabled={index === filteredProducts.length - 1} className="hover:text-blue-600 disabled:opacity-0 p-1 rounded hover:bg-slate-200"><ArrowRight size={14} /></button>
                  </div>
                  <div className="text-center px-1 mb-2">
                    <div className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight" title={String(product.name)}>{String(product.name)}</div>
                    <div className="text-[10px] font-medium text-slate-400 mt-1 inline-block px-2 py-0.5 bg-slate-100 rounded-full">{String(product.technology || "Generic")}</div>
                  </div>
                  <div className="flex justify-center gap-2">
                    <button onClick={() => startEditing(product)} className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-full border transition-all ${editingId === product.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400'}`}><Edit2 size={12} /> {editingId === product.id ? 'Editing' : 'Edit'}</button>
                    <button onClick={() => handleDelete(product.id as number)} className="text-slate-300 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-full"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div> 
                  <div className={`${ROW_HEIGHT} px-4 border-b border-slate-100 flex items-center justify-center bg-slate-50/30`}><span className="text-xs font-medium text-slate-500 truncate select-none">{String(product.name || "")}</span></div>
                  <div className={`${ROW_HEIGHT} px-4 border-b border-slate-100 flex items-center justify-center bg-yellow-50/30`}><span className="text-sm font-bold text-slate-900">₹{String(product.price_ex_factory || "0")}</span></div>
                  
                  {/* Stock & Availability Data Rows */}
                  <div className={`${ROW_HEIGHT} px-3 border-b border-slate-100 flex items-center justify-center text-xs text-slate-600`}>
                      <span className="truncate">{product.stock_location || "-"}</span>
                  </div>
                  <div className={`${ROW_HEIGHT} px-3 border-b border-slate-100 flex items-center justify-center text-xs text-slate-600`}>
                      <span className="truncate">{product.availability_days ? `${product.availability_days} Days` : "-"}</span>
                  </div>

                  {activeFields.map((row) => (
                    <div key={row.id} className={`${ROW_HEIGHT} px-3 border-b border-slate-100 flex items-center justify-center text-xs text-slate-600 hover:bg-slate-50`}>
                      {row.type === "file" && product[row.id] ? (
                         <a href={String(product[row.id])} target="_blank" className="flex items-center gap-1.5 text-blue-600 hover:underline px-3 py-1 bg-blue-50 rounded-full border border-blue-100"><FileText size={12} /> View File</a>
                      ) : <span className="truncate text-center w-full" title={String(product[row.id])}>{String(product[row.id] || "-")}</span>}
                    </div>
                  ))}
                  <div className={`${LOCATION_HEIGHT} p-3 border-b border-slate-100 bg-slate-50/10 overflow-y-auto custom-scrollbar`}>
                    {product.locations && product.locations.length > 0 ? (
                        <div className="space-y-2">{product.locations.map((loc, i) => (<div key={i} className="flex justify-between items-center text-[10px] bg-white border border-slate-200 p-2 rounded shadow-sm"><div className="flex flex-col leading-tight"><span className="font-bold text-slate-700">{loc.city}</span><span className="text-[9px] text-slate-400">{loc.state}</span></div><span className="font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">₹{loc.price}</span></div>))}</div>
                    ) : <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-1"><MapPin size={24} className="opacity-20"/><span className="text-[10px] italic">No specific locations</span></div>}
                  </div>
                </div>
            </div>
          ))}

          {/* RIGHT: EDITOR COLUMN */}
          <div className="w-[320px] flex-shrink-0 bg-white border-l border-slate-200 shadow-[-4px_0_24px_rgba(0,0,0,0.04)] z-40 sticky right-0 h-full flex flex-col">
            <div className={`${HEADER_HEIGHT} p-6 border-b border-slate-200 flex flex-col justify-center items-center gap-3 bg-slate-50`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${editingId ? 'bg-indigo-600' : 'bg-orange-500'}`}>{editingId ? <Edit2 size={24}/> : <Plus size={28} />}</div>
              <div className="flex flex-col items-center"><span className="text-xs font-extrabold uppercase tracking-widest text-slate-700">{editingId ? 'Edit Mode' : `New ${activeTab}`}</span>{editingId ? <button onClick={cancelEditing} className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><X size={10}/> Cancel Selection</button> : <span className="text-[10px] text-slate-400 mt-1">Fill details to add to catalog</span>}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-0 bg-white">
              <div className={`${ROW_HEIGHT} p-3 flex items-center border-b border-slate-50`}><input className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-md" placeholder="Enter Product Name *" value={String(formData.name || "")} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className={`${ROW_HEIGHT} p-3 flex items-center border-b border-slate-50`}><div className="relative w-full"><DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full text-sm pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-md" placeholder="Base Price *" type="number" value={String(formData.price_ex_factory || "")} onChange={(e) => setFormData({ ...formData, price_ex_factory: Number(e.target.value) })} /></div></div>
              
              {/* NEW INPUTS FOR STOCK & AVAILABILITY */}
              <div className={`${ROW_HEIGHT} px-3 flex items-center border-b border-slate-50`}>
                  <div className="relative w-full">
                      <Truck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input className="w-full text-xs pl-9 p-2.5 bg-white border border-slate-200 rounded-md outline-none focus:border-indigo-500 placeholder:text-slate-300" placeholder="Stock Location (City/State)" value={String(formData.stock_location || "")} onChange={(e) => setFormData({ ...formData, stock_location: e.target.value })} />
                  </div>
              </div>
              <div className={`${ROW_HEIGHT} px-3 flex items-center border-b border-slate-50`}>
                  <div className="relative w-full">
                      <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input className="w-full text-xs pl-9 p-2.5 bg-white border border-slate-200 rounded-md outline-none focus:border-indigo-500 placeholder:text-slate-300" placeholder="Availability (Days)" type="number" value={String(formData.availability_days || "")} onChange={(e) => setFormData({ ...formData, availability_days: Number(e.target.value) })} />
                  </div>
              </div>

              {activeFields.map((row) => (
                <div key={row.id} className={`${ROW_HEIGHT} px-3 flex items-center border-b border-slate-50`}>
                  {row.type === "select" ? (
                    <select className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md" value={String(formData[row.id] || "")} onChange={(e) => setFormData({ ...formData, [row.id]: e.target.value })}><option value="">Select {row.label}</option>{(row.options || []).map((o) => <option key={o} value={o}>{o}</option>)}</select>
                  ) : row.type === "file" ? (
                    <label className={`w-full h-9 cursor-pointer flex items-center justify-between px-3 text-xs border border-dashed rounded-md ${formData[row.id] ? 'bg-green-50 border-green-300 text-green-700' : 'bg-slate-50 border-slate-300'}`}><span className="flex items-center gap-2">{formData[row.id] ? <CheckCircle2 size={14}/> : <UploadCloud size={14} />}<span className="truncate max-w-[150px]">{formData[row.id] ? "File Attached" : `Upload ${row.label}`}</span></span><input type="file" className="hidden" onChange={(e) => handleFileChange(row.id, e.target.files?.[0])} /></label>
                  ) : row.type === "date" ? (
                    <input type="date" className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md" value={String(formData[row.id] || "")} onChange={(e) => setFormData({ ...formData, [row.id]: e.target.value })} />
                  ) : (
                    <input className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md placeholder:text-slate-300" placeholder={row.label} value={String(formData[row.id] || "")} onChange={(e) => setFormData({ ...formData, [row.id]: e.target.value })} type={row.type === "number" ? "number" : "text"} />
                  )}
                </div>
              ))}

              <div className={`${LOCATION_HEIGHT} p-3 flex flex-col bg-slate-50 border-t border-slate-200`}>
                 <div className="flex gap-2 mb-2">
                    <div className="flex-1 space-y-2"><select className="w-full text-[10px] border border-slate-300 p-1.5 rounded bg-white" value={locInput.state} onChange={e => setLocInput({...locInput, state: e.target.value})}><option value="">State</option>{INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select><input className="w-full text-[10px] border border-slate-300 p-1.5 rounded bg-white" placeholder="City" value={locInput.city} onChange={e => setLocInput({...locInput, city: e.target.value})} /></div>
                    <div className="flex flex-col gap-2 w-16"><input className="w-full text-[10px] border border-slate-300 p-1.5 rounded bg-white text-center" placeholder="Price" type="number" value={locInput.price} onChange={e => setLocInput({...locInput, price: e.target.value})} /><button onClick={addLocation} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] rounded flex items-center justify-center"><Plus size={14}/></button></div>
                 </div>
                 <div className="flex-1 overflow-y-auto bg-white rounded border border-slate-200 p-1 space-y-1 shadow-inner custom-scrollbar">{locations.map((loc, i) => (<div key={i} className="flex justify-between items-center bg-slate-50 border border-slate-100 px-2 py-1.5 rounded text-[10px]"><span className="font-medium text-slate-700">{loc.city}</span><div className="flex items-center gap-2"><span className="font-bold text-green-600">₹{loc.price}</span><button onClick={() => removeLocation(i)} className="text-slate-400 hover:text-red-500"><X size={10}/></button></div></div>))}{locations.length === 0 && <div className="h-full flex items-center justify-center text-[9px] text-slate-400">No Custom Locations</div>}</div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white"><button onClick={handleSaveProduct} className={`w-full py-3.5 text-white rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-xs font-bold ${editingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800'}`}>{editingId ? <><Save size={16}/> UPDATE PRODUCT</> : <><Plus size={16}/> ADD TO CATALOG</>}</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}