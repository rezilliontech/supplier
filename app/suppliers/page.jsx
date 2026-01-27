"use client";

import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Globe, Search, Zap, Battery, Sun, MapPin, 
  Tag, CheckCircle2, MessageSquare, X, Send 
} from 'lucide-react';

// --- MOCK DATABASE (Simulating added products) ---
const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: "Neo-X High Efficiency Panel",
    category: "Solar Modules",
    price: 240,
    supplier: "Solar Tech Solutions",
    supplyRegion: "North India",
    technology: "TOPCon",
    power: "700 Wp",
    description: "High-efficiency n-type module suitable for commercial projects with low-light performance."
  },
  {
    id: 2,
    name: "Hybrid Inverter 5kW",
    category: "Inverters",
    price: 850,
    supplier: "GreenEnergy Systems",
    supplyRegion: "South India",
    technology: "Hybrid",
    power: "5 kW",
    description: "Smart hybrid inverter with battery backup support and wifi monitoring."
  },
  {
    id: 3,
    name: "Lithium PowerWall",
    category: "Energy Storage",
    price: 3200,
    supplier: "VoltStorage Inc",
    supplyRegion: "West-India",
    technology: "LiFePO4",
    power: "10 kWh",
    description: "Residential energy storage solution with 10 year warranty."
  },
  {
      id: 4,
      name: "Mono Perc 540W",
      category: "Solar Modules",
      price: 180,
      supplier: "Solar Tech Solutions",
      supplyRegion: "North India",
      technology: "Mono PERC",
      power: "540 Wp",
      description: "Standard rigorous tested module for utility scale parks."
  }
];

const CATEGORIES = ['Solar Modules', 'Inverters', 'Energy Storage'];
const REGIONS = ['South India', 'North India', 'West-India', 'East India'];

// --- MESSAGE MODAL COMPONENT ---
const MessageModal = ({ product, onClose, onSend }) => {
    const [msg, setMsg] = useState('');
    if (!product) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold flex items-center gap-2"><MessageSquare size={18}/> Contact Supplier</h3>
                    <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full"><X size={18}/></button>
                </div>
                <div className="p-6">
                    <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-400 uppercase font-bold">To Supplier</p>
                        <p className="text-sm font-bold text-slate-800">{product.supplier}</p>
                        <p className="text-xs text-slate-500 mt-1">Ref: {product.name}</p>
                    </div>
                    <textarea 
                        className="w-full h-32 p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Hi, I am interested in this product. Please share availability..."
                        value={msg}
                        onChange={e => setMsg(e.target.value)}
                        autoFocus
                    ></textarea>
                    <button 
                        onClick={() => onSend(msg)}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <Send size={16}/> Send Message
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
export default function SolarNetworkPage() {
  // State
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  
  // Messaging State
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.supplier.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
        const matchesRegion = regionFilter === 'All' || p.supplyRegion === regionFilter;
        return matchesSearch && matchesCategory && matchesRegion;
    });
  }, [products, searchTerm, categoryFilter, regionFilter]);

  // Handlers
  const handleSendMessage = (text) => {
      if(!text) return alert("Please write a message");
      alert(`Message sent to ${selectedProduct.supplier} for ${selectedProduct.name}:\n\n"${text}"`);
      setSelectedProduct(null);
  };

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
        
        {/* Navigation Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-20 shrink-0">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="bg-orange-500 p-1.5 rounded-lg"><Globe size={20} className="text-white"/></div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Global Solar Network</h1>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-sm text-slate-500 hidden md:block px-3 py-1 bg-slate-100 rounded-full">
                    Active Suppliers: <strong className="text-slate-900">{new Set(products.map(p => p.supplier)).size}</strong>
                </div>
            </div>
        </div>

        {/* Main Workspace */}
        <div className="flex flex-1 overflow-hidden">
            
            {/* Sidebar Filters */}
            <div className="w-80 bg-white border-r border-slate-200 p-6 flex-col gap-6 hidden md:flex overflow-y-auto z-10 shrink-0">
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Search & Filter</h3>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                            placeholder="Search products or suppliers..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-semibold text-slate-700 mb-3 block">Category</label>
                    <div className="space-y-1">
                        <label className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg cursor-pointer transition-colors ${categoryFilter === 'All' ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
                            <input type="radio" name="cat" checked={categoryFilter === 'All'} onChange={() => setCategoryFilter('All')} className="accent-orange-500 hidden" />
                            <div className={`w-2 h-2 rounded-full ${categoryFilter === 'All' ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                            All Components
                        </label>
                        {CATEGORIES.map(c => (
                            <label key={c} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg cursor-pointer transition-colors ${categoryFilter === c ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <input type="radio" name="cat" checked={categoryFilter === c} onChange={() => setCategoryFilter(c)} className="accent-orange-500 hidden" />
                                <div className={`w-2 h-2 rounded-full ${categoryFilter === c ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                                {c}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-6 mt-auto">
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Supply Region</label>
                    <div className="relative">
                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <select 
                            className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-orange-500 appearance-none text-slate-600 cursor-pointer"
                            value={regionFilter}
                            onChange={e => setRegionFilter(e.target.value)}
                        >
                            <option value="All">Global (All Regions)</option>
                            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Product Feed Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Available Inventory <span className="text-slate-400 font-normal">({filteredProducts.length})</span></h2>
                        <div className="flex gap-2">
                            <select className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 outline-none cursor-pointer">
                                <option>Sort by: Newest</option>
                                <option>Sort by: Price Low-High</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 pb-20">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-lg hover:border-orange-100 transition-all duration-300 flex flex-col md:flex-row gap-6 group">
                                {/* Product Icon/Image */}
                                <div className="w-full md:w-48 h-32 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden border border-slate-100">
                                    {product.category === "Inverters" ? <Zap size={32} className="text-slate-400 group-hover:text-yellow-500 transition-colors"/> : 
                                     product.category === "Energy Storage" ? <Battery size={32} className="text-slate-400 group-hover:text-green-500 transition-colors"/> : 
                                     <Sun size={32} className="text-slate-400 group-hover:text-orange-500 transition-colors"/>}
                                    <div className="absolute top-2 left-2 bg-white px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 border border-slate-100">
                                        #{product.id}
                                    </div>
                                </div>

                                {/* Details Column */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                                                    ${product.category === 'Solar Modules' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                                                      product.category === 'Inverters' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                                                      'bg-green-50 text-green-700 border border-green-100'}
                                                `}>
                                                    {product.category}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100"><MapPin size={10}/> {product.supplyRegion || "Global"}</span>
                                            </div>
                                            <span className="text-lg font-bold text-slate-900 font-mono">${product.price}</span>
                                        </div>
                                        
                                        <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-orange-600 transition-colors">{product.name}</h3>
                                        
                                        {/* Specs Tags */}
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
                                           {product.technology && (
                                              <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100 text-slate-600">
                                                <Tag size={10} /> {product.technology}
                                              </span>
                                           )}
                                           {product.power && product.power !== 'N/A' && (
                                              <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100 text-slate-600">
                                                <Zap size={10} className="text-yellow-500" /> {product.power}
                                              </span>
                                           )}
                                        </div>

                                        <p className="text-sm text-slate-500 line-clamp-2">{product.description}</p>
                                    </div>

                                    {/* Action Row */}
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                                                {product.supplier.charAt(0)}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">{product.supplier}</span>
                                            <CheckCircle2 size={12} className="text-blue-500" />
                                        </div>
                                        
                                        <button 
                                            onClick={() => setSelectedProduct(product)}
                                            className="px-4 py-2 bg-slate-900 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                                        >
                                            <MessageSquare size={14} /> Contact Supplier
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-20 opacity-50">
                                <Search size={48} className="mx-auto mb-4 text-slate-300"/>
                                <p>No products found matching your filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Modal Overlay */}
        {selectedProduct && (
            <MessageModal 
                product={selectedProduct} 
                onClose={() => setSelectedProduct(null)} 
                onSend={handleSendMessage} 
            />
        )}
    </div>
  );
}