"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { 
  Sun, LogOut, Package, Plus, Trash2, X, Edit2, 
  ArrowLeft, ArrowRight, MapPin, Save, FileText, UploadCloud
} from 'lucide-react';
import { ProductData, RowDefinition, DashboardResponse } from '@/types'; // Import types

// Helper type for the user object
interface User {
  id: string | number;
  companyName: string;
}

export default function DashboardPage() {
  const router = useRouter(); 
  
  // --- STATE WITH TYPES ---
  const [user, setUser] = useState<User | null>(null); 
  const [localProducts, setLocalProducts] = useState<ProductData[]>([]);
  const [rows, setRows] = useState<RowDefinition[]>([]); 
  const [locations, setLocations] = useState<string[]>([]); 
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProductData>>({});
  const [newCol, setNewCol] = useState<Partial<ProductData>>({});
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- API HELPER (Fixed 'any' types) ---
 const apiCall = async (action: string, data: Record<string, unknown>) => {
  try {
    // 1. Get the current user from LocalStorage
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      alert("You are not logged in.");
      return null;
    }
    
    const parsedUser = JSON.parse(storedUser);
    
    // 2. Add supplierId to the payload
    const requestData = { 
        ...data, 
        supplierId: parsedUser.id 
    };

    // 3. Send to Backend
    const res = await fetch('/api/supplierdashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data: requestData }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "API Action Failed");
    
    return result;
  } catch (err: unknown) {
    console.error(err);
    // Safe error handling for TypeScript
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    alert(`Error: ${message}`);
    return null;
  }
};

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    const init = async () => {
      // 1. Auth Check & Get User ID
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        router.push('/'); 
        return;
      }
      
      const parsedUser: User = JSON.parse(storedUser);
      setUser(parsedUser);

      // 2. Fetch Data
      try {
        const res = await fetch(`/api/supplierdashboard?supplierId=${parsedUser.id}`);
        
        if (!res.ok) throw new Error("Failed to fetch dashboard");
        
        const data: DashboardResponse = await res.json();
        setLocalProducts(data.products || []);
        setRows(data.rows || []);
        setLocations(data.locations || []);
      } catch (e) {
        console.error("Failed to load dashboard data", e);
        setErrorMsg("Could not load dashboard data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser'); 
    router.push('/'); 
  };

  // --- HANDLERS ---
  
  const moveProduct = (index: number, direction: 'left' | 'right') => {
    const newItems = [...localProducts];
    if (direction === 'left' && index > 0) {
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    } else if (direction === 'right' && index < newItems.length - 1) {
      [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    }
    setLocalProducts(newItems);
  };

  const handleAddLocation = async () => {
    const city = prompt("Enter City Name (e.g., Mumbai, Delhi):");
    if (city && !locations.includes(city)) {
        const updatedLocs = [...locations, city];
        
        // Optimistic UI Update
        setLocations(updatedLocs);
        
        // API Sync
        const success = await apiCall('update_settings', { key: 'locations', value: updatedLocs });
        if (!success) setLocations(locations); // Revert on failure
    }
  };

  const handleAddRow = async () => {
    const label = prompt("Enter Parameter Name (e.g., Warranty, Frame Color):");
    if (!label) return;
    
    const id = label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    const newRow: RowDefinition = { id, label, type: 'text', isFixed: false };
    
    const updatedRows = [...rows, newRow];
    setRows(updatedRows);
    
    const success = await apiCall('update_settings', { key: 'rows', value: updatedRows });
    if (!success) setRows(rows); // Revert
  };

  const handleDeleteRow = async (rowId: string) => {
    if (window.confirm("Delete this parameter row? Data in this row will be hidden.")) {
      const oldRows = [...rows];
      const updatedRows = rows.filter(r => r.id !== rowId);
      setRows(updatedRows);
      
      const success = await apiCall('update_settings', { key: 'rows', value: updatedRows });
      if (!success) setRows(oldRows); // Revert
    }
  };

  const startEditing = (p: ProductData) => { 
    setEditingId(p.id); 
    setEditForm({...p}); 
  };

  const saveEditing = async () => {
    if (!editForm.id) return;

    // Optimistic Update
    const oldProducts = [...localProducts];
    setLocalProducts(localProducts.map(p => p.id === editForm.id ? (editForm as ProductData) : p));
    setEditingId(null);
    
    // API Call (Cast editForm to Record<string, unknown> for strict typing)
    const success = await apiCall('update_product', editForm as Record<string, unknown>);
    if (!success) setLocalProducts(oldProducts); // Revert
  };

  const handleEditChange = (field: string, value: string | number) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

// ... inside DashboardPage component

  const handleFileChange = async (field: string, file: File | undefined, isNewColumn = false) => {
    if (!file) return;

    // 1. Set temporary loading state
    const originalLabel = isNewColumn ? newCol[field] : editForm[field];
    const loadingText = 'Uploading...';
    
    if (isNewColumn) {
      setNewCol(prev => ({ ...prev, [field]: loadingText }));
    } else {
      setEditForm(prev => ({ ...prev, [field]: loadingText }));
    }

    try {
      // ---------------------------------------------------------
      // STEP 1: Get the Presigned URL from your Backend
      // ---------------------------------------------------------
      const presignRes = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // <--- IMPORTANT: Send JSON, not FormData
        },
        body: JSON.stringify({ 
          fileName: file.name, 
          fileType: file.type 
        }),
      });

      if (!presignRes.ok) throw new Error('Failed to get upload URL');
      const { url } = await presignRes.json(); // This is the long URL with tokens

      // ---------------------------------------------------------
      // STEP 2: Upload the actual file directly to S3
      // ---------------------------------------------------------
      const uploadRes = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type, // <--- IMPORTANT: Must match what you sent in Step 1
        },
        body: file, // <--- Send the raw File object here
      });

      if (!uploadRes.ok) throw new Error('S3 direct upload failed');

      
      const cleanUrl = url.split('?')[0]; 

      if (isNewColumn) {
        setNewCol(prev => ({ ...prev, [field]: cleanUrl }));
      } else {
        setEditForm(prev => ({ ...prev, [field]: cleanUrl }));
      }

    } catch (error) {
      console.error(error);
      alert('Upload failed.');
      // Revert state on error
      if (isNewColumn) {
        setNewCol(prev => ({ ...prev, [field]: originalLabel }));
      } else {
        setEditForm(prev => ({ ...prev, [field]: originalLabel }));
      }
    }
  };
  const handleAddColumn = async () => {
    if (!newCol.name) return alert("Please enter a product name");
    
    const newProduct: Partial<ProductData> = {
      ...newCol,
      supplier: user?.companyName || "My Company",
    };

    const res = await apiCall('create_product', newProduct as Record<string, unknown>);
    
    if (res && res.success) {
        // Add the returned ID to the local state
        const completeProduct = { ...newProduct, id: res.newId } as ProductData;
        setLocalProducts([...localProducts, completeProduct]);
        setNewCol({});
    }
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("Delete this product?")) {
        const oldProducts = [...localProducts];
        setLocalProducts(localProducts.filter(p => p.id !== id));
        
        const success = await apiCall('delete_product', { id });
        if (!success) setLocalProducts(oldProducts); // Revert
    }
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-400">Loading Dashboard...</div>;
  if (errorMsg) return <div className="h-screen w-full flex flex-col items-center justify-center bg-red-50 text-red-500">Error: {errorMsg} <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">Retry</button></div>;

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden">
      
      {/* --- HEADER --- */}
      <header className="bg-slate-900 text-white p-3 px-6 flex justify-between items-center shadow-lg z-50 shrink-0 h-16 relative">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-orange-500 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.4)]">
            <Sun size={18} className="text-white" />
          </div>
          <div>
            {/* NAME CHANGED HERE */}
            <h1 className="font-bold text-base tracking-tight leading-none">Rezillion Supplier</h1>
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
                    
                    {rows.map((row, i) => (
                        <div key={row.id} className={`h-12 px-5 border-b border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? 'bg-slate-[5px]' : ''}`}>
                            <span>{row.label}</span>
                            {!row.isFixed && (
                                <button onClick={() => handleDeleteRow(row.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                    <Trash2 size={12}/>
                                </button>
                            )}
                        </div>
                    ))}
                    
                    <div className="px-5 py-2 border-b border-slate-100 bg-slate-50/50">
                         <button onClick={handleAddRow} className="w-full py-1.5 border border-dashed border-slate-300 text-slate-500 text-[10px] font-bold rounded hover:bg-white hover:border-blue-300 hover:text-blue-600 flex items-center justify-center gap-1 transition-all">
                            <Plus size={10}/> Add Param
                        </button>
                    </div>

                    <div className="px-5 py-3 bg-orange-50/50 border-b border-orange-100 flex flex-col gap-1 mt-0">
                        <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1"><MapPin size={10}/> Location Pricing</span>
                    </div>

                    {locations.map(city => (
                        <div key={city} className="h-12 px-5 border-b border-orange-100 flex items-center justify-between text-xs font-medium text-slate-600 bg-orange-50/10 group">
                        <span>Price at {city}</span>
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
                            <div className="text-sm font-bold text-slate-800 truncate" title={String(data.name)}>{String(data.name)}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{String(data.technology || 'N/A')}</div>
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
                                <input className="w-full text-center text-xs font-bold bg-white border border-blue-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-100 outline-none" value={String(data.name || '')} onChange={e => handleEditChange('name', e.target.value)} />
                            ) : (
                                <span className="text-xs font-bold text-slate-700">{String(data.name || '')}</span>
                            )}
                        </div>

                        {rows.map(row => (
                            <div key={row.id} className="h-12 px-2 border-b border-slate-100 flex items-center justify-center text-xs text-slate-600 text-center relative group-cell">
                            {isEditing ? (
                                // --- EDIT MODE ---
                                row.type === 'select' ? (
                                    <select className="w-full text-center text-xs p-1 bg-white border border-blue-200 rounded focus:ring-2 focus:ring-blue-100 outline-none" value={String(data[row.id] || '')} onChange={e => handleEditChange(row.id, e.target.value)}>
                                        {(row.options || []).map((o: string) => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : row.type === 'file' ? (
                                    <div className="w-full relative group">
                                         <label className="w-full cursor-pointer flex items-center justify-center gap-1 text-[9px] bg-blue-50 text-blue-600 px-2 py-1.5 rounded border border-blue-100 hover:bg-blue-100 transition-colors">
                                            <UploadCloud size={10} />
                                            <span className="truncate max-w-[80px]">{String(data[row.id] || 'Upload')}</span>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                onChange={e => handleFileChange(row.id, e.target.files?.[0])}
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    <input 
                                        type={row.type === 'number' ? 'number' : row.type === 'date' ? 'date' : 'text'}
                                        className="w-full text-center text-xs p-1 bg-white border-b border-blue-200 focus:border-blue-500 outline-none"
                                        value={String(data[row.id] || '')}
                                        onChange={e => handleEditChange(row.id, e.target.value)}
                                    />
                                )
                            ) : (
                                // --- VIEW MODE ---
                                row.type === 'file' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-medium cursor-pointer hover:bg-blue-100 truncate max-w-full">
                                        <FileText size={10}/> 
                                        <span className="truncate">{String(data[row.id] || 'No File')}</span>
                                    </span>
                                ) : (
                                    <span className="truncate w-full px-1">{String(data[row.id] || '-')}</span>
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
                                            value={String(data[fieldKey] || '')}
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
                        <input className="w-full text-center text-xs p-2 bg-white border border-slate-300 rounded shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Enter Name..." value={String(newCol.name || '')} onChange={e => setNewCol({...newCol, name: e.target.value})} />
                   </div>
                   {rows.map(row => (
                      <div key={row.id} className="h-12 flex items-center">
                         {row.type === 'select' ? (
                             <select className="w-full text-xs p-2 bg-white border border-slate-200 rounded focus:border-blue-400 outline-none text-slate-500" value={String(newCol[row.id] || '')} onChange={e => setNewCol({...newCol, [row.id]: e.target.value})}>
                                 <option value="">{row.label}</option>
                                 {(row.options || []).map((o: string) => <option key={o} value={o}>{o}</option>)}
                             </select>
                         ) : row.type === 'file' ? (
                            <label className="w-full h-8 cursor-pointer flex items-center justify-center gap-2 text-xs bg-white border border-dashed border-slate-300 rounded hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all text-slate-400">
                                <UploadCloud size={14} />
                                <span className="truncate max-w-[100px]">{String(newCol[row.id] || 'Upload File')}</span>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={e => handleFileChange(row.id, e.target.files?.[0], true)}
                                />
                            </label>
                         ) : (
                             <input className="w-full text-center text-xs p-2 bg-white border border-slate-200 rounded focus:border-blue-400 outline-none" placeholder={row.label} value={String(newCol[row.id] || '')} onChange={e => setNewCol({...newCol, [row.id]: e.target.value})} type={row.type === 'number' ? 'number' : row.type === 'date' ? 'date' : 'text'}/>
                         )}
                      </div>
                   ))}
                   <div className="h-4"></div> 
                   <button onClick={handleAddColumn} className="w-full py-3 bg-slate-800 text-white rounded-lg shadow-lg hover:bg-slate-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 text-xs font-bold tracking-wide transform active:scale-95"><Plus size={14}/> ADD COLUMN</button>
                </div>
            </div>

            <div className="w-20 shrink-0"></div>
        </div>
      </div>
    </div>
  );
}