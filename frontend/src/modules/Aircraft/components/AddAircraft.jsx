import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AddManufacturerModal from "./AddManufacturerModal";
import AddModelModal from "./AddModelModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";


const AddAircraft = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    // Page 1
    id: "",
    tailNumber: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    yearOfManufacture: "",
    // Page 2
    cruisingRange: "",
    mtow: "",
    emptyWeight: "",
    fuelCapacity: "",
    capacity: "",
    // Page 3
    lastMaintenance: "",
    maintenanceSchedule: "",
    totalFlightHours: "",
    maintenanceStatus: "",
    insuranceExpiryDate: "",
    // Page 4
    status: "",
    availability: "",
    type: "Passenger",
    notes: ""
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Manufacturer State
  const [manufacturers, setManufacturers] = useState([]);
  const [showManufacturerModal, setShowManufacturerModal] = useState(false);

  // Model State
  const [models, setModels] = useState({});
  const [showModelModal, setShowModelModal] = useState(false);

  // Loading / Error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const res = await fetch(`${API_URL}/aircraft`);
        if (res.ok) {
          const data = await res.json();
          const loadedManufacturers = new Set();
          const loadedModels = {};

          data.forEach(aircraft => {
            if (aircraft.manufacturer) {
              loadedManufacturers.add(aircraft.manufacturer);
              if (!loadedModels[aircraft.manufacturer]) {
                loadedModels[aircraft.manufacturer] = new Set();
              }
              if (aircraft.model) {
                loadedModels[aircraft.manufacturer].add(aircraft.model);
              }
            }
          });

          setManufacturers(prev => {
            const newSet = new Set([...prev, ...Array.from(loadedManufacturers)]);
            return Array.from(newSet);
          });

          setModels(prev => {
            const newModels = { ...prev };
            Object.keys(loadedModels).forEach(mfg => {
              if (!newModels[mfg]) {
                newModels[mfg] = [];
              }
              const modelSet = new Set([...newModels[mfg], ...Array.from(loadedModels[mfg])]);
              newModels[mfg] = Array.from(modelSet);
            });
            return newModels;
          });
        }
      } catch (err) {
        console.error("Error fetching existing aircraft data:", err);
      }
    };
    fetchExistingData();
  }, []);

  const handleAddManufacturer = (name) => {
    setManufacturers((prev) => [...prev, name]);
  };

  const handleAddModel = (modelName) => {
    const manufacturer = formData.manufacturer;
    if (!manufacturer) {
      alert("Select manufacturer first");
      return;
    }
    setModels((prev) => ({
      ...prev,
      [manufacturer]: [...(prev[manufacturer] || []), modelName]
    }));
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Auto uppercase for ID and tailNumber
    if (name === "id" || name === "tailNumber") {
      value = value.toUpperCase();
    }

    if (name === "manufacturer" && value === "add_new") {
      setShowManufacturerModal(true);
      return;
    }
    if (name === "manufacturer") {
      setFormData((prev) => ({ ...prev, manufacturer: value, model: "" }));
      // Clear errors
      setErrors(prev => ({ ...prev, manufacturer: undefined, model: undefined }));
      return;
    }
    if (name === "model" && value === "add_model") {
      if (!formData.manufacturer) {
        alert("Select manufacturer first");
        return;
      }
      setShowModelModal(true);
      return;
    }

    setFormData({ ...formData, [name]: value });

    // Clear error for the field being typed in
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  };

  const validateField = (name, value) => {
    let error = undefined;
    const currentYear = new Date().getFullYear();

    switch (name) {
      case "id":
        if (!value) error = "ID is required";
        else if (!/^[A-Z0-9]{2,10}$/.test(value)) error = "Alphanumeric, uppercase, no spaces, 2-10 chars";
        break;
      case "tailNumber":
        if (!value) error = "Tail Number is required";
        else if (!/^[A-Z0-9-]+$/.test(value)) error = "Alphanumeric and dash only, uppercase";
        break;
      case "manufacturer":
        if (!value) error = "Manufacturer is required";
        else if (!/^[A-Za-z\s]{2,50}$/.test(value)) error = "Alphabets and space only, 2-50 chars";
        break;
      case "model":
        if (!value) error = "Model is required";
        else if (value.length < 2 || value.length > 50) error = "Min 2, Max 50 chars";
        break;
      case "serialNumber":
        if (!value) error = "Serial Number is required";
        else if (!/^[a-zA-Z0-9]+$/.test(value) || value.length > 30) error = "Alphanumeric only, max 30 chars";
        break;
      case "yearOfManufacture":
        if (!value) error = "Year of Manufacture is required";
        else {
          const num = Number(value);
          if (isNaN(num) || num < 1950 || num > currentYear) error = `Range: 1950 to ${currentYear}`;
        }
        break;
      case "cruisingRange":
        if (!value) error = "Cruising Range is required";
        else {
          const num = Number(value);
          if (isNaN(num) || num < 100 || num > 20000) error = "Range: 100 - 20000";
        }
        break;
      case "mtow":
        if (!value) error = "MTOW is required";
        else if (Number(value) <= 0) error = "Must be a positive number";
        break;
      case "emptyWeight":
        if (!value) error = "Empty Weight is required";
        else {
          const emptyWt = Number(value);
          const maxWt = Number(formData.mtow);
          if (emptyWt <= 0) error = "Must be a positive number";
          else if (formData.mtow && emptyWt >= maxWt) error = "Must be less than MTOW";
        }
        break;
      case "fuelCapacity":
        if (!value) error = "Fuel Capacity is required";
        else if (Number(value) <= 0) error = "Must be a positive number";
        break;
      case "capacity":
        if (!value) error = "Capacity is required";
        else {
          const cap = Number(value);
          if (!Number.isInteger(cap) || cap < 1 || cap > 900) error = "Integer between 1 and 900";
        }
        break;
      case "lastMaintenance":
        if (!value) error = "Last Maintenance Date is required";
        else if (new Date(value) > new Date()) error = "Cannot be a future date";
        break;
      case "maintenanceSchedule":
        if (!value) error = "Maintenance Schedule is required";
        break;
      case "totalFlightHours":
        if (!value && value !== 0) error = "Total Flight Hours is required";
        else if (Number(value) < 0) error = "Cannot be negative";
        break;
      case "maintenanceStatus":
        if (!value) error = "Maintenance Status is required";
        break;
      case "insuranceExpiryDate":
        if (!value) error = "Insurance Expiry Date is required";
        else {
          const expiryDate = new Date(value);
          const today = new Date();
          // Reset time part for accurate comparison
          today.setHours(0, 0, 0, 0);
          if (expiryDate <= today) error = "Must be a future date";
        }
        break;
      case "status":
        if (!value) error = "Status is required";
        break;
      case "availability":
        if (!value) error = "Availability is required";
        break;
      case "type":
        if (!value) error = "Type is required";
        break;
      case "notes":
        if (value && value.length > 500) error = "Max 500 characters";
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error === undefined;
  };

  const validatePage = (pageNumber) => {
    let isValid = true;
    let fieldsToValidate = [];

    switch (pageNumber) {
      case 1:
        fieldsToValidate = ['id', 'tailNumber', 'manufacturer', 'model', 'serialNumber', 'yearOfManufacture'];
        break;
      case 2:
        fieldsToValidate = ['cruisingRange', 'mtow', 'emptyWeight', 'fuelCapacity', 'capacity'];
        break;
      case 3:
        fieldsToValidate = ['lastMaintenance', 'maintenanceSchedule', 'totalFlightHours', 'maintenanceStatus', 'insuranceExpiryDate'];
        break;
      case 4:
        fieldsToValidate = ['status', 'availability', 'type', 'notes'];
        break;
      default:
        break;
    }

    fieldsToValidate.forEach(field => {
      const isFieldValid = validateField(field, formData[field]);
      if (!isFieldValid) isValid = false;
      // Mark as touched so errors show up
      setTouched(prev => ({ ...prev, [field]: true }));
    });

    return isValid;
  };

  const nextStep = () => {
    if (validatePage(step)) {
      setStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    // Validate all pages to be absolutely sure
    const isP1Valid = validatePage(1);
    const isP2Valid = validatePage(2);
    const isP3Valid = validatePage(3);
    const isP4Valid = validatePage(4);

    if (!isP1Valid) { setStep(1); return; }
    if (!isP2Valid) { setStep(2); return; }
    if (!isP3Valid) { setStep(3); return; }
    if (!isP4Valid) { setStep(4); return; }

    setIsSubmitting(true);
    setErrorDetails(null);

    // Business validations (extra check before sub)
    if (Number(formData.emptyWeight) >= Number(formData.mtow)) {
      setErrors(prev => ({ ...prev, emptyWeight: "Must be less than MTOW" }));
      setStep(2);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/aircraft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        navigate("/aircraft");
      } else {
        const result = await response.json();
        const errMessage = result.error || "Failed to add aircraft";
        setErrorDetails(errMessage);

        // Handle unique constraint violations heuristically
        if (errMessage.toLowerCase().includes("id")) {
          setErrors(prev => ({ ...prev, id: "ID must be unique" }));
          setStep(1);
        } else if (errMessage.toLowerCase().includes("tail")) {
          setErrors(prev => ({ ...prev, tailNumber: "Tail Number must be unique" }));
          setStep(1);
        } else if (errMessage.toLowerCase().includes("serial")) {
          setErrors(prev => ({ ...prev, serialNumber: "Serial Number must be unique" }));
          setStep(1);
        }
      }
    } catch (error) {
      setErrorDetails("Network error occurred.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 text-slate-900 dark:text-white max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-6 space-x-4">
        <button
          onClick={() => navigate("/aircraft")}
          className="text-sm text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
        >
          ΓåÉ Back
        </button>
        <h1 className="text-2xl font-bold">Add New Aircraft</h1>
      </div>

      {/* Wizard Progress */}
      <div className="flex space-x-2 mb-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl items-center text-sm font-medium">
        <div className={`px-4 py-2 rounded-lg ${step === 1 ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>1. Basic Info</div>
        <span className="text-slate-400 dark:text-gray-600">ßÉ│</span>
        <div className={`px-4 py-2 rounded-lg ${step === 2 ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>2. Performance</div>
        <span className="text-slate-400 dark:text-gray-600">ßÉ│</span>
        <div className={`px-4 py-2 rounded-lg ${step === 3 ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>3. Maintenance</div>
        <span className="text-slate-400 dark:text-gray-600">ßÉ│</span>
        <div className={`px-4 py-2 rounded-lg ${step === 4 ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>4. Operational</div>
      </div>

      {errorDetails && (
        <div className="mb-4 p-3 bg-red-500/20 text-red-500 dark:text-red-400 rounded-lg border border-red-500/30">
          {errorDetails}
        </div>
      )}

      {/* Pages */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">

        {/* Page 1: Basic Identification */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-lg font-semibold border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 text-blue-600 dark:text-blue-400">Basic Identification</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Aircraft ID (Internal)*</label>
                <input
                  name="id"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.id && touched.id ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.id}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g., A01"
                />
                {errors.id && touched.id && <span className="text-xs text-red-500 mt-1 block">{errors.id}</span>}
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Registration / Tail Number*</label>
                <input
                  name="tailNumber"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.tailNumber && touched.tailNumber ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.tailNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g., VT-ABC or N12345"
                />
                {errors.tailNumber && touched.tailNumber && <span className="text-xs text-red-500 mt-1 block">{errors.tailNumber}</span>}
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Manufacturer*</label>
                <select
                  name="manufacturer"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.manufacturer && touched.manufacturer ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.manufacturer}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="">Select Manufacturer</option>
                  {manufacturers.map((m, i) => <option key={i} value={m}>{m}</option>)}
                  <option value="add_new">+ Add New Manufacturer</option>
                </select>
                {errors.manufacturer && touched.manufacturer && <span className="text-xs text-red-500 mt-1 block">{errors.manufacturer}</span>}
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Model*</label>
                <select
                  name="model"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.model && touched.model ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.model}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="">Select Model</option>
                  {(models[formData.manufacturer] || []).map((m, i) => <option key={i} value={m}>{m}</option>)}
                  <option value="add_model">+ Add New Model</option>
                </select>
                {errors.model && touched.model && <span className="text-xs text-red-500 mt-1 block">{errors.model}</span>}
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Serial Number*</label>
                <input
                  name="serialNumber"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.serialNumber && touched.serialNumber ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.serialNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g., SN10002"
                />
                {errors.serialNumber && touched.serialNumber && <span className="text-xs text-red-500 mt-1 block">{errors.serialNumber}</span>}
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Year of Manufacture*</label>
                <input
                  type="number"
                  name="yearOfManufacture"
                  min="1950"
                  max={new Date().getFullYear()}
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.yearOfManufacture && touched.yearOfManufacture ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.yearOfManufacture}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g., 2018"
                />
                {errors.yearOfManufacture && touched.yearOfManufacture && <span className="text-xs text-red-500 mt-1 block">{errors.yearOfManufacture}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Page 2: Performance & Capacity */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-lg font-semibold border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 text-blue-600 dark:text-blue-400">Performance & Capacity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Cruising Range (NM)*</label>
                <input
                  type="number"
                  name="cruisingRange"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.cruisingRange && touched.cruisingRange ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.cruisingRange}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="100 - 20000"
                />
                {errors.cruisingRange && touched.cruisingRange && <span className="text-xs text-red-500 mt-1 block">{errors.cruisingRange}</span>}
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Max Take-Off Weight (lbs)*</label>
                <input
                  type="number"
                  name="mtow"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.mtow && touched.mtow ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.mtow}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.mtow && touched.mtow && <span className="text-xs text-red-500 mt-1 block">{errors.mtow}</span>}
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Empty Weight (lbs)*</label>
                <input
                  type="number"
                  name="emptyWeight"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.emptyWeight && touched.emptyWeight ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.emptyWeight}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.emptyWeight && touched.emptyWeight && <span className="text-xs text-red-500 mt-1 block">{errors.emptyWeight}</span>}
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Fuel Capacity (Gallons)*</label>
                <input
                  type="number"
                  name="fuelCapacity"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.fuelCapacity && touched.fuelCapacity ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.fuelCapacity}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.fuelCapacity && touched.fuelCapacity && <span className="text-xs text-red-500 mt-1 block">{errors.fuelCapacity}</span>}
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Default Seats / Capacity*</label>
                <input
                  type="number"
                  name="capacity"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.capacity && touched.capacity ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.capacity}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.capacity && touched.capacity && <span className="text-xs text-red-500 mt-1 block">{errors.capacity}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Page 3: Maintenance & Compliance */}
        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
              <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Maintenance & Compliance</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Total Flight Hours*</label>
                <input
                  type="number"
                  step="0.1"
                  name="totalFlightHours"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.totalFlightHours && touched.totalFlightHours ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.totalFlightHours}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.totalFlightHours && touched.totalFlightHours && <span className="text-xs text-red-500 mt-1 block">{errors.totalFlightHours}</span>}
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Last Maintenance Date*</label>
                <input
                  type="date"
                  name="lastMaintenance"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.lastMaintenance && touched.lastMaintenance ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.lastMaintenance}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.lastMaintenance && touched.lastMaintenance && <span className="text-xs text-red-500 mt-1 block">{errors.lastMaintenance}</span>}
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Maintenance Schedule*</label>
                <select
                  name="maintenanceSchedule"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.maintenanceSchedule && touched.maintenanceSchedule ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.maintenanceSchedule}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="">Select Schedule</option>
                  <option value="50 hours">50 hours</option>
                  <option value="100 hours">100 hours</option>
                  <option value="Annual">Annual</option>
                </select>
                {errors.maintenanceSchedule && touched.maintenanceSchedule && <span className="text-xs text-red-500 mt-1 block">{errors.maintenanceSchedule}</span>}
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Maintenance Status*</label>
                <select
                  name="maintenanceStatus"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.maintenanceStatus && touched.maintenanceStatus ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.maintenanceStatus}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="">Select Status</option>
                  <option value="OK">OK</option>
                  <option value="Due">Due</option>
                  <option value="Overdue">Overdue</option>
                </select>
                {errors.maintenanceStatus && touched.maintenanceStatus && <span className="text-xs text-red-500 mt-1 block">{errors.maintenanceStatus}</span>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Insurance Expiry Date*</label>
                <input
                  type="date"
                  name="insuranceExpiryDate"
                  className={`w-full md:w-1/2 bg-slate-50 dark:bg-slate-900 border ${errors.insuranceExpiryDate && touched.insuranceExpiryDate ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.insuranceExpiryDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.insuranceExpiryDate && touched.insuranceExpiryDate && <span className="text-xs text-red-500 mt-1 block">{errors.insuranceExpiryDate}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Page 4: Operational & Financial */}
        {step === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-lg font-semibold border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 text-blue-600 dark:text-blue-400">Operational & Financial</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Status*</label>
                <select
                  name="status"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.status && touched.status ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.status}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="">Select Global Status</option>
                  <option value="Active">Active</option>
                  <option value="In Maintenance">In Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {errors.status && touched.status && <span className="text-xs text-red-500 mt-1 block">{errors.status}</span>}
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Availability*</label>
                <select
                  name="availability"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.availability && touched.availability ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.availability}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="">Select Availability</option>
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Reserved">Reserved</option>
                </select>
                {errors.availability && touched.availability && <span className="text-xs text-red-500 mt-1 block">{errors.availability}</span>}
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Type*</label>
                <select
                  name="type"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.type && touched.type ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.type}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="Passenger">Passenger</option>
                  <option value="Cargo">Cargo</option>
                  <option value="Training">Training</option>
                  <option value="Helicopter">Helicopter</option>
                </select>
                {errors.type && touched.type && <span className="text-xs text-red-500 mt-1 block">{errors.type}</span>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows={4}
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.notes && touched.notes ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors`}
                  value={formData.notes}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Additional details..."
                />
                {errors.notes && touched.notes && <span className="text-xs text-red-500 mt-1 block">{errors.notes}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <button
            onClick={prevStep}
            className={`px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'hover:bg-slate-700'}`}
          >
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={nextStep}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Aircraft Details"}
            </button>
          )}
        </div>
      </div>

      {showManufacturerModal && (
        <AddManufacturerModal
          onClose={() => setShowManufacturerModal(false)}
          onAdd={handleAddManufacturer}
        />
      )}

      {showModelModal && (
        <AddModelModal
          onClose={() => setShowModelModal(false)}
          onAdd={handleAddModel}
        />
      )}
    </div>
  );
};

export default AddAircraft;
