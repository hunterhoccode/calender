import { useState, useEffect, useRef, useCallback } from 'react';
import { useCampaigns } from '../contexts/CampaignContext';
import { useAuth } from '../contexts/AuthContext';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { CATEGORIES, CHANNELS, getCategoryColor } from '../utils/dateUtils';
import DatePicker from './DatePicker';
import { X, Plus, Trash2, Calendar, MessageCircle, Target, DollarSign, Milestone, Building2, ImagePlus, XCircle, FileText, Bold, Italic, List, ListOrdered, Heading2, Heading3, Quote, Minus, Link, AlertTriangle } from 'lucide-react';

const emptyForm = {
  name: '',
  category: 'big-campaign',
  brandId: '',
  startDate: '',
  endDate: '',
  keyMessage: '',
  budget: '',
  channels: [],
  targetAudience: '',
  notes: '',
  details: '',
  milestones: [],
  media: [], // array of base64 data URLs
};

export default function CampaignDrawer() {
  const { state, dispatch, getBrandById } = useCampaigns();
  const { hasPermission } = useAuth();
  const { drawerOpen, selectedCampaign, isNewCampaign, brands, activeBrandId } = state;
  const canEdit = hasPermission('canEdit');
  const canDelete = hasPermission('canDelete');
  const [form, setForm] = useState(emptyForm);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const detailsRef = useRef(null);

  // Markdown toolbar: wrap/insert text at cursor
  const insertMarkdown = useCallback((prefix, suffix = '', placeholder = '') => {
    const textarea = detailsRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = form.details || '';
    const selected = text.substring(start, end);
    const insert = selected || placeholder;
    const newText = text.substring(0, start) + prefix + insert + suffix + text.substring(end);
    handleChange('details', newText);
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + prefix.length + insert.length + suffix.length;
      textarea.setSelectionRange(
        selected ? cursorPos : start + prefix.length,
        selected ? cursorPos : start + prefix.length + insert.length
      );
    });
  }, [form.details]);

  const toolbarActions = [
    { icon: Bold, title: 'In đậm (Ctrl+B)', action: () => insertMarkdown('**', '**', 'text đậm') },
    { icon: Italic, title: 'In nghiêng (Ctrl+I)', action: () => insertMarkdown('*', '*', 'text nghiêng') },
    { icon: Heading2, title: 'Tiêu đề lớn', action: () => insertMarkdown('\n## ', '\n', 'Tiêu đề') },
    { icon: Heading3, title: 'Tiêu đề nhỏ', action: () => insertMarkdown('\n### ', '\n', 'Tiêu đề') },
    { icon: List, title: 'Danh sách', action: () => insertMarkdown('\n- ', '\n', 'Mục') },
    { icon: ListOrdered, title: 'Danh sách số', action: () => insertMarkdown('\n1. ', '\n', 'Mục') },
    { icon: Quote, title: 'Trích dẫn', action: () => insertMarkdown('\n> ', '\n', 'Trích dẫn') },
    { icon: Minus, title: 'Đường kẻ ngang', action: () => insertMarkdown('\n---\n', '', '') },
    { icon: Link, title: 'Chèn link', action: () => insertMarkdown('[', '](url)', 'tên link') },
  ];

  const handleDetailsKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); insertMarkdown('**', '**', 'text đậm'); }
      if (e.key === 'i') { e.preventDefault(); insertMarkdown('*', '*', 'text nghiêng'); }
    }
  };

  useEffect(() => {
    if (selectedCampaign) {
      setForm({ ...emptyForm, ...selectedCampaign, media: selectedCampaign.media || [] });
    } else if (isNewCampaign) {
      const today = new Date().toISOString().split('T')[0];
      setForm({ ...emptyForm, startDate: today, endDate: today, brandId: activeBrandId || (brands[0]?.id ?? '') });
    }
  }, [selectedCampaign, isNewCampaign]);

  if (!drawerOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleChannel = (channel) => {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const addMilestone = () => {
    setForm((prev) => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        { id: 'ms-' + Date.now(), text: '', date: prev.startDate },
      ],
    }));
  };

  const updateMilestone = (idx, field, value) => {
    setForm((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m, i) =>
        i === idx ? { ...m, [field]: value } : m
      ),
    }));
  };

  const removeMilestone = (idx) => {
    setForm((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== idx),
    }));
  };

  // Media handlers - upload to Firebase Storage
  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `campaigns/${Date.now()}-${safeName}`;
      const storageRef = ref(storage, filePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      setForm((prev) => ({
        ...prev,
        media: [...(prev.media || []), downloadUrl],
      }));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMedia = async (idx) => {
    const url = form.media[idx];
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        await deleteObject(ref(storage, filePath));
      }
    } catch {}
    setForm((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) return;
    setSaving(true);

    if (isNewCampaign) {
      await dispatch({ type: 'ADD_CAMPAIGN', payload: form });
    } else {
      await dispatch({ type: 'UPDATE_CAMPAIGN', payload: form });
    }
    setSaving(false);
  };

  const handleDelete = () => {
    setShowConfirm(false);
    if (selectedCampaign) {
      dispatch({ type: 'DELETE_CAMPAIGN', payload: selectedCampaign.id });
    }
  };

  const handleClose = () => {
    dispatch({ type: 'CLOSE_DRAWER' });
  };

  const color = getCategoryColor(form.category);
  const brand = form.brandId ? getBrandById(form.brandId) : null;

  return (
    <>
      <div className="modal-overlay" onClick={handleClose} />
      <div className="modal-container">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <div className="modal-header-left">
              {brand && (
                <span className="modal-brand-badge" style={{ background: brand.color + '20', color: brand.color }}>
                  {brand.logo} {brand.name}
                </span>
              )}
              <h2>{isNewCampaign ? <><Plus size={16} style={{ marginRight: 6 }} />Chiến Dịch Mới</> : <><FileText size={16} style={{ marginRight: 6 }} />Chi Tiết Chiến Dịch</>}</h2>
            </div>
            <button className="drawer-close" onClick={handleClose} aria-label="Đóng">
              <X size={18} />
            </button>
          </div>

          {/* Body - 2 columns */}
          <div className="modal-body">
            {/* Left Column - Main Info */}
            <div className="modal-col modal-col-main">
              {/* Campaign Name */}
              <div className="form-group">
                <label className="form-label">Tên Chiến Dịch</label>
                <input
                  className="form-input form-input-lg"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="VD: Flash Sale Tết Nguyên Đán"
                />
              </div>

              {/* Media / Images */}
              <div className="form-group">
                <label className="form-label">
                  <ImagePlus size={12} style={{ marginRight: 4 }} />
                  Hình Ảnh Chiến Dịch
                </label>
                <div className="media-grid">
                  {(form.media || []).map((src, idx) => (
                    <div key={idx} className="media-item">
                      <img src={src} alt={`Campaign media ${idx + 1}`} />
                      <button className="media-remove" onClick={() => removeMedia(idx)}>
                        <XCircle size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    className="media-add-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus size={24} />
                    <span>Thêm ảnh</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleMediaUpload}
                  />
                </div>
              </div>

              {/* Key Message */}
              <div className="form-group">
                <label className="form-label">
                  <MessageCircle size={12} style={{ marginRight: 4 }} />
                  Key Message
                </label>
                <textarea
                  className="form-textarea"
                  value={form.keyMessage}
                  onChange={(e) => handleChange('keyMessage', e.target.value)}
                  placeholder="Thông điệp cốt lõi của chiến dịch..."
                  rows={3}
                />
              </div>

              {/* Channels */}
              <div className="form-group">
                <label className="form-label">
                  <Target size={12} style={{ marginRight: 4 }} />
                  Kênh Triển Khai
                </label>
                <div className="channel-grid">
                  {CHANNELS.map((ch) => (
                    <button
                      key={ch}
                      className={`channel-chip ${form.channels.includes(ch) ? 'active' : ''}`}
                      onClick={() => toggleChannel(ch)}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campaign Details / Rules - Markdown Editor */}
              <div className="form-group">
                <label className="form-label">
                  <FileText size={12} style={{ marginRight: 4 }} />
                  Nội Dung Chi Tiết
                  <span className="form-label-hint">Hỗ trợ Markdown</span>
                </label>
                <div className="md-editor">
                  <div className="md-toolbar">
                    {toolbarActions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="md-toolbar-btn"
                        title={item.title}
                        onMouseDown={(e) => { e.preventDefault(); item.action(); }}
                      >
                        <item.icon size={14} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    ref={detailsRef}
                    className="form-textarea md-textarea"
                    value={form.details}
                    onChange={(e) => handleChange('details', e.target.value)}
                    onKeyDown={handleDetailsKeyDown}
                    placeholder="Hỗ trợ **in đậm**, *nghiêng*, ## tiêu đề, - danh sách, > trích dẫn..."
                    rows={6}
                  />
                </div>
              </div>

              {/* Milestones */}
              <div className="form-group">
                <label className="form-label">
                  <Milestone size={12} style={{ marginRight: 4 }} />
                  Milestones
                </label>
                <div className="milestone-list">
                  {form.milestones.map((ms, idx) => (
                    <div key={ms.id} className="milestone-item">
                      <input
                        value={ms.text}
                        onChange={(e) => updateMilestone(idx, 'text', e.target.value)}
                        placeholder="Tên milestone..."
                      />
                      <DatePicker
                        value={ms.date}
                        onChange={(v) => updateMilestone(idx, 'date', v)}
                        placeholder="Chọn ngày"
                      />
                      <button
                        className="milestone-remove"
                        onClick={() => removeMilestone(idx)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button className="add-milestone-btn" onClick={addMilestone}>
                    <Plus size={14} />
                    Thêm Milestone
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Ghi Chú Planning</label>
                <textarea
                  className="form-textarea"
                  value={form.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Thông tin bổ sung, lưu ý..."
                  rows={3}
                />
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="modal-col modal-col-side">
              {/* Brand */}
              <div className="form-group">
                <label className="form-label">
                  <Building2 size={12} style={{ marginRight: 4 }} />
                  Brand
                </label>
                <select
                  className="form-select"
                  value={form.brandId}
                  onChange={(e) => handleChange('brandId', e.target.value)}
                >
                  <option value="">— Chọn brand —</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.logo} {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">Phân Loại</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={12} style={{ marginRight: 4 }} />
                  Ngày Bắt Đầu
                </label>
                <DatePicker
                  value={form.startDate}
                  onChange={(v) => handleChange('startDate', v)}
                  placeholder="Chọn ngày bắt đầu..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={12} style={{ marginRight: 4 }} />
                  Ngày Kết Thúc
                </label>
                <DatePicker
                  value={form.endDate}
                  onChange={(v) => handleChange('endDate', v)}
                  placeholder="Chọn ngày kết thúc..."
                />
              </div>

              {/* Budget */}
              <div className="form-group">
                <label className="form-label">
                  <DollarSign size={12} style={{ marginRight: 4 }} />
                  Ngân Sách
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={form.budget}
                  onChange={(e) => handleChange('budget', e.target.value)}
                  placeholder="VD: 100,000,000 VND"
                />
              </div>

              {/* Target Audience */}
              <div className="form-group">
                <label className="form-label">Đối Tượng Mục Tiêu</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.targetAudience}
                  onChange={(e) => handleChange('targetAudience', e.target.value)}
                  placeholder="VD: Người dùng 18-35 tuổi"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            {selectedCampaign && canDelete && (
              <button className="btn btn-danger" onClick={() => setShowConfirm(true)}>
                <Trash2 size={14} />
                Xóa Chiến Dịch
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button className="btn" onClick={handleClose}>
              Hủy
            </button>
            {canEdit && (
              <button className={`btn btn-primary ${saving ? 'loading' : ''}`} onClick={handleSave} disabled={saving}>
                {isNewCampaign ? 'Tạo Chiến Dịch' : 'Lưu Thay Đổi'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      {showConfirm && (
        <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3><AlertTriangle size={18} style={{ color: 'var(--campaign-red)' }} /> Xác nhận xóa</h3>
            <p>Bạn có chắc muốn xóa chiến dịch <strong>"{form.name}"</strong>? Hành động này không thể hoàn tác.</p>
            <div className="confirm-actions">
              <button className="btn" onClick={() => setShowConfirm(false)}>Hủy</button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={14} /> Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
