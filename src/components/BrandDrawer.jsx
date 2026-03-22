import { useState, useEffect } from 'react';
import { useCampaigns } from '../context/CampaignContext';
import { X, Trash2, Palette } from 'lucide-react';

const BRAND_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#10b981', '#14b8a6', '#3b82f6', '#06b6d4',
];

const BRAND_EMOJIS = [
  '🚀', '💎', '🏆', '⭐', '🔥', '🌟', '💡', '🎯', '👗', '🌿',
  '🍕', '🏠', '🎨', '📱', '🛒', '🏥', '✈️', '🎓', '🎵', '🐾',
];

const emptyBrand = {
  name: '',
  logo: '🚀',
  color: '#6366f1',
  description: '',
};

export default function BrandDrawer() {
  const { state, dispatch } = useCampaigns();
  const { brandDrawerOpen, editingBrand } = state;
  const [form, setForm] = useState(emptyBrand);

  useEffect(() => {
    if (editingBrand) {
      setForm({ ...emptyBrand, ...editingBrand });
    } else if (brandDrawerOpen) {
      setForm(emptyBrand);
    }
  }, [editingBrand, brandDrawerOpen]);

  if (!brandDrawerOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingBrand) {
      dispatch({ type: 'UPDATE_BRAND', payload: { ...editingBrand, ...form } });
    } else {
      dispatch({ type: 'ADD_BRAND', payload: form });
    }
  };

  const handleDelete = () => {
    if (editingBrand) {
      dispatch({ type: 'DELETE_BRAND', payload: editingBrand.id });
    }
  };

  const handleClose = () => {
    dispatch({ type: 'CLOSE_BRAND_DRAWER' });
  };

  return (
    <>
      <div className="modal-overlay" onClick={handleClose} />
      <div className="modal-container modal-sm">
        <div className="modal-content">
          <div className="modal-header">
            <h2>{editingBrand ? '✏️ Chỉnh Sửa Brand' : '🏢 Thêm Brand Mới'}</h2>
            <button className="drawer-close" onClick={handleClose}>
              <X size={18} />
            </button>
          </div>

          <div className="modal-body" style={{ display: 'block' }}>
            <div className="modal-col" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              {/* Brand Name */}
              <div className="form-group">
                <label className="form-label">Tên Brand</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="VD: TechViet, FashionHub..."
                />
              </div>

              {/* Icon / Emoji */}
              <div className="form-group">
                <label className="form-label">Icon</label>
                <div className="brand-emoji-grid">
                  {BRAND_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      className={`brand-emoji-btn ${form.logo === emoji ? 'active' : ''}`}
                      onClick={() => handleChange('logo', emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="form-group">
                <label className="form-label">
                  <Palette size={12} style={{ marginRight: 4 }} />
                  Màu Brand
                </label>
                <div className="brand-color-grid">
                  {BRAND_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`brand-color-btn ${form.color === color ? 'active' : ''}`}
                      style={{ background: color }}
                      onClick={() => handleChange('color', color)}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="form-group">
                <label className="form-label">Preview</label>
                <div
                  className="brand-preview"
                  style={{ borderColor: form.color + '40', background: form.color + '10' }}
                >
                  <div className="brand-preview-icon" style={{ background: form.color + '20', color: form.color }}>
                    {form.logo}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                      {form.name || 'Tên brand...'}
                    </div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                      {form.description || 'Mô tả brand...'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Mô Tả</label>
                <textarea
                  className="form-textarea"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Mô tả ngắn về brand..."
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            {editingBrand && (
              <button className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={14} />
                Xóa Brand
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button className="btn" onClick={handleClose}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              {editingBrand ? 'Lưu Thay Đổi' : 'Tạo Brand'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
