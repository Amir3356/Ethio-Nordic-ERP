import { useState, useMemo } from 'react';
import { Plus, X, Edit2 } from 'lucide-react';
import { inventoryAPI } from '../../services/inventory';
import type { useInventory } from './hooks';
import type { Warehouse } from './types';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

const initialForm = {
  warehouse_code: '',
  warehouse_name: '',
  location: '',
  warehouse_type: 'standard',
  capacity: '',
  status: 'active',
};

export default function WarehouseManagement({ inventory }: Props) {
  const { data, refetch } = inventory;
  const [showForm, setShowForm] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const warehouses = useMemo(() => {
    if (!data) return [];
    return data.warehouses.filter((w) =>
      w.warehouse_name.toLowerCase().includes(search.toLowerCase()) ||
      w.warehouse_code.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const openCreate = () => {
    setEditWarehouse(null);
    setForm(initialForm);
    setShowForm(true);
    setError('');
  };

  const openEdit = (warehouse: Warehouse) => {
    setEditWarehouse(warehouse);
    setForm({
      warehouse_code: warehouse.warehouse_code,
      warehouse_name: warehouse.warehouse_name,
      location: warehouse.location,
      warehouse_type: warehouse.warehouse_type,
      capacity: String(warehouse.capacity),
      status: warehouse.status,
    });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        warehouse_code: form.warehouse_code,
        warehouse_name: form.warehouse_name,
        location: form.location,
        warehouse_type: form.warehouse_type,
        capacity: Number(form.capacity) || 0,
        status: form.status,
      };

      if (editWarehouse) {
        await inventoryAPI.updateWarehouse(String(editWarehouse.warehouse_id), payload);
      } else {
        await inventoryAPI.createWarehouse(payload);
      }
      setShowForm(false);
      setForm(initialForm);
      setEditWarehouse(null);
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Failed to save warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) return null;

  return (
    <section className="content-section" id="warehouses">
      <div className="content-section-header">
        <h2>Warehouse Management</h2>
      </div>

      <p className="content-description">
        Manage warehouse and storage location master data.
      </p>

      <div className="inv-toolbar">
        <div className="inv-search">
          <input
            type="text"
            placeholder="Search warehouses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="inv-btn inv-btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Warehouse
        </button>
      </div>

      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Location</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((warehouse) => (
              <tr key={warehouse.warehouse_id}>
                <td className="inv-table-name">{warehouse.warehouse_code}</td>
                <td>{warehouse.warehouse_name}</td>
                <td>{warehouse.location}</td>
                <td>
                  <span className="inv-badge inv-badge-blue">{warehouse.warehouse_type}</span>
                </td>
                <td>{Number(warehouse.capacity).toLocaleString()}</td>
                <td>
                  <span className={`inv-badge ${warehouse.status === 'active' ? 'inv-badge-green' : 'inv-badge-gray'}`}>
                    {warehouse.status}
                  </span>
                </td>
                <td>
                  <button className="inv-btn-icon" onClick={() => openEdit(warehouse)}>
                    <Edit2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {warehouses.length === 0 && (
              <tr><td colSpan={7} className="inv-empty">No warehouses found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="inv-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>{editWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}</h3>
              <button className="inv-modal-close" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="inv-form">
              {error && <div className="inv-form-error">{error}</div>}
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Warehouse Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH-001"
                    value={form.warehouse_code}
                    onChange={(e) => setForm({ ...form, warehouse_code: e.target.value })}
                  />
                </div>
                <div className="inv-form-group">
                  <label>Warehouse Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter warehouse name"
                    value={form.warehouse_name}
                    onChange={(e) => setForm({ ...form, warehouse_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="inv-form-group">
                <label>Location</label>
                <input
                  type="text"
                  required
                  placeholder="Address or location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Warehouse Type</label>
                  <select value={form.warehouse_type} onChange={(e) => setForm({ ...form, warehouse_type: e.target.value })}>
                    <option value="standard">Standard</option>
                    <option value="cold_storage">Cold Storage</option>
                    <option value="hazmat">Hazmat</option>
                    <option value="bonded">Bonded</option>
                    <option value="distribution">Distribution Center</option>
                  </select>
                </div>
                <div className="inv-form-group">
                  <label>Capacity (units)</label>
                  <input
                    type="number"
                    placeholder="Maximum capacity"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  />
                </div>
              </div>
              <div className="inv-form-group">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </div>
              <div className="inv-form-actions">
                <button type="button" className="inv-btn inv-btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="inv-btn inv-btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
