import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { itemApi, receiptApi } from '@/utils/api';
import { Item, CreateReceiptRequest, CreateReceiptItemRequest } from '@/types';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, Send } from 'lucide-react';

const ReceiptCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [receiptData, setReceiptData] = useState<CreateReceiptRequest>({
    receipt_date: new Date().toISOString().split('T')[0],
    challan_number: '',
    challan_date: new Date().toISOString().split('T')[0],
    supplier_name: '',
    vehicle_number: '',
    items: [],
    remarks: ''
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await itemApi.getAll({ is_active: true });
      setItems(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load items');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReceiptData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addItem = () => {
    setReceiptData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_id: '',
          challan_quantity: 0,
          received_quantity: 0,
          unit_rate: 0,
          condition_notes: ''
        }
      ]
    }));
  };

  const removeItem = (index: number) => {
    setReceiptData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof CreateReceiptItemRequest, value: any) => {
    setReceiptData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSaveDraft = async () => {
    try {
      setIsLoading(true);

      if (!validateForm()) {
        return;
      }

      const response = await receiptApi.create(receiptData);
      toast.success('Receipt saved as draft');
      navigate(`/receipts/${response.data.data?.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save receipt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      if (!validateForm()) {
        return;
      }

      const response = await receiptApi.create(receiptData);
      const receiptId = response.data.data?.id;

      if (receiptId) {
        await receiptApi.submit(receiptId);
        toast.success('Receipt submitted for verification');
        navigate(`/receipts/${receiptId}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit receipt');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!receiptData.challan_number.trim()) {
      toast.error('Challan number is required');
      return false;
    }

    if (!receiptData.supplier_name.trim()) {
      toast.error('Supplier name is required');
      return false;
    }

    if (receiptData.items.length === 0) {
      toast.error('At least one item is required');
      return false;
    }

    for (let i = 0; i < receiptData.items.length; i++) {
      const item = receiptData.items[i];
      if (!item.item_id) {
        toast.error(`Item ${i + 1}: Please select an item`);
        return false;
      }

      if (item.challan_quantity <= 0) {
        toast.error(`Item ${i + 1}: Challan quantity must be greater than 0`);
        return false;
      }

      if (item.received_quantity < 0) {
        toast.error(`Item ${i + 1}: Received quantity cannot be negative`);
        return false;
      }

      if (item.unit_rate < 0) {
        toast.error(`Item ${i + 1}: Unit rate cannot be negative`);
        return false;
      }
    }

    return true;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-lg font-medium text-gray-900">
            Create Stock Receipt
          </h1>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="receipt_date" className="block text-sm font-medium text-gray-700">
                Receipt Date
              </label>
              <input
                type="date"
                id="receipt_date"
                name="receipt_date"
                value={receiptData.receipt_date}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label htmlFor="challan_number" className="block text-sm font-medium text-gray-700">
                Challan/Invoice Number *
              </label>
              <input
                type="text"
                id="challan_number"
                name="challan_number"
                value={receiptData.challan_number}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter challan number"
                required
              />
            </div>

            <div>
              <label htmlFor="challan_date" className="block text-sm font-medium text-gray-700">
                Challan Date
              </label>
              <input
                type="date"
                id="challan_date"
                name="challan_date"
                value={receiptData.challan_date}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                max={receiptData.receipt_date}
              />
            </div>

            <div>
              <label htmlFor="supplier_name" className="block text-sm font-medium text-gray-700">
                Supplier/Head Office *
              </label>
              <input
                type="text"
                id="supplier_name"
                name="supplier_name"
                value={receiptData.supplier_name}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter supplier name"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="vehicle_number" className="block text-sm font-medium text-gray-700">
                Vehicle Number
              </label>
              <input
                type="text"
                id="vehicle_number"
                name="vehicle_number"
                value={receiptData.vehicle_number}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter vehicle number (optional)"
              />
            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>

            {receiptData.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items added yet. Click "Add Item" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {receiptData.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item *
                        </label>
                        <select
                          value={item.item_id}
                          onChange={(e) => updateItem(index, 'item_id', e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        >
                          <option value="">Select an item</option>
                          {items.map((itemOption) => (
                            <option key={itemOption.id} value={itemOption.id}>
                              {itemOption.item_code} - {itemOption.nomenclature}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Challan Quantity *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.challan_quantity}
                          onChange={(e) => updateItem(index, 'challan_quantity', parseFloat(e.target.value) || 0)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Received Quantity *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.received_quantity}
                          onChange={(e) => updateItem(index, 'received_quantity', parseFloat(e.target.value) || 0)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit Rate *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_rate}
                          onChange={(e) => updateItem(index, 'unit_rate', parseFloat(e.target.value) || 0)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Condition Notes
                        </label>
                        <input
                          type="text"
                          value={item.condition_notes}
                          onChange={(e) => updateItem(index, 'condition_notes', e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Enter condition notes (optional)"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="inline-flex items-center p-2 border border-transparent rounded-md text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {item.challan_quantity > 0 && item.received_quantity > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Variance: <span className={item.received_quantity - item.challan_quantity >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {item.received_quantity - item.challan_quantity >= 0 ? '+' : ''}
                          {(item.received_quantity - item.challan_quantity).toFixed(2)}
                        </span>
                        {item.unit_rate > 0 && (
                          <span className="ml-4">
                            Total Value: ₹{(item.received_quantity * item.unit_rate).toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
              Remarks
            </label>
            <textarea
              id="remarks"
              name="remarks"
              rows={3}
              value={receiptData.remarks}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter any additional remarks (optional)"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptCreate;
