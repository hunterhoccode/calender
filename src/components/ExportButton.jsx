import { useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, Loader } from 'lucide-react';

export default function ExportButton({ targetRef }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!targetRef?.current) return;

    setLoading(true);
    try {
      // Temporarily add export class to resolve rendering issues
      targetRef.current.classList.add('exporting');

      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#0a0e1a',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      targetRef.current.classList.remove('exporting');

      const link = document.createElement('a');
      link.download = `marketing-calendar-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      targetRef.current?.classList.remove('exporting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="btn" onClick={handleExport} disabled={loading}>
        {loading ? <Loader size={14} className="spinner" /> : <Download size={14} />}
        {loading ? 'Đang xuất...' : 'Export Ảnh'}
      </button>

      {loading && (
        <div className="export-loading">
          <div className="export-loading-content">
            <div className="spinner" />
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
              Đang tạo ảnh...
            </span>
          </div>
        </div>
      )}
    </>
  );
}
