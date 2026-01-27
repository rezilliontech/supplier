"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { 
  Sun, LogOut, Package, Plus, Trash2, X, Edit2, 
  ArrowLeft, ArrowRight, MapPin, Save, FileText 
} from 'lucide-react';

// ... (Keep INITIAL_DATA and STATIC_ROWS exactly as they were) ...
const INITIAL_DATA = [
  {
    id: 1,
    name: "Product 1",
    technology: "TOPCon",
    type: "n-type",
    power: 700,
    moq: "1 MWp",
    qty: 25,
    validity: "2026-06-30",
    availability: 7,
    datasheet: "PDF",
    panfile: ".pan",
    priceEx: 24.2,
    price_location_Kolkata: 28
  },
  {
    id: 2,
    name: "Product 2",
    technology: "TOPCon, half-cut",
    type: "n-type",
    power: 660,
    moq: "1 MWp",
    qty: 15,
    validity: "2026-06-30",
    availability: 10,
    datasheet: "PDF",
    panfile: ".pan",
    priceEx: 23.8
  }
];

const STATIC_ROWS = [
  { id: 'technology', label: 'Module Technology', type: 'text' },
  { id: 'type', label: 'Type', type: 'select', options: ['n-type', 'p-type'] },
  { id: 'power', label: 'Power (Wp)', type: 'number' },
  { id: 'moq', label: 'Minimum order quantity', type: 'text' },
  { id: 'qty', label: 'Qty (MW)', type: 'number' },
  { id: 'validity', label: 'Validity', type: 'date' },
  { id: 'availability', label: 'Availability within Days', type: 'number' },
  { id: 'datasheet', label: 'Datasheet', type: 'file' },
  { id: 'panfile', label: 'pan-file', type: 'file' },
  { id: 'priceEx', label: 'Price Ex-factory (₹/Wp)', type: 'number' },
];

export default function DashboardPage() {
  const router = useRouter(); 
  
  // --- STATE ---
  const [user, setUser] = useState(null); 
  const [localProducts, setLocalProducts] = useState(INITIAL_DATA);
  const [locations, setLocations] = useState(['Kolkata']); 
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newCol, setNewCol] = useState({});
  const [loading, setLoading] = useState(true);

  // --- 1. AUTH CHECK ON MOUNT (FIXED) ---
  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('currentUser');
    
    if (!storedUser) {
      router.push('/'); // Redirect to Login if not found
    } else {
      // Only set user if not already set to avoid redundant renders
      setUser(JSON.parse(storedUser));
      setLoading(false);
    }
    
    // Pass empty array to ensure this runs ONLY once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // --- 2. LOGOUT FUNCTION ---
  const handleLogout = () => {
    localStorage.removeItem('currentUser'); 
    router.push('/'); 
  };

  // --- HANDLERS ---
  const moveProduct = (index, direction) => {
    const newItems = [...localProducts];
    if (direction === 'left' && index > 0) {
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    } else if (direction === 'right' && index < newItems.length - 1) {
      [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    }
    setLocalProducts(newItems);
  };

  const handleAddLocation = () => {
    const city = prompt("Enter City Name (e.g., Mumbai, Delhi):");
    if (city && !locations.includes(city)) setLocations([...locations, city]);
  };

  const startEditing = (p) => { setEditingId(p.id); setEditForm({...p}); };

  const saveEditing = () => {
    setLocalProducts(localProducts.map(p => p.id === editForm.id ? editForm : p));
    setEditingId(null);
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddColumn = () => {
    if (!newCol.name) return alert("Please enter a product name");
    const newProduct = {
      ...newCol,
      id: Date.now(),
      supplier: user?.companyName || "My Company",
    };
    setLocalProducts([...localProducts, newProduct]);
    setNewCol({});
  };

  const handleDelete = (id) => {
    if(window.confirm("Delete this product?")) {
        setLocalProducts(localProducts.filter(p => p.id !== id));
    }
  };

  // Prevent flashing before user loads
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-400">Loading Dashboard...</div>;

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden">
      
      {/* --- HEADER --- */}
      <header className="bg-slate-900 text-white p-3 px-6 flex justify-between items-center shadow-lg z-50 shrink-0 h-16 relative">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-orange-500 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.4)]">
            <Sun size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-none">SolarChain Ops</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">SUPPLIER DASHBOARD • {user?.companyName || 'Guest'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">Live Sync</span>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all" title="Sign Out">
                <LogOut size={18}/>
            </button>
        </div>
      </header>

      {/* --- MAIN WORKSPACE --- */}
      <div className="flex-1 overflow-auto bg-slate-100/50 relative">
        <div className="flex min-w-max">
            
            {/* === 1. FIXED LEFT COLUMN (LABELS) === */}
            <div className="w-[280px] flex-shrink-0 bg-white border-r border-slate-200 shadow-[4px_0_20px_rgba(0,0,0,0.02)] z-40 sticky left-0 flex flex-col">
            
                <div className="h-[120px] p-5 border-b border-slate-200 bg-slate-50 flex flex-col justify-between shrink-0 sticky top-0 z-50 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Package size={14}/>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Inventory</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Parameters</h2>
                        <p className="text-xs text-slate-400 mt-1">Define specs & pricing</p>
                    </div>
                </div>

                <div className="bg-white">
                    <div className="h-12 px-5 border-b border-slate-100 flex items-center text-sm font-semibold text-slate-700 bg-white">Product Name</div>
                    
                    {STATIC_ROWS.map((row, i) => (
                        <div key={row.id} className={`h-12 px-5 border-b border-slate-100 flex items-center text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? 'bg-slate-[5px]' : ''}`}>
                        {row.label}
                        </div>
                    ))}

                    <div className="px-5 py-3 bg-orange-50/50 border-b border-orange-100 flex flex-col gap-1 mt-4">
                        <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1"><MapPin size={10}/> Location Pricing</span>
                    </div>

                    {locations.map(city => (
                        <div key={city} className="h-12 px-5 border-b border-orange-100 flex items-center justify-between text-xs font-medium text-slate-600 bg-orange-50/10 group">
                        <span>Price at {city}</span>
                        <button className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400"><X size={10}/></button>
                        </div>
                    ))}

                    <div className="p-4">
                        <button onClick={handleAddLocation} className="w-full py-2 border border-dashed border-orange-300 text-orange-600 text-xs font-bold rounded hover:bg-orange-50 flex items-center justify-center gap-2 transition-colors">
                            <Plus size={12}/> Add City
                        </button>
                    </div>
                </div>
            </div>

            {/* === 2. DATA COLUMNS === */}
            {localProducts.map((product, index) => {
                const isEditing = editingId === product.id;
                const data = isEditing ? editForm : product;

                return (
                    <div key={product.id} className={`w-[220px] flex-shrink-0 border-r border-slate-200 flex flex-col transition-all duration-300 ${isEditing ? 'bg-white shadow-xl ring-2 ring-blue-500 z-30 scale-[1.005]' : 'bg-white hover:bg-slate-50'}`}>
                    
                    <div className={`h-[120px] p-3 border-b border-slate-200 flex flex-col justify-between shrink-0 sticky top-0 z-30 shadow-sm ${isEditing ? 'bg-blue-50' : 'bg-white'}`}>
                        <div className="flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
                            <button onClick={() => moveProduct(index, 'left')} disabled={index === 0} className="hover:text-blue-600 disabled:opacity-0 p-1 hover:bg-blue-50 rounded"><ArrowLeft size={12}/></button>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Product {index + 1}</span>
                            <button onClick={() => moveProduct(index, 'right')} disabled={index === localProducts.length - 1} className="hover:text-blue-600 disabled:opacity-0 p-1 hover:bg-blue-50 rounded"><ArrowRight size={12}/></button>
                        </div>
                        
                        <div className="text-center px-1">
                            <div className="text-sm font-bold text-slate-800 truncate" title={data.name}>{data.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{data.technology || 'N/A'}</div>
                        </div>

                        <div className="flex justify-center gap-2 pt-1">
                            {isEditing ? (
                                <>
                                    <button onClick={saveEditing} className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded shadow-sm hover:bg-blue-700 flex items-center gap-1"><Save size={10}/> Save</button>
                                    <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"><X size={14}/></button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => startEditing(product)} className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-500 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded border border-slate-200 transition-colors"><Edit2 size={10}/> Edit</button>
                                    <button onClick={() => handleDelete(product.id)} className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-500 bg-slate-100 hover:bg-blue-50 hover:text-red-600 rounded border border-slate-200 transition-colors" title="Delete"><Trash2 size={12}/>Delete</button>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="h-12 p-2 border-b border-slate-100 flex items-center justify-center bg-slate-50/20">
                            {isEditing ? (
                                <input className="w-full text-center text-xs font-bold bg-white border border-blue-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-100 outline-none" value={data.name} onChange={e => handleEditChange('name', e.target.value)} />
                            ) : (
                                <span className="text-xs font-bold text-slate-700">{data.name}</span>
                            )}
                        </div>

                        {STATIC_ROWS.map(row => (
                            <div key={row.id} className="h-12 px-2 border-b border-slate-100 flex items-center justify-center text-xs text-slate-600 text-center relative group-cell">
                            {isEditing ? (
                                row.type === 'select' ? (
                                    <select className="w-full text-center text-xs p-1 bg-white border border-blue-200 rounded focus:ring-2 focus:ring-blue-100 outline-none" value={data[row.id] || ''} onChange={e => handleEditChange(row.id, e.target.value)}>
                                        {row.options.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : (
                                    <input 
                                        type={row.type === 'number' ? 'number' : 'text'}
                                        className="w-full text-center text-xs p-1 bg-white border-b border-blue-200 focus:border-blue-500 outline-none"
                                        value={data[row.id] || ''}
                                        onChange={e => handleEditChange(row.id, e.target.value)}
                                    />
                                )
                            ) : (
                                row.type === 'file' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-medium cursor-pointer hover:bg-blue-100"><FileText size={10}/> {row.id === 'datasheet' ? 'PDF' : '.PAN'}</span>
                                ) : (
                                    <span className="truncate w-full px-1">{data[row.id] || '-'}</span>
                                )
                            )}
                            </div>
                        ))}

                        <div className="h-[65px] bg-orange-50/20 border-b border-orange-100/50 flex items-center justify-center">
                            <span className="text-[9px] text-orange-300 font-mono">---</span>
                        </div>

                        {locations.map(city => {
                            const fieldKey = `price_location_${city}`;
                            return (
                                <div key={city} className="h-12 px-2 border-b border-slate-100 flex items-center justify-center text-xs text-slate-600 bg-orange-50/5">
                                {isEditing ? (
                                    <div className="relative w-full">
                                        <span className="absolute left-1 top-1.5 text-slate-400 text-[10px]">₹</span>
                                        <input 
                                            type="number" 
                                            className="w-full text-center text-xs p-1 bg-white border border-orange-200 rounded focus:ring-2 focus:ring-orange-100 outline-none pl-3"
                                            value={data[fieldKey] || ''}
                                            onChange={e => handleEditChange(fieldKey, e.target.value)}
                                        />
                                    </div>
                                ) : (
                                    <span className="font-mono">{data[fieldKey] ? `₹ ${data[fieldKey]}` : '-'}</span>
                                )}
                                </div>
                            );
                        })}
                    </div>
                    </div>
                );
            })}

            {/* --- ADD NEW PRODUCT COLUMN --- */}
            <div className="w-[240px] flex-shrink-0 border-r border-dashed border-slate-300 bg-slate-50/50 flex flex-col hover:bg-slate-50 transition-colors">
                <div className="h-[120px] p-4 border-b border-slate-200 flex flex-col justify-center items-center gap-2 text-slate-400 sticky top-0 z-30 bg-slate-50">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-1"><Plus size={20}/></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">New Product</span>
                </div>

                <div className="p-3 space-y-2">
                   <div className="h-12 flex items-center">
                        <input className="w-full text-center text-xs p-2 bg-white border border-slate-300 rounded shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Enter Name..." value={newCol.name || ''} onChange={e => setNewCol({...newCol, name: e.target.value})} />
                   </div>
                   {STATIC_ROWS.map(row => (
                      <div key={row.id} className="h-12 flex items-center">
                         {row.type === 'select' ? (
                             <select className="w-full text-xs p-2 bg-white border border-slate-200 rounded focus:border-blue-400 outline-none text-slate-500" value={newCol[row.id] || ''} onChange={e => setNewCol({...newCol, [row.id]: e.target.value})}>
                                 <option value="">{row.label}</option>
                                 {row.options.map(o => <option key={o} value={o}>{o}</option>)}
                             </select>
                         ) : (
                             <input className="w-full text-center text-xs p-2 bg-white border border-slate-200 rounded focus:border-blue-400 outline-none" placeholder={row.label} value={newCol[row.id] || ''} onChange={e => setNewCol({...newCol, [row.id]: e.target.value})} type={row.type === 'number' ? 'number' : 'text'}/>
                         )}
                      </div>
                   ))}
                   <button onClick={handleAddColumn} className="mt-6 w-full py-3 bg-slate-800 text-white rounded-lg shadow-lg hover:bg-slate-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 text-xs font-bold tracking-wide transform active:scale-95"><Plus size={14}/> ADD COLUMN</button>
                </div>
            </div>

            <div className="w-20 shrink-0"></div>
        </div>
      </div>
    </div>
  );
}