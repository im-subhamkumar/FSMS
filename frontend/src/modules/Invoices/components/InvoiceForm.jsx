// T3 — InvoiceForm component
// Create or Edit invoice with dynamic line items & Student drop-down
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Loader, Tag } from 'lucide-react';
import { useInvoices } from '../hooks/useInvoices';

const EMPTY_ITEM = { catalogId: 'custom', description: '', quantity: 1, unitPrice: '' };

const fmt = (val) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(parseFloat(val) || 0);

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { createInvoice, getInvoice, updateInvoice } = useInvoices();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [students, setStudents] = useState([]);
  const [pricingRates, setPricingRates] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [issuedById, setIssuedById] = useState(''); // Backend will auto-resolve to Admin
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  useEffect(() => {
    (async () => {
      try {
        const studentsUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/students` : `http://${window.location.hostname}:3000/api/students`;
        const pricingUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/pricing-rates` : `http://${window.location.hostname}:3000/api/pricing-rates`;
        
        const [studentsRes, pricingRes] = await Promise.all([
          fetch(studentsUrl),
          fetch(pricingUrl)
        ]);
        
        const studentsData = await studentsRes.json();
        const pricingData = await pricingRes.json();
        
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setPricingRates(Array.isArray(pricingData) ? pricingData : []);

        if (isEdit) {
          const inv = await getInvoice(id);
          setStudentId(String(inv.studentId));
          setIssuedById(String(inv.issuedById));
          setDueDate(inv.dueDate ? inv.dueDate.split('T')[0] : '');
          setNotes(inv.notes || '');
          setItems(
            inv.items.length > 0
              ? inv.items.map(it => {
                  let matchedId = 'custom';
                  if (Array.isArray(pricingData)) {
                    const match = pricingData.find(r => 
                      r.name === it.description || it.description.includes(r.name) || r.name.includes(it.description)
                    );
                    if (match) matchedId = String(match.id);
                  }
                  return {
                    catalogId: matchedId,
                    description: it.description,
                    quantity: it.quantity,
                    unitPrice: parseFloat(it.unitPrice),
                  };
                })
              : [{ ...EMPTY_ITEM }]
          );
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    ));
  };

  const handleCatalogChange = (idx, value) => {
    if (value === 'custom') {
      setItems(prev => prev.map((it, i) => i === idx ? { ...it, catalogId: 'custom', description: '' } : it));
    } else {
      const rate = pricingRates.find(r => String(r.id) === value);
      if (rate) {
        setItems(prev => prev.map((it, i) => i === idx ? {
          ...it,
          catalogId: value,
          description: rate.name,
          unitPrice: rate.amount
        } : it));
      }
    }
  };

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const lineTotal = (item) => (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
  const grandTotal = items.reduce((s, item) => s + lineTotal(item), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId) return setError('Please select a student');
    if (items.some(it => !it.description || !it.unitPrice)) {
      return setError('All line items must have a description and unit price');
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        studentId: parseInt(studentId),
        issuedById: parseInt(issuedById),
        dueDate: dueDate || null,
        notes: notes || null,
        items: items.map(it => ({
          description: it.description,
          quantity: parseInt(it.quantity) || 1,
          unitPrice: parseFloat(it.unitPrice) || 0,
        })),
      };

      if (isEdit) {
        await updateInvoice(id, payload);
      } else {
        const created = await createInvoice(payload);
        navigate(`/invoices/${created.id}`);
        return;
      }
      navigate(`/invoices/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse max-w-4xl mx-auto mt-4">
        <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    );
  }

  // Pre-calculate grouped pricing rates for the dropdowns
  const categories = ["COURSE_FEE", "AIRCRAFT_RENTAL", "INSTRUCTOR_FEE", "EXAM_FEE", "OTHER"];

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto pb-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Invoice' : 'Create New Invoice'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Billing Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Billing Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Student <span className="text-red-500">*</span>
              </label>
              <select
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                disabled={isEdit}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:text-gray-200 disabled:opacity-60 transition-all"
              >
                <option value="">Select a student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.studentId})
                  </option>
                ))}
              </select>
              {isEdit && <p className="text-[10px] text-gray-400">Student cannot be changed.</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:text-gray-200 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Notes & Terms</label>
              <textarea
                rows={2}
                placeholder="E.g. Pay within 7 days..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:text-gray-200 resize-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Line Items Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Line Items
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 mb-2 px-0.5">
            <span className="col-span-5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Product / Service</span>
            <span className="col-span-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Qty</span>
            <span className="col-span-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Unit Price</span>
            <span className="col-span-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right pr-1">Total</span>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 mb-3 items-center group">
              {/* Product/Service column */}
              <div className="col-span-5">
                {item.catalogId === 'custom' ? (
                  <>
                    <select
                      value={item.catalogId}
                      onChange={e => handleCatalogChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-blue-50/50 dark:bg-blue-900/10 text-xs text-blue-900 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium transition-all mb-1.5"
                    >
                      <option value="custom">-- Custom Item --</option>
                      {categories.map(cat => {
                        const rates = pricingRates.filter(r => r.category === cat);
                        if (rates.length === 0) return null;
                        return (
                          <optgroup key={cat} label={cat.replace('_', ' ')}>
                            {rates.map(r => (
                              <option key={r.id} value={String(r.id)}>
                                {r.name}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                    <input
                      type="text"
                      placeholder="Enter description..."
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-gray-200 transition-all"
                    />
                  </>
                ) : (
                  <select
                    value={item.catalogId}
                    onChange={e => handleCatalogChange(idx, e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-blue-50/50 dark:bg-blue-900/10 text-xs text-blue-900 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium transition-all"
                  >
                    <option value="custom">-- Custom Item --</option>
                    {categories.map(cat => {
                      const rates = pricingRates.filter(r => r.category === cat);
                      if (rates.length === 0) return null;
                      return (
                        <optgroup key={cat} label={cat.replace('_', ' ')}>
                          {rates.map(r => (
                            <option key={r.id} value={String(r.id)}>
                              {r.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                )}
              </div>
              
              {/* Quantity */}
              <div className="col-span-2">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={e => updateItem(idx, 'quantity', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-gray-200 transition-all"
                />
              </div>

              {/* Unit Price */}
              <div className="col-span-3 flex items-center">
                <span className="text-gray-400 text-xs px-1">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={item.unitPrice}
                  onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-gray-200 transition-all ${
                    item.catalogId !== 'custom' ? 'bg-gray-100 dark:bg-gray-800/50' : 'bg-gray-50 dark:bg-gray-900'
                  }`}
                />
              </div>

              {/* Line Total + Delete */}
              <div className="col-span-2 flex items-center justify-between pl-0.5">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-right flex-1">
                  ₹{fmt(lineTotal(item))}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="ml-1.5 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Grand Total */}
          <div className="border-t border-gray-100 dark:border-gray-700 mt-3 pt-3 flex justify-end">
            <div className="flex items-center gap-6">
              <span className="text-xs font-bold text-gray-500 uppercase">Grand Total</span>
              <span className="text-lg font-black text-gray-900 dark:text-white">₹{fmt(grandTotal)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="px-5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm shadow-blue-500/20 disabled:opacity-70 transition-all active:scale-95"
          >
            {saving && <Loader className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : isEdit ? 'Submit Updates' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
