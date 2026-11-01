import React, { useState } from 'react';
import { ServiceItem } from '../../types';
import {
  Search,
  FileCheck,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';

interface ServicesCatalogueProps {
  services: ServiceItem[];
  onApplyService: (service: ServiceItem) => void;
  cafeBanner?: string;
}

export const ServicesCatalogue: React.FC<ServicesCatalogueProps> = ({
  services,
  onApplyService,
  cafeBanner,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Govt Identity',
    'Certificates & Revenue',
    'Education & Jobs',
    'Travel & Identity',
    'Utility & Banking',
    'Print & Scan',
  ];

  const filteredServices = services.filter((s) => {
    if (!s.active) return false;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || s.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Cafe Emergency / Info Banner */}
      {cafeBanner && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-white to-cyan-50 border border-blue-200 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm text-slate-700">
            <span className="font-bold text-blue-700">Cafe Notice: </span>
            {cafeBanner}
          </div>
        </div>
      )}

      {/* Hero Welcome Header with Himalayan backdrop and emblem (Light Mode) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 relative overflow-hidden shadow-lg group">
        {/* Background Image of Himalayan temple */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
          style={{ backgroundImage: `url('/bg-himalayas.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/65 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Nautiyal Cyber Cafe • Devbhoomi Uttarakhand</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              E-Governance & Digital Cyber Services
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Apply online for PAN cards, Aadhaar updates, revenue certificates, admit cards, job forms, and utility bills. We process your documents securely and deliver completed digital PDFs right to your account.
            </p>
          </div>

          <div className="hidden md:flex flex-col items-center flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg ring-4 ring-red-600 overflow-hidden flex items-center justify-center">
              <img src="/logo-circle.png" alt="Nautiyal Cyber Cafe" className="w-full h-full object-contain" />
            </div>
            <span className="text-[10px] text-blue-800 font-bold italic mt-1.5 text-center max-w-[140px]">
              "If there is no struggle, there is no progress"
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 relative z-10">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search services (e.g. PAN card, Income Certificate, Passport, Job form)..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-4 flex flex-wrap gap-2 relative z-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/90 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredServices.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <Info className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-700">No Services Found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5 group"
            >
              <div>
                {/* Category & Fee header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    {service.category}
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-600">₹{service.fee}</span>
                    <span className="text-[10px] text-slate-500 block font-medium">Cafe Charge</span>
                  </div>
                </div>

                {/* Service Name & Description */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {service.name}
                </h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {service.description}
                </p>

                {/* Turnaround Time */}
                {service.processingTime && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Est. Time: {service.processingTime}</span>
                  </div>
                )}

                {/* Required Documents Checklist */}
                {service.requiredDocuments && service.requiredDocuments.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Required Documents ({service.requiredDocuments.length})</span>
                    </h4>
                    <ul className="space-y-1">
                      {service.requiredDocuments.slice(0, 3).map((doc, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <span className="text-blue-600 font-bold">•</span>
                          <span className="truncate">{doc}</span>
                        </li>
                      ))}
                      {service.requiredDocuments.length > 3 && (
                        <li className="text-[11px] text-blue-600 font-semibold">
                          +{service.requiredDocuments.length - 3} more required document(s)
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3">
                <button
                  onClick={() => onApplyService(service)}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Apply Online</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
