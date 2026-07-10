import { useState, useMemo } from 'react';
import { Plus, X, Edit2 } from 'lucide-react';
import { inventoryAPI } from '../../services/inventory';
import type { useInventory } from './hooks';
import type { Product } from './types';

type InventoryHook = ReturnType<typeof useInventory>;

interface Props {
  inventory: InventoryHook;
}

const initialForm = {
  product_code: '',
  product_name: '',
  description: '',
  category_id: '',
  unit_of_measure: 'pcs',
  requires_batch_tracking: true,
  requires_expiry_tracking: true,
  status: 'active',
};

export default function ProductManagement({ inventory }: Props) {
  const { data, refetch } = inventory;
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const products = useMemo(() => {
    if (!data) return [];
    return data.products.filter((p) =>
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      p.product_code.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const openCreate = () => {
    setEditProduct(null);
    setForm(initialForm);
    setShowForm(true);
    setError('');
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      product_code: product.product_code,
      product_name: product.product_name,
      description: product.description || '',
      category_id: product.category_id ? String(product.category_id) : '',
      unit_of_measure: product.unit_of_measure,
      requires_batch_tracking: product.requires_batch_tracking,
      requires_expiry_tracking: product.requires_expiry_tracking,
      status: product.status,
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
        product_code: form.product_code,
        product_name: form.product_name,
        description: form.description || null,
        category_id: form.category_id || null,
        unit_of_measure: form.unit_of_measure,
        requires_batch_tracking: form.requires_batch_tracking,
        requires_expiry_tracking: form.requires_expiry_tracking,
        status: form.status,
      };

      if (editProduct) {
        await inventoryAPI.updateProduct(String(editProduct.product_id), payload);
      } else {
        await inventoryAPI.createProduct(payload);
      }
      setShowForm(false);
      setForm(initialForm);
      setEditProduct(null);
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) return null;

  return (
    <section className="content-section" id="products">
      <div className="content-section-header">
        <h2>Product Management</h2>
      </div>

      <p className="content-description">
        Manage the master product catalog. Products linked to PIM module.
      </p>

      <div className="inv-toolbar">
        <div className="inv-search">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="inv-btn inv-btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Unit</th>
              <th>Batch Tracked</th>
              <th>Expiry Tracked</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.product_id}>
                <td className="inv-table-name">{product.product_code}</td>
                <td>{product.product_name}</td>
                <td>{product.unit_of_measure}</td>
                <td>
                  {product.requires_batch_tracking ? (
                    <span className="inv-badge inv-badge-green">Yes</span>
                  ) : (
                    <span className="inv-badge inv-badge-gray">No</span>
                  )}
                </td>
                <td>
                  {product.requires_expiry_tracking ? (
                    <span className="inv-badge inv-badge-green">Yes</span>
                  ) : (
                    <span className="inv-badge inv-badge-gray">No</span>
                  )}
                </td>
                <td>
                  <span className={`inv-badge ${product.status === 'active' ? 'inv-badge-green' : 'inv-badge-gray'}`}>
                    {product.status}
                  </span>
                </td>
                <td>
                  <button className="inv-btn-icon" onClick={() => openEdit(product)}>
                    <Edit2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={7} className="inv-empty">No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="inv-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>{editProduct ? 'Edit Product' : 'Add Product'}</h3>
              <button className="inv-modal-close" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="inv-form">
              {error && <div className="inv-form-error">{error}</div>}
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Product Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PRD-001"
                    value={form.product_code}
                    onChange={(e) => setForm({ ...form, product_code: e.target.value })}
                  />
                </div>
                <div className="inv-form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter product name"
                    value={form.product_name}
                    onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="inv-form-group">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Optional description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Unit of Measure</label>
                  <select value={form.unit_of_measure} onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })}>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="l">Liters (L)</option>
                    <option value="ml">Milliliters (mL)</option>
                    <option value="box">Box</option>
                    <option value="carton">Carton</option>
                    <option value="pallet">Pallet</option>
                  </select>
                </div>
                <div className="inv-form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={form.requires_batch_tracking}
                      onChange={(e) => setForm({ ...form, requires_batch_tracking: e.target.checked })}
                    />
                    {' '}Requires Batch Tracking
                  </label>
                </div>
                <div className="inv-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={form.requires_expiry_tracking}
                      onChange={(e) => setForm({ ...form, requires_expiry_tracking: e.target.checked })}
                    />
                    {' '}Requires Expiry Tracking
                  </label>
                </div>
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
