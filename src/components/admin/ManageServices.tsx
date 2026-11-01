import React, { useState } from 'react';
import { ServiceItem } from '../../types';
import { addService, updateService, deleteService } from '../../services/cafeService';
import {
  Sliders,
  Plus,
  Edit2,
  Trash2,
  X,
  Power,
  Search,
  AlertCircle,
  Clock,
  BellRing,
} from 'lucide-react';

interface ManageServicesProps {
  services: ServiceItem[];
  onRefreshServices: () => Promise<void>;
}

export const ManageServices: React.FC<ManageServicesProps> = ({
  services,
  onRefreshServices,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Govt Identity');
  const [description, setDescription] = useState('');
  const [fee, setFee] = useState<number>(100);
  const [processingTime, setProcessingTime] = useState('2-3 Business Days');
  const [instructions, setInstructions] = useState('');
  const [active, setActive] = useState(true);
  const [notifyCustomers, setNotifyCustomers] = useState(true);
  const [docList, setDocList] = useState<string[]>(['Aadhaar Card', 'Passport Photo']);
  const [newDocInput, setNewDocInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setName('');
    setCategory('Govt Identity');
    setDescription('');
    setFee(100);
    setProcessingTime('2-3 Business Days');
    setInstructions('');
    setActive(true);
    setNotifyCustomers(true);
    setDocList(['Aadhaar Card (Front & Back)', 'Passport Size Photograph']);
    setNewDocInput('');
    setEditingService(null);
    setIsCreating(true);
    setError(null);
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingService(service);
    setName(service.name);
    setCategory(service.category);
    setDescription(service.description);
    setFee(service.fee);
    setProcessingTime(service.processingTime || '2-3 Business Days');
    setInstructions(service.instructions || '');
    setActive(service.active);
    setDocList(service.requiredDocuments || []);
    setNewDocInput('');
    setIsCreating(false);
    setError(null);
  };

  const handleAddDocToRequirements = () => {
    if (!newDocInput.trim()) return;
    setDocList([...docList, newDocInput.trim()]);
    setNewDocInput('');
  };

  const handleRemoveDoc = (index: number) => {
    setDocList(docList.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Service name is required.');
      return;
    }
    if (fee < 0) {
      setError('Fee cannot be negative.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingService) {
        await updateService(editingService.id, {
          name: name.trim(),
          category,
          description: description.trim(),
          fee: Number(fee),
          processingTime: processingTime.trim(),
          instructions: instructions.trim(),
          active,
          requiredDocuments: docList,
        });
      } else {
        await addService(
          {
            name: name.trim(),
            category,
            description: description.trim(),
            fee: Number(fee),
            processingTime: processingTime.trim(),
            instructions: instructions.trim(),
            active,
            requiredDocuments: docList,
            createdAt: new Date().toISOString(),
          },
          notifyCustomers
        );
      }
      await onRefreshServices();
      setEditingService(null);
      setIsCreating(false);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error saving service.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (service: ServiceItem) => {
    try {
      await updateService(service.id, { active: !service.active });
      await onRefreshServices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    try {
      await deleteService(serviceToDelete.id);
      await onRefreshServices();
      setServiceToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-600" />
            <span>Manage Cyber Cafe Services</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Create, edit, price, and publish services in real time. New services instantly notify Android & Web customers without APK updates.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-md flex items-center gap-2 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter services by name or category..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
        />
      </div>

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all ${
              service.active
                ? 'border-slate-200 hover:border-blue-300'
                : 'border-slate-200/70 opacity-75 bg-slate-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {service.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-emerald-700">₹{service.fee}</span>
                  <button
                    onClick={() => handleToggleActive(service)}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                      service.active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                    title={service.active ? 'Service is Active (Click to Deactivate)' : 'Service is Inactive (Click to Activate)'}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{service.active ? 'Live' : 'Hidden'}</span>
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1.5">{service.name}</h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {service.description}
              </p>

              {service.processingTime && (
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>ETA: {service.processingTime}</span>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                <strong className="text-slate-800">Required: </strong>
                {service.requiredDocuments && service.requiredDocuments.length > 0
                  ? service.requiredDocuments.join(', ')
                  : 'No specific documents'}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => openEditModal(service)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setServiceToDelete(service)}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition"
                title="Remove Service"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Service Modal */}
      {(isCreating || editingService) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {editingService ? `Edit Service: ${editingService.name}` : 'Add New Cyber Service'}
              </h2>
              <button
                onClick={() => {
                  setEditingService(null);
                  setIsCreating(false);
                }}
                className="p-1 text-slate-500 hover:text-slate-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. New PAN Card Application (Form 49A)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Govt Identity">Govt Identity</option>
                    <option value="Certificates & Revenue">Certificates & Revenue</option>
                    <option value="Education & Jobs">Education & Jobs</option>
                    <option value="Travel & Identity">Travel & Identity</option>
                    <option value="Transport & RTO">Transport & RTO</option>
                    <option value="Utility & Banking">Utility & Banking</option>
                    <option value="Print & Scan">Print & Scan</option>
                    <option value="General Services">General Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Service Fee (₹ INR) *
                  </label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    min={0}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estimated Processing Turnaround
                </label>
                <input
                  type="text"
                  value={processingTime}
                  onChange={(e) => setProcessingTime(e.target.value)}
                  placeholder="e.g. 2-3 Business Days or Instant"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Explain the service benefits and what is provided..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Application Instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  placeholder="Instructions for customer (e.g. upload clear signature on white paper)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Required Documents Tag Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Required Documents Checklist
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newDocInput}
                    onChange={(e) => setNewDocInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDocToRequirements();
                      }
                    }}
                    placeholder="e.g. Marksheet, Driving License, Photo"
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddDocToRequirements}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {docList.map((doc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-800"
                    >
                      <span>{doc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Status active & FCM Push Notification toggles */}
              <div className="pt-2 space-y-2.5">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="activeToggle"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="activeToggle" className="text-xs text-slate-800 font-semibold cursor-pointer">
                    Publish to Customer Catalogue (Active)
                  </label>
                </div>

                {!editingService && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200">
                    <input
                      type="checkbox"
                      id="notifyCustomersToggle"
                      checked={notifyCustomers}
                      onChange={(e) => setNotifyCustomers(e.target.checked)}
                      className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="notifyCustomersToggle" className="text-xs text-blue-900 font-semibold cursor-pointer flex items-center gap-1.5">
                      <BellRing className="w-3.5 h-3.5 text-blue-600" />
                      <span>Send Instant Push Notification (FCM) to all registered Android & Web customers</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingService(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-md"
                >
                  {saving ? 'Saving...' : editingService ? 'Update Service' : 'Publish & Notify Customers'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-center">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Remove Service?</h3>
            <p className="text-xs text-slate-600 mt-1 mb-5">
              Are you sure you want to remove <strong>{serviceToDelete.name}</strong>? Existing submitted applications will preserve their records.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setServiceToDelete(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
