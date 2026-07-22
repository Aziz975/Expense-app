import { useState } from 'react';
import { toast } from 'react-toastify';
import { ScanLine, Loader2, Check, Upload } from 'lucide-react';
import Modal from './Modal';
import { aiAPI } from '../services/api';
import { EXPENSE_CATEGORIES } from '../utils/constants';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = String(result).split(',')[1] || String(result);
      resolve({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ReceiptScanner = ({ isOpen, onClose, onCreated }) => {
  const [scanning, setScanning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState(null);

  const reset = () => {
    setPreview(null);
    setForm(null);
    setScanning(false);
    setConfirming(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.');
      return;
    }

    setPreview(URL.createObjectURL(file));
    setScanning(true);
    setForm(null);

    try {
      const { base64, mimeType } = await fileToBase64(file);
      const { data } = await aiAPI.scanReceipt({ image: base64, mimeType });
      const extracted = data.data;
      setForm({
        amount: extracted.amount || '',
        category: extracted.category || 'Other',
        description: extracted.description || extracted.merchantName || '',
        date: extracted.date?.slice?.(0, 10) || new Date().toISOString().slice(0, 10),
        merchantName: extracted.merchantName || '',
      });
      toast.success('Receipt scanned. Review and confirm.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to scan receipt.');
      setPreview(null);
    } finally {
      setScanning(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setConfirming(true);
    try {
      await aiAPI.confirmReceipt(form);
      toast.success('Expense created from receipt.');
      onCreated?.();
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create expense.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI Receipt Scanner">
      <div className="space-y-4">
        <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors">
          <Upload className="w-8 h-8 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">Upload receipt image</span>
          <span className="text-xs text-gray-400">JPEG, PNG, WebP · max 5MB</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>

        {preview && (
          <img src={preview} alt="Receipt preview" className="w-full max-h-40 object-contain rounded-lg border border-gray-200 dark:border-gray-700" />
        )}

        {scanning && (
          <div className="flex items-center justify-center gap-2 py-4 text-indigo-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Scanning receipt with AI...</span>
          </div>
        )}

        {form && (
          <form onSubmit={handleConfirm} className="space-y-3">
            {form.merchantName && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <ScanLine className="w-3.5 h-3.5" /> Merchant: {form.merchantName}
              </p>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={confirming}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg font-medium"
            >
              {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirm & Create Expense
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default ReceiptScanner;
