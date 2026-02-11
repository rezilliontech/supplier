"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Sun, MapPin, Filter, CheckCircle2, X, 
  Factory, Package, Loader2, ChevronLeft, ChevronRight,
  Send, Mail, Zap, Layers, FileText, FileCode, SlidersHorizontal, RotateCcw,
  Truck, Clock, Download, BarChart3, DollarSign, Calendar, Globe, Phone, ImageIcon
} from 'lucide-react';

// --- TYPES ---
interface Product {
  id: number;
  name: string;
  supplier: string;
  supplierId?: number;
  category?: 'module' | 'inverter';
  priceEx: number;
  power?: number;
  technology?: string;
  type?: string;
  moq?: string;
  
  // Updated fields
  availability_days?: number; 
  stock_location?: string;
  qty_mw?: number;         
  price_ex_10mw?: number;  
  
  city?: string;
  location?: string; 
  datasheet?: string;
  panfile?: string;
  ondfile?: string;
  validity?: string; 
  
  // Supplier Details
  supplier_location?: string; // ADDED THIS
  supplier_about?: string;
  supplier_gallery?: string[];
  supplier_email?: string;
  supplier_phone?: string;
  supplier_website?: string;

  locations?: Array<{state: string, city: string, price: number}>; 
  [key: string]: string | number | boolean | undefined | Array<{state: string, city: string, price: number}> | string[]; 
}

interface Supplier {
  name: string;
  location: string;
  productCount: number;
  id?: number;
  about?: string;
  gallery?: string[];
  email?: string;
  phone?: string;
  website?: string;
}

interface ApiResponse {
  success: boolean;
  data: Product[];
}

// --- CONFIG ---
const SUPPLIERS_PER_PAGE = 8; 

const MODULE_TECHS = ['Mono PERC', 'TOPCon', 'HJT', 'Polycrystalline'];
const INVERTER_TECHS = ['String', 'Central', 'Hybrid', 'Microinverter'];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry'
];

const DEFAULT_FILTERS = {
    location: 'All',
    technology: 'All',
    maxPrice: 100000,
    minQty: 0
};

// --- MODAL COMPONENT ---
const ProductDetailModal = ({ product, onClose }: { product: Product | null, onClose: () => void }) => {
    const [view, setView] = useState<'details' | 'form' | 'success'>('details');
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (product) {
            setView('details');
            setEmail('');
            setSending(false);
        }
    }, [product]);

    if (!product) return null;

    const displayLocations = product.locations && product.locations.length > 0 
        ? product.locations 
        : Object.keys(product)
            .filter(key => key.startsWith('price_location_') && product[key])
            .map(key => ({
                state: '', 
                city: key.replace('price_location_', ''),
                price: Number(product[key])
            }));

    const handleSendInquiry = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            const res = await fetch('/api/contact-supplier', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: email, product: product })
            });
            if (res.ok) setView('success');
            else alert("Failed to send inquiry.");
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-slate-200">
                
                <div className="relative h-32 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <Sun size={48} className="text-orange-500 relative z-10 drop-shadow-lg" />
                    <button onClick={onClose} className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-all flex items-center justify-center backdrop-blur-sm">
                        <ArrowLeft size={18} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {view === 'details' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-6">
                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${product.category === 'inverter' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                    {product.category === 'inverter' ? 'Inverter' : 'Solar Module'}
                                </span>
                                <h2 className="text-xl font-bold text-slate-800 mt-2 mb-1">{product.name}</h2>
                                <p className="text-sm text-slate-500 flex items-center gap-2"><Factory size={14}/> {product.supplier}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Ex-Factory Price</span>
                                    <div className="text-lg font-bold text-slate-900 mt-1">₹{product.priceEx}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">
                                        {product.category === 'inverter' ? 'Power (kW)' : 'Wattage (Wp)'}
                                    </span>
                                    <div className="text-lg font-bold text-slate-900 mt-1">{product.power}</div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6 text-sm text-slate-600 bg-white p-1 rounded-lg">
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span>Technology</span>
                                    <span className="font-semibold text-slate-800">{product.technology || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span>Stock Location</span>
                                    <span className="font-semibold text-slate-800">{product.stock_location || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span>Availability</span>
                                    <span className="font-semibold text-green-600 bg-green-50 px-2 rounded-full text-xs py-0.5">{product.availability ? `${product.availability} Days` : '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span>Total Qty (MW)</span>
                                    <span className="font-semibold text-slate-800">{product.qty_mw || '-'}</span>
                                </div>
                                
                                {product.category === 'inverter' && product.price_ex_10mw && (
                                     <div className="flex justify-between border-b border-yellow-100 pb-2 bg-yellow-50 px-2 py-1 rounded">
                                        <span className="text-yellow-800">Price (10 MWp)</span>
                                        <span className="font-bold text-slate-900">₹{product.price_ex_10mw}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                                {product.datasheet && (
                                    <a href={product.datasheet} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 px-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg hover:border-blue-400 hover:text-blue-600 hover:shadow-md transition-all flex items-center justify-center gap-2 text-xs whitespace-nowrap">
                                        <FileText size={16}/> Datasheet
                                    </a>
                                )}
                                {product.panfile && (
                                    <a href={product.panfile} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 px-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg hover:border-purple-400 hover:text-purple-600 hover:shadow-md transition-all flex items-center justify-center gap-2 text-xs whitespace-nowrap">
                                        <FileCode size={16}/> .PAN
                                    </a>
                                )}
                                {product.ondfile && (
                                    <a href={product.ondfile} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 px-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg hover:border-green-400 hover:text-green-600 hover:shadow-md transition-all flex items-center justify-center gap-2 text-xs whitespace-nowrap">
                                        <FileCode size={16}/> .OND
                                    </a>
                                )}
                            </div>

                            <button onClick={() => setView('form')} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30">
                                <Mail size={18}/> Contact Supplier Now
                            </button>
                        </div>
                    )}
                    
                    {view === 'form' && (
                        <form onSubmit={handleSendInquiry} className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-6 text-center"><h3 className="text-lg font-bold text-slate-800">Contact {product.supplier}</h3></div>
                            <div className="mb-6">
                                <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Your Email Address</label>
                                <input type="email" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setView('details')} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">Back</button>
                                <button type="submit" disabled={sending} className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700">{sending ? <Loader2 size={18} className="animate-spin"/> : <><Send size={16}/> Send Inquiry</>}</button>
                            </div>
                        </form>
                    )}
                    {view === 'success' && (
                        <div className="text-center py-8 animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><CheckCircle2 size={40} /></div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Inquiry Sent!</h3>
                            <p className="text-slate-500 mb-8 text-sm">The supplier has been notified.</p>
                            <button onClick={onClose} className="px-10 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">Close</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
export default function SolarMarketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState<'module' | 'inverter'>('module');
  const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [tempFilters, setTempFilters] = useState(DEFAULT_FILTERS);

  // Fetch Data
  useEffect(() => {
    const fetchMarketData = async () => {
        try {
            const res = await fetch('/api/marketplace');
            if(!res.ok) throw new Error("Failed to fetch");
            const json: ApiResponse = await res.json();
            if(json.success) setProducts(json.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    fetchMarketData();
  }, []);

  // Actions
  const applyFilters = () => {
      setFilters(tempFilters);
      setCurrentPage(1);
      setActiveSupplier(null);
  };

  const resetFilters = () => {
      setTempFilters(DEFAULT_FILTERS);
      setFilters(DEFAULT_FILTERS);
      setCurrentPage(1);
  };

  useEffect(() => {
      setTempFilters(prev => ({ ...prev, technology: 'All' }));
      setFilters(prev => ({ ...prev, technology: 'All' }));
      setActiveSupplier(null);
      setCurrentPage(1);
  }, [activeCategory]);

  // Derived Data
  const suppliersList = useMemo(() => {
    const unique = new Map<string, Supplier>();

    products.forEach(item => {
        const itemCat = (item.category || 'module').toLowerCase();
        if (itemCat !== activeCategory) return;

        const pTech = (item.technology || '').toLowerCase();
        const pPrice = Number(item.priceEx) || 0;
        const pMoq = parseInt(item.moq || '0') || 0;

        const filterLoc = filters.location;
        let matchesLoc = false;
        if (filterLoc === 'All') matchesLoc = true;
        else if (item.locations && Array.isArray(item.locations)) {
            matchesLoc = item.locations.some(l => l.state.includes(filterLoc) || l.city.toLowerCase().includes(filterLoc.toLowerCase()));
        }

        const filterTech = filters.technology.toLowerCase();
        const matchesTech = filters.technology === 'All' || pTech.includes(filterTech);
        const matchesPrice = pPrice === 0 || pPrice <= filters.maxPrice;
        const matchesMoq = filters.minQty === 0 || pMoq <= filters.minQty;

        if (matchesLoc && matchesTech && matchesPrice && matchesMoq) {
            const supplierName = item.supplier || "Unknown Supplier";
            if (!unique.has(supplierName)) {
                unique.set(supplierName, {
                    name: supplierName,
                    // UPDATED THIS LINE TO USE SUPPLIER LOCATION
                    location: item.supplier_location || item.city || "India", 
                    productCount: 0,
                    id: item.supplierId,
                    about: item.supplier_about,
                    gallery: item.supplier_gallery,
                    email: item.supplier_email,
                    phone: item.supplier_phone,
                    website: item.supplier_website
                });
            }
            const supplier = unique.get(supplierName);
            if (supplier) supplier!.productCount += 1;
        }
    });
    return Array.from(unique.values());
  }, [products, filters, activeCategory]);

  const totalPages = Math.ceil(suppliersList.length / SUPPLIERS_PER_PAGE);
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * SUPPLIERS_PER_PAGE;
    return suppliersList.slice(start, start + SUPPLIERS_PER_PAGE);
  }, [suppliersList, currentPage]);

  const supplierProducts = useMemo(() => {
    if (!activeSupplier) return [];
    return products.filter(p => {
        const pSupplier = p.supplier || "Unknown Supplier";
        const pCat = (p.category || 'module').toLowerCase(); 
        const pMoq = parseInt(p.moq || '0') || 0;
        
        const matchesMoq = filters.minQty === 0 || pMoq <= filters.minQty;
        const matchesTech = filters.technology === 'All' || (p.technology || '').toLowerCase().includes(filters.technology.toLowerCase());

        return pSupplier === activeSupplier.name && pCat === activeCategory && matchesMoq && matchesTech;
    });
  }, [products, activeSupplier, activeCategory, filters]);

  // Dynamic Columns
  const dynamicColumns = useMemo(() => {
    if(!activeSupplier) return { locations: [], customParams: [] };
    const locs = new Set<string>();
    supplierProducts.forEach(p => {
        if(p.locations) {
            p.locations.forEach(l => locs.add(l.city));
        }
    });
    return { locations: Array.from(locs) };
  }, [supplierProducts, activeSupplier]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
  };

  if (loading) return <div className="w-full h-screen bg-slate-50 flex items-center justify-center text-slate-400"><Loader2 className="animate-spin text-orange-500" size={32} /></div>;

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col font-sans overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-30 shrink-0 h-16">
            <div className="flex items-center gap-3">
                {/* --- HEADER BACK BUTTON --- */}
                {activeSupplier && (
                    <button onClick={() => setActiveSupplier(null)} className="mr-2 text-slate-500 hover:text-indigo-600 transition-colors bg-slate-100 p-1.5 rounded-full">
                        <ArrowLeft size={18}/>
                    </button>
                )}
                
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-1.5 rounded-lg shadow-md shadow-orange-500/20"><Sun size={20} className="text-white"/></div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900">SolarChain <span className="text-slate-400 font-light">Market</span></h1>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            
            {/* Sidebar Filters */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex shrink-0 z-20 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
                <div className="p-5 border-b border-slate-100">
                    <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                        <button onClick={() => setActiveCategory('module')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${activeCategory === 'module' ? 'bg-white shadow-sm text-orange-600 border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Layers size={14} /> Modules
                        </button>
                        <button onClick={() => setActiveCategory('inverter')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${activeCategory === 'inverter' ? 'bg-white shadow-sm text-blue-600 border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Zap size={14} /> Inverters
                        </button>
                    </div>
                </div>

                <div className="p-5 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-bold mb-1">
                        <Filter size={16}/> <span className="text-sm">Filters</span>
                    </div>
                </div>

                <div className="p-5 space-y-6 overflow-y-auto flex-1">
                    {/* Location */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">State / Region</label>
                        <select className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 cursor-pointer text-slate-700 transition-all" value={tempFilters.location} onChange={e => setTempFilters({...tempFilters, location: e.target.value})}>
                            <option value="All">All India</option>
                            {INDIAN_STATES.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>

                    {/* Tech */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Technology</label>
                        <div className="space-y-1.5">
                            <label className={`flex items-center gap-2 text-xs cursor-pointer px-3 py-2 rounded-lg transition-all border ${tempFilters.technology === 'All' ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-100' : 'text-slate-600 hover:bg-slate-50 border-transparent'}`}>
                                <input type="radio" name="tech" className="hidden" checked={tempFilters.technology === 'All'} onChange={() => setTempFilters({...tempFilters, technology: 'All'})} />
                                <div className={`w-1.5 h-1.5 rounded-full ${tempFilters.technology === 'All' ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                                Any
                            </label>
                            {(activeCategory === 'module' ? MODULE_TECHS : INVERTER_TECHS).map(tech => (
                                <label key={tech} className={`flex items-center gap-2 text-xs cursor-pointer px-3 py-2 rounded-lg transition-all border ${tempFilters.technology === tech ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-100' : 'text-slate-600 hover:bg-slate-50 border-transparent'}`}>
                                    <input type="radio" name="tech" className="hidden" checked={tempFilters.technology === tech} onChange={() => setTempFilters({...tempFilters, technology: tech})} />
                                    <div className={`w-1.5 h-1.5 rounded-full ${tempFilters.technology === tech ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                                    {tech}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Price */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Max Ex-Factory</label>
                             <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">₹{tempFilters.maxPrice}</span>
                        </div>
                        <input type="range" min="10" max={activeCategory === 'inverter' ? "100000" : "50000"} step="100" value={tempFilters.maxPrice} onChange={e => setTempFilters({...tempFilters, maxPrice: Number(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                    </div>

                    {/* MOQ */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Max Minimum Order</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="number" placeholder="Any" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50" value={tempFilters.minQty === 0 ? '' : tempFilters.minQty} onChange={e => setTempFilters({...tempFilters, minQty: Number(e.target.value) || 0})} />
                            <span className="text-xs text-slate-400">Qty</span>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 border-t border-slate-200 space-y-2 bg-slate-50">
                    <button onClick={applyFilters} className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]">
                        <SlidersHorizontal size={14}/> Apply Filters
                    </button>
                    <button onClick={resetFilters} className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <RotateCcw size={12}/> Reset Filters
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden bg-slate-50 flex flex-col relative">
                
                {/* 1. Suppliers Grid */}
                {!activeSupplier && (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-8 pb-4 shrink-0">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">{activeCategory === 'module' ? 'Module' : 'Inverter'} Suppliers</h2>
                            <p className="text-sm text-slate-500 mt-1">Found {suppliersList.length} verified suppliers.</p>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-8 pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {paginatedSuppliers.length === 0 ? (
                                    <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                                        <Package size={48} className="mb-4 text-slate-300"/>
                                        <p className="text-slate-500">No {activeCategory} suppliers found.</p>
                                    </div>
                                ) : (
                                    paginatedSuppliers.map((supplier) => (
                                        <div key={supplier.name} onClick={() => setActiveSupplier(supplier)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 cursor-pointer transition-all group flex flex-col h-48 relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-4 relative z-10">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 flex items-center justify-center text-xl font-bold text-slate-600 group-hover:from-indigo-50 group-hover:to-indigo-100 group-hover:text-indigo-700 transition-colors shadow-inner">
                                                    {supplier.name.charAt(0)}
                                                </div>
                                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full border border-emerald-100 flex items-center gap-1"><CheckCircle2 size={10}/> Verified</span>
                                            </div>
                                            <div className="mt-auto relative z-10">
                                                <h3 className="font-bold text-base text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{supplier.name}</h3>
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 mb-3"><MapPin size={12}/> {supplier.location}</p>
                                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-slate-500">{supplier.productCount} {activeCategory === 'module' ? 'Modules' : 'Inverters'}</span>
                                                    <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">View <ArrowLeft size={12} className="rotate-180"/></span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        
                        {totalPages > 1 && (
                            <div className="h-16 border-t border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
                                <span className="text-xs text-slate-400">Page {currentPage} of {totalPages}</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors"><ChevronLeft size={16}/></button>
                                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors"><ChevronRight size={16}/></button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. Products List (Supplier View) */}
                {activeSupplier && (
                    <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300 bg-white">
                        
                        {/* --- SUPPLIER HEADER START --- */}
                        <div className="bg-slate-900 text-white p-8 shrink-0 border-b border-slate-800 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
                            
                            <div className="flex flex-col md:flex-row gap-8 relative z-10">
                                {/* Left: Info */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center text-2xl font-bold text-white border border-white/20">
                                            {activeSupplier.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold tracking-tight">{activeSupplier.name}</h2>
                                            <div className="flex items-center gap-3 text-slate-400 text-xs mt-1">
                                                <span className="flex items-center gap-1"><MapPin size={12}/> {activeSupplier.location}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500"/> Verified Supplier</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-3 pt-2">
                                        {activeSupplier.website && (
                                            <a href={activeSupplier.website} target="_blank" rel="noopener" className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs transition-colors">
                                                <Globe size={12} className="text-blue-400"/> Website
                                            </a>
                                        )}
                                        {activeSupplier.phone && (
                                            <span className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs">
                                                <Phone size={12} className="text-green-400"/> {activeSupplier.phone}
                                            </span>
                                        )}
                                        {activeSupplier.email && (
                                            <span className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs">
                                                <Mail size={12} className="text-orange-400"/> {activeSupplier.email}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Center: About Us */}
                                <div className="flex-1 max-w-lg">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">About Company</h3>
                                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-4">
                                        {activeSupplier.about || "We are a verified supplier of high-quality solar products. We specialize in providing top-tier modules and inverters for residential and commercial projects across India."}
                                    </p>
                                </div>

                                {/* Right: Gallery */}
                                <div className="flex-1 max-w-xs">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><ImageIcon size={12}/> Gallery</h3>
                                    {activeSupplier.gallery && activeSupplier.gallery.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            {activeSupplier.gallery.slice(0,6).map((img, i) => (
                                                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/5 hover:scale-105 transition-transform cursor-pointer">
                                                    <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-24 bg-white/5 border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-slate-500 text-xs gap-1">
                                            <ImageIcon size={20} className="opacity-50"/> No Photos
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* --- SUPPLIER HEADER END --- */}

                        <div className="flex-1 overflow-auto bg-white">
                             <div className="min-w-max">
                                {/* Table Header */}
                                <div className="flex h-12 bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[10px] font-bold text-slate-500 uppercase tracking-wider shadow-sm">
                                    <div className="w-[180px] px-4 flex items-center border-r border-slate-200 shrink-0 bg-slate-50">Product Name</div>
                                    <div className="w-[110px] px-4 flex items-center border-r border-slate-200 shrink-0">Technology</div>
                                    
                                    {activeCategory === 'module' && <div className="w-[80px] px-4 flex items-center border-r border-slate-200 shrink-0">Type</div>}
                                    
                                    <div className="w-[80px] px-4 flex items-center border-r border-slate-200 shrink-0">{activeCategory === 'inverter' ? 'Pwr(kW)' : 'Pwr(Wp)'}</div>
                                    <div className="w-[80px] px-4 flex items-center border-r border-slate-200 shrink-0">Min Order</div>
                                    
                                    <div className="w-[80px] px-4 flex items-center border-r border-slate-200 shrink-0"><BarChart3 size={12} className="mr-1 text-slate-400"/> Qty(MW)</div>
                                    <div className="w-[90px] px-4 flex items-center border-r border-slate-200 shrink-0"><Clock size={12} className="mr-1 text-slate-400"/> Avail.</div>
                                    <div className="w-[120px] px-4 flex items-center border-r border-slate-200 shrink-0"><Truck size={12} className="mr-1 text-slate-400"/> Stock Loc</div>
                                    <div className="w-[100px] px-4 flex items-center border-r border-slate-200 shrink-0"><Calendar size={12} className="mr-1 text-slate-400"/> Validity</div>
                                    
                                    <div className="w-[100px] px-4 flex items-center border-r border-slate-200 bg-yellow-50/50 shrink-0 text-yellow-700">Ex-Fact.</div>
                                    
                                    {/* Inverter Only Column */}
                                    {activeCategory === 'inverter' && (
                                        <div className="w-[100px] px-4 flex items-center border-r border-slate-200 bg-yellow-50/70 shrink-0 text-yellow-800"><DollarSign size={10} className="mr-1"/> 10MW</div>
                                    )}

                                    {/* Explicit File Columns */}
                                    <div className="w-[100px] px-4 flex items-center border-r border-slate-200 shrink-0"><FileText size={12} className="mr-1 text-blue-400"/> Datasheet</div>
                                    
                                    {activeCategory === 'module' && <div className="w-[100px] px-4 flex items-center border-r border-slate-200 shrink-0"><FileCode size={12} className="mr-1 text-purple-400"/> PAN File</div>}
                                    {activeCategory === 'inverter' && <div className="w-[100px] px-4 flex items-center border-r border-slate-200 shrink-0"><Zap size={12} className="mr-1 text-green-400"/> OND File</div>}
                                    
                                    {/* Dynamic Locations Headers */}
                                    {dynamicColumns.locations.map(city => (
                                        <div key={city} className="w-[100px] px-4 flex items-center border-r border-slate-200 bg-orange-50/30 text-orange-800 shrink-0">@ {city}</div>
                                    ))}
                                    
                                    <div className="w-[140px] px-4 flex items-center sticky right-0 bg-slate-50 shadow-[-5px_0_10px_rgba(0,0,0,0.02)] shrink-0">Action</div>
                                </div>

                                {/* Table Rows */}
                                {supplierProducts.map((p, i) => (
                                    <div key={p.id} className={`flex h-14 border-b border-slate-100 hover:bg-orange-50/10 transition-colors group ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                        <div className="w-[180px] px-4 flex items-center text-xs font-bold text-slate-800 border-r border-slate-100 truncate shrink-0" title={p.name}>{p.name}</div>
                                        <div className="w-[110px] px-4 flex items-center text-xs text-slate-600 border-r border-slate-100 shrink-0 truncate">{p.technology || '-'}</div>
                                        
                                        {activeCategory === 'module' && <div className="w-[80px] px-4 flex items-center text-xs text-slate-600 border-r border-slate-100 shrink-0 truncate">{p.type || '-'}</div>}
                                        
                                        <div className="w-[80px] px-4 flex items-center text-xs text-slate-600 border-r border-slate-100 shrink-0">{p.power || '-'}</div>
                                        <div className="w-[80px] px-4 flex items-center text-xs text-slate-600 border-r border-slate-100 shrink-0 truncate">{p.moq || '-'}</div>
                                        
                                        <div className="w-[80px] px-4 flex items-center text-xs text-slate-600 border-r border-slate-100 shrink-0 truncate">{p.qty_mw !== undefined ? p.qty_mw : '-'}</div>
                                        <div className="w-[90px] px-4 flex items-center text-xs border-r border-slate-100 shrink-0 truncate">
                                            {p.availability_days ? <span className="text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">{p.availability_days} Days</span> : '-'}
                                        </div>
                                        <div className="w-[120px] px-4 flex items-center text-xs text-slate-600 border-r border-slate-100 shrink-0 truncate" title={p.stock_location || ''}>
                                            {p.stock_location || '-'}
                                        </div>
                                        
                                        <div className="w-[100px] px-4 flex items-center text-xs text-slate-500 border-r border-slate-100 shrink-0">
                                            {p.validity ? new Date(p.validity).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '-'}
                                        </div>
                                        
                                        <div className="w-[100px] px-4 flex items-center text-sm font-bold text-slate-900 border-r border-slate-100 bg-yellow-50/10 shrink-0">₹{p.priceEx}</div>
                                        
                                        {/* Inverter 10MW Price */}
                                        {activeCategory === 'inverter' && (
                                            <div className="w-[100px] px-4 flex items-center text-xs font-bold text-slate-800 border-r border-slate-100 bg-yellow-50/20 shrink-0">
                                                {p.price_ex_10mw ? `₹${p.price_ex_10mw}` : '-'}
                                            </div>
                                        )}

                                        <div className="w-[100px] px-4 flex items-center justify-center border-r border-slate-100 shrink-0">
                                            {p.datasheet ? (
                                                <a href={p.datasheet} target="_blank" className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded transition-colors" title="Datasheet PDF"><FileText size={14}/></a>
                                            ) : <span className="text-slate-300">-</span>}
                                        </div>

                                        {activeCategory === 'module' && (
                                            <div className="w-[100px] px-4 flex items-center justify-center border-r border-slate-100 shrink-0">
                                                {p.panfile ? (
                                                    <a href={p.panfile} target="_blank" className="text-purple-500 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 p-1.5 rounded transition-colors" title="PAN File"><FileCode size={14}/></a>
                                                ) : <span className="text-slate-300">-</span>}
                                            </div>
                                        )}

                                        {activeCategory === 'inverter' && (
                                            <div className="w-[100px] px-4 flex items-center justify-center border-r border-slate-100 shrink-0">
                                                {p.ondfile ? (
                                                    <a href={p.ondfile} target="_blank" className="text-green-500 hover:text-green-700 bg-green-50 hover:bg-green-100 p-1.5 rounded transition-colors" title="OND File"><Zap size={14}/></a>
                                                ) : <span className="text-slate-300">-</span>}
                                            </div>
                                        )}
                                        
                                        {/* Dynamic Locations Data */}
                                        {dynamicColumns.locations.map(city => {
                                            const loc = p.locations?.find(l => l.city === city);
                                            return (
                                                <div key={city} className="w-[100px] px-4 flex items-center text-xs text-slate-600 border-r border-slate-100 bg-orange-50/5 shrink-0">
                                                    {loc ? `₹${loc.price}` : '-'}
                                                </div>
                                            )
                                        })}
                                        
                                        <div className="w-[140px] px-4 flex items-center justify-center sticky right-0 bg-white shadow-[-5px_0_10px_rgba(0,0,0,0.02)] group-hover:bg-white shrink-0">
                                            <button onClick={() => setSelectedProduct(p)} className="px-4 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white text-[10px] font-bold rounded-lg shadow transition-colors">Contact</button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        {/* Detail Modal */}
        <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}