"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sun, LogOut, Package, Plus, Trash2, X, Edit2, ArrowLeft, ArrowRight,
  MapPin, Save, FileText, UploadCloud, Layers, Zap, Calendar, FileCode, 
  LayoutTemplate, DollarSign, Settings2
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
  validity?: string; // Date string
  datasheet?: string;
  panfile?: string;
  ondfile?: string;
  locations?: LocationEntry[]; 
  [key: string]: unknown; // Allows custom fields
}

interface RowDef {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "file" | "select";
  options?: string[];
  category: "module" | "inverter";
  isCustom?: boolean; // Flag for custom added fields
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

// REMOVED 'availability'. 'validity' is explicitly type: "date".
const MODULE_FIELDS: RowDef[] = [
  { id: "type", label: "Module Type", type: "select", options: ["p-Type", "n-Type"], category: "module" },
  { id: "technology", label: "Technology", type: "select", options: ["Monocrystalline", "Polycrystalline", "Bifacial", "Thin Film", "TopCon", "HJT"], category: "module" },
  { id: "power_kw", label: "Power (Wp)", type: "number", category: "module" },
  { id: "min_order", label: "Min Order (MWp/KWp)", type: "text", category: "module" },
  { id: "qty_mw", label: "Qty (MW)", type: "number", category: "module" },
  { id: "validity", label: "Price Validity", type: "date", category: "module" }, // Date Picker
  { id: "datasheet", label: "Datasheet (PDF)", type: "file", category: "module" },
  { id: "panfile", label: "PAN File (.pan)", type: "file", category: "module" },
];

const INVERTER_FIELDS: RowDef[] = [
  { id: "technology", label: "Technology", type: "text", category: "inverter" },
  { id: "power_kw", label: "Power (kW)", type: "number", category: "inverter" },
  { id: "min_order", label: "Min Order Qty", type: "text", category: "inverter" },
  { id: "qty_mw", label: "Qty (MW)", type: "number", category: "inverter" },
  { id: "validity", label: "Price Validity", type: "date", category: "inverter" }, // Date Picker
  { id: "price_ex_10mw", label: "Price Ex-Factory (10 MWp)", type: "number", category: "inverter" },
  { id: "datasheet", label: "Datasheet (PDF)", type: "file", category: "inverter" },
  { id: "ondfile", label: "OND File (.ond)", type: "file", category: "inverter" },
];

export default function DashboardPage() {
  const router = useRouter();

  // --- STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"module" | "inverter">("module");
  const [products, setProducts] = useState<ExtendedProductData[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<ExtendedProductData>>({});
  const [locInput, setLocInput] = useState<{state: string, city: string, price: string}>({ state: "", city: "", price: "" });
  const [locations, setLocations] = useState<LocationEntry[]>([]);
  
  // Custom Fields State
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
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // --- LOAD DATA ---
  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem("currentUser");
      if (!storedUser) { router.push("/"); return; }
      setUser(JSON.parse(storedUser));

      try {
        const res = await fetch(`/api/supplierdashboard?supplierId=${JSON.parse(storedUser).id}`);
        const data = await res.json();
        const cleanProducts = (data.products || []).map((p: ExtendedProductData) => ({
            ...p,
            category: p.category || "module",
            locations: p.locations || [] 
        }));
        setProducts(cleanProducts);
        
        // Detect existing custom fields from data
        const standardIds = new Set([...MODULE_FIELDS, ...INVERTER_FIELDS].map(f => f.id));
        const detectedFields: RowDef[] = [];
        const seenKeys = new Set<string>();

        cleanProducts.forEach((p: ExtendedProductData) => {
            Object.keys(p).forEach(key => {
                if (!standardIds.has(key) && !['id', 'name', 'supplier', 'supplier_id', 'category', 'created_at', 'updated_at', 'locations', 'price_ex_factory', 'attributes'].includes(key)) {
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        detectedFields.push({
                            id: key,
                            label: label,
                            type: 'text',
                            category: p.category || 'module',
                            isCustom: true
                        });
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

  // --- CUSTOM FIELD HANDLERS ---

  const handleAddCustomField = () => {
    const label = prompt("Enter Name for new field (e.g. Frame Color, Cable Length):");
    if (!label) return;
    const id = label.toLowerCase().replace(/\s+/g, '_');
    
    // Prevent duplicate keys
    if (customFields.some(f => f.id === id) || [...MODULE_FIELDS, ...INVERTER_FIELDS].some(f => f.id === id)) {
        alert("Field already exists!");
        return;
    }

    setCustomFields([...customFields, {
        id,
        label,
        type: 'text',
        category: activeTab,
        isCustom: true
    }]);
  };

  const handleDeleteCustomField = (fieldId: string) => {
      if(window.confirm("Remove this custom field from view?")) {
          setCustomFields(customFields.filter(f => f.id !== fieldId));
      }
  };

  // --- PRODUCT FORM HANDLERS ---

  const startEditing = (product: ExtendedProductData) => {
    setEditingId(product.id as number);
    setFormData({ ...product }); // Copy data
    setLocations(product.locations || []); // Copy locations
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormData({});
    setLocations([]);
    setLocInput({ state: "", city: "", price: "" });
  };

  const handleFileChange = async (field: string, file: File | undefined) => {
    if (!file) return;
    setFormData(prev => ({ ...prev, [field]: "Uploading..." }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const { url } = await res.json();
      setFormData(prev => ({ ...prev, [field]: url }));
    } catch {
      alert("Upload failed.");
      setFormData(prev => ({ ...prev, [field]: "" }));
    }
  };

  const addLocation = () => {
    if (!locInput.state || !locInput.city || !locInput.price) return alert("Fill all location fields");
    setLocations([...locations, { 
      state: locInput.state, city: locInput.city, price: Number(locInput.price) 
    }]);
    setLocInput({ state: "", city: "", price: "" });
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async () => {
    if (!formData.name) return alert("Product Name is required");
    
    const payload = {
      ...formData,
      supplier: user?.companyName || "My Company",
      category: activeTab,
      locations: locations 
    };

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

  const moveProduct = (index: number, direction: "left" | "right") => {
    const newItems = [...products];
    if (direction === "left" && index > 0) {
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    } else if (direction === "right" && index < newItems.length - 1) {
      [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    }
    setProducts(newItems);
  };

  // --- RENDER HELPERS ---
  const filteredProducts = products.filter(p => p.category === activeTab);
  
  // MERGE Standard Fields + Custom Fields for current tab
  const activeFields = [
      ...(activeTab === 'module' ? MODULE_FIELDS : INVERTER_FIELDS),
      ...customFields.filter(f => f.category === activeTab)
  ];

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-400">Loading...</div>;

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden">
      
      {/* HEADER */}
      <header className="bg-slate-900 text-white p-3 px-6 flex justify-between items-center shadow-lg z-50 shrink-0 h-16 relative">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-orange-500 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.4)]">
            <Sun size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base">Rezillion Supplier</h1>
            <p className="text-[10px] text-slate-400">DASHBOARD • {user?.companyName || "Guest"}</p>
          </div>
          <div className="ml-10 flex bg-slate-800 p-1 rounded-lg border border-slate-700">
             <button onClick={() => { setActiveTab("module"); cancelEditing(); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'module' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                <Layers size={14} /> Modules
             </button>
             <button onClick={() => { setActiveTab("inverter"); cancelEditing(); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'inverter' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <Zap size={14} /> Inverters
             </button>
          </div>
        </div>
        <button onClick={handleLogout} className="text-slate-400 hover:text-white"><LogOut size={18} /></button>
      </header>

      {/* WORKSPACE */}
      <div className="flex-1 overflow-auto bg-slate-100/50 relative">
        <div className="flex min-w-max h-full">
          
          {/* --- LEFT COLUMN (LABELS) --- */}
          <div className="w-[260px] flex-shrink-0 bg-white border-r border-slate-200 shadow-sm z-40 sticky left-0 flex flex-col h-full">
            <div className={`h-[120px] p-5 border-b border-slate-200 flex flex-col justify-center shrink-0 ${activeTab === 'inverter' ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Package size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{activeTab === 'inverter' ? 'Inverter Specs' : 'Module Specs'}</span>
              </div>
              <h2 className={`text-xl font-bold ${activeTab === 'inverter' ? 'text-blue-900' : 'text-orange-900'}`}>Parameters</h2>
            </div>

            <div className="bg-white flex-1 overflow-y-auto">
              <div className="h-12 px-5 border-b border-slate-100 flex items-center text-sm font-semibold text-slate-700 bg-slate-50">Product Name</div>
              
              <div className="h-12 px-5 border-b border-slate-100 flex items-center text-xs font-bold text-slate-700 bg-yellow-50/50">
                 {activeTab === 'module' ? 'Price Ex-Factory (Rs/Wp)' : 'Price Ex-Factory (Rs/W)'}
              </div>

              {activeFields.map((row) => (
                <div key={row.id} className="h-12 px-5 border-b border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500 hover:bg-slate-50 group">
                  <div className="flex items-center gap-2">
                     {row.type === 'select' && <LayoutTemplate size={12} className="text-purple-400"/>}
                     {row.type === 'file' && <FileText size={12} className="text-blue-400"/>}
                     {row.type === 'date' && <Calendar size={12} className="text-green-500"/>}
                     {row.type === 'number' && <DollarSign size={12} className="text-orange-400"/>}
                     <span>{row.label}</span>
                  </div>
                  {/* Delete Button for Custom Fields */}
                  {row.isCustom && (
                      <button onClick={() => handleDeleteCustomField(row.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity">
                          <Trash2 size={12}/>
                      </button>
                  )}
                </div>
              ))}

              {/* Add Custom Field Button */}
              <div className="p-3 border-b border-slate-100">
                  <button onClick={handleAddCustomField} className="w-full py-2 border border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-400 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors">
                      <Plus size={12}/> Add Attribute
                  </button>
              </div>

              <div className="h-40 px-5 border-b border-slate-100 flex flex-col justify-center gap-1 bg-slate-50/30">
                <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${activeTab === 'inverter' ? 'text-blue-700' : 'text-orange-700'}`}>
                  <MapPin size={10} /> Price Location Wise
                </span>
                <p className="text-[9px] text-slate-400">Inventory and specific pricing by city.</p>
              </div>
            </div>
          </div>

          {/* --- MIDDLE: PRODUCT COLUMNS --- */}
          {filteredProducts.map((product, index) => (
            <div key={product.id} className={`w-[220px] flex-shrink-0 border-r border-slate-200 flex flex-col transition-colors ${editingId === product.id ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 z-10' : 'bg-white hover:bg-slate-50'}`}>
                
                {/* Product Header */}
                <div className="h-[120px] p-3 border-b border-slate-200 flex flex-col justify-between shrink-0">
                  <div className="flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
                    <button onClick={() => moveProduct(index, "left")} disabled={index === 0} className="hover:text-blue-600 disabled:opacity-0 p-1"><ArrowLeft size={12} /></button>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">#{index + 1}</span>
                    <button onClick={() => moveProduct(index, "right")} disabled={index === filteredProducts.length - 1} className="hover:text-blue-600 disabled:opacity-0 p-1"><ArrowRight size={12} /></button>
                  </div>
                  <div className="text-center px-1">
                    <div className="text-sm font-bold text-slate-800 truncate" title={String(product.name)}>{String(product.name)}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{String(product.technology || "N/A")}</div>
                  </div>
                  <div className="flex justify-center gap-2 pt-1">
                    <button onClick={() => startEditing(product)} className={`flex items-center gap-1 px-2 py-1 text-[9px] font-bold rounded border ${editingId === product.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:text-blue-600'}`}>
                        <Edit2 size={10} /> {editingId === product.id ? 'Editing' : 'Edit'}
                    </button>
                    <button onClick={() => handleDelete(product.id as number)} className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>

                {/* Product Rows */}
                <div className="flex-1 overflow-y-auto">
                  <div className="h-12 p-2 border-b border-slate-100 flex items-center justify-center bg-slate-50/20">
                    <span className="text-xs font-bold text-slate-700 truncate">{String(product.name || "")}</span>
                  </div>
                  <div className="h-12 p-2 border-b border-slate-100 flex items-center justify-center bg-yellow-50/10">
                    <span className="text-xs font-bold text-slate-800">₹{String(product.price_ex_factory || "0")}</span>
                  </div>

                  {activeFields.map((row) => (
                    <div key={row.id} className="h-12 px-2 border-b border-slate-100 flex items-center justify-center text-xs text-slate-600">
                      {row.type === "file" && product[row.id] ? (
                         <a href={String(product[row.id])} target="_blank" className="flex items-center gap-1 text-blue-600 hover:underline px-2 py-1 bg-blue-50 rounded border border-blue-100">
                            <FileText size={10} /> View
                         </a>
                      ) : (
                         <span className="truncate">{String(product[row.id] || "-")}</span>
                      )}
                    </div>
                  ))}

                  {/* Locations List */}
                  <div className="h-40 px-2 py-2 border-b border-slate-100 bg-slate-50/10 overflow-y-auto custom-scrollbar">
                    {product.locations && product.locations.length > 0 ? (
                        <div className="space-y-1">
                            {product.locations.map((loc, i) => (
                                <div key={i} className="flex justify-between items-center text-[10px] bg-white border border-slate-200 p-1.5 rounded shadow-sm">
                                    <div className="flex flex-col leading-tight">
                                        <span className="font-bold text-slate-700">{loc.city}</span>
                                        <span className="text-[8px] text-slate-400">{loc.state}</span>
                                    </div>
                                    <span className="font-bold text-green-600">₹{loc.price}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-[10px] text-slate-400 italic">No Locations</div>
                    )}
                  </div>
                </div>
            </div>
          ))}

          {/* --- RIGHT: ADD / EDIT PRODUCT COLUMN --- */}
          <div className={`w-[280px] flex-shrink-0 border-r border-dashed bg-slate-50 flex flex-col transition-colors h-full ${editingId ? 'border-blue-300 bg-blue-50/50' : 'border-slate-300 hover:bg-white'}`}>
            <div className={`h-[120px] p-4 border-b border-slate-200 flex flex-col justify-center items-center gap-2 sticky top-0 z-30 ${editingId ? 'bg-blue-100/50' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 text-white shadow-lg ${editingId ? 'bg-green-500' : (activeTab === 'inverter' ? 'bg-blue-600' : 'bg-orange-500')}`}>
                {editingId ? <Edit2 size={18}/> : <Plus size={20} />}
              </div>
              <div className="flex flex-col items-center">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${editingId ? 'text-blue-700' : 'text-slate-400'}`}>
                      {editingId ? 'Editing Product' : `Add New ${activeTab}`}
                  </span>
                  {editingId && <button onClick={cancelEditing} className="text-[9px] text-red-500 underline mt-1">Cancel Edit</button>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <div className="h-12 flex items-center mb-0">
                <input className="w-full text-center text-xs p-2 bg-white border border-slate-300 rounded shadow-sm outline-none focus:border-blue-500" placeholder="Product Name" value={String(formData.name || "")} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="h-12 flex items-center mb-0">
                <input className="w-full text-center text-xs p-2 bg-white border border-slate-300 rounded shadow-sm outline-none focus:border-blue-500" placeholder="Base Price" type="number" value={String(formData.price_ex_factory || "")} onChange={(e) => setFormData({ ...formData, price_ex_factory: Number(e.target.value) })} />
              </div>
              
              {activeFields.map((row) => (
                <div key={row.id} className="h-12 flex items-center">
                  {row.type === "select" ? (
                    <select className="w-full text-xs p-2 bg-white border border-slate-200 rounded outline-none text-slate-500" value={String(formData[row.id] || "")} onChange={(e) => setFormData({ ...formData, [row.id]: e.target.value })}>
                      <option value="">{row.label}</option>
                      {(row.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : row.type === "file" ? (
                    <label className="w-full h-8 cursor-pointer flex items-center justify-center gap-2 text-xs bg-white border border-dashed border-slate-300 rounded hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all text-slate-400">
                      <UploadCloud size={14} /> 
                      <span className="truncate max-w-[100px]">{formData[row.id] && String(formData[row.id]).includes('http') ? "Updated" : (formData[row.id] ? "File Exists" : "Upload")}</span>
                      <input type="file" className="hidden" onChange={(e) => handleFileChange(row.id, e.target.files?.[0])} />
                    </label>
                  ) : row.type === "date" ? (
                    <input type="date" className="w-full text-center text-xs p-2 bg-white border border-slate-200 rounded outline-none focus:border-blue-400" value={String(formData[row.id] || "")} onChange={(e) => setFormData({ ...formData, [row.id]: e.target.value })} />
                  ) : (
                    <input className="w-full text-center text-xs p-2 bg-white border border-slate-200 rounded outline-none focus:border-blue-400" placeholder={row.label} value={String(formData[row.id] || "")} onChange={(e) => setFormData({ ...formData, [row.id]: e.target.value })} type={row.type === "number" ? "number" : "text"} />
                  )}
                </div>
              ))}

              {/* Location Manager */}
              <div className="h-40 p-2 bg-white border border-slate-200 rounded mt-0 flex flex-col gap-2 shadow-inner">
                 <div className="flex gap-1">
                    <select className="flex-1 text-[9px] border p-1 rounded bg-slate-50" value={locInput.state} onChange={e => setLocInput({...locInput, state: e.target.value})}>
                        <option value="">State</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <div className="flex gap-1">
                    <input className="flex-1 text-[9px] border p-1 rounded bg-slate-50" placeholder="City" value={locInput.city} onChange={e => setLocInput({...locInput, city: e.target.value})} />
                    <input className="w-12 text-[9px] border p-1 rounded bg-slate-50" placeholder="₹" type="number" value={locInput.price} onChange={e => setLocInput({...locInput, price: e.target.value})} />
                    <button onClick={addLocation} className="bg-slate-800 text-white text-[9px] px-2 rounded">+</button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto bg-slate-50 rounded border border-slate-100 p-1 space-y-1">
                    {locations.map((loc, i) => (
                        <div key={i} className="flex justify-between items-center bg-white border border-slate-200 px-1.5 py-1 rounded text-[9px]">
                            <span>{loc.city}</span>
                            <div className="flex gap-2">
                                <span className="font-bold">₹{loc.price}</span>
                                <button onClick={() => removeLocation(i)} className="text-red-500 font-bold">×</button>
                            </div>
                        </div>
                    ))}
                    {locations.length === 0 && <p className="text-[8px] text-center text-slate-400 mt-2">Add locations here</p>}
                 </div>
              </div>

              <div className="p-3">
                <button onClick={handleSaveProduct} className={`w-full py-3 text-white rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-xs font-bold transform active:scale-95 ${editingId ? 'bg-green-600 hover:bg-green-700' : (activeTab === 'inverter' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-700')}`}>
                    {editingId ? <><Save size={14}/> UPDATE PRODUCT</> : <><Plus size={14}/> SAVE PRODUCT</>}
                </button>
              </div>
            </div>
          </div>
          
          <div className="w-20 shrink-0 bg-slate-50"></div>
        </div>
      </div>
    </div>
  );
}