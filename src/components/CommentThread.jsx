import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { Send, Trash2, MessageCircle } from 'lucide-react';

export default function CommentThread({ campaignId }) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  // Load comments
  useEffect(() => {
    if (!campaignId) return;

    async function load() {
      const { data } = await supabase
        .from('campaign_comments')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });
      if (data) setComments(data);
    }
    load();

    // Real-time subscription
    const channel = supabase
      .channel(`comments-${campaignId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'campaign_comments',
        filter: `campaign_id=eq.${campaignId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setComments((prev) => {
            if (prev.some((c) => c.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        } else if (payload.eventType === 'DELETE') {
          setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [campaignId]);

  // Auto-scroll to bottom on new comments
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments.length]);

  const handleSend = async () => {
    if (!text.trim() || !currentUser || sending) return;
    setSending(true);

    await supabase.from('campaign_comments').insert({
      campaign_id: campaignId,
      user_id: currentUser.id,
      username: currentUser.displayName || currentUser.username,
      user_role: currentUser.role,
      content: text.trim(),
    });

    setText('');
    setSending(false);
  };

  const handleDelete = async (commentId) => {
    await supabase.from('campaign_comments').delete().eq('id', commentId);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  const roleColors = {
    admin: { bg: 'var(--accent-primary-glow)', color: 'var(--accent-primary-hover)' },
    editor: { bg: 'var(--campaign-green-bg)', color: 'var(--campaign-green)' },
    viewer: { bg: 'rgba(120,136,154,0.15)', color: 'var(--text-tertiary)' },
  };

  return (
    <div className="comment-thread">
      <div className="detail-section-label">
        <MessageCircle size={14} />
        Bình luận ({comments.length})
      </div>

      {comments.length > 0 ? (
        <div className="comment-list" ref={listRef}>
          {comments.map((c) => {
            const rc = roleColors[c.user_role] || roleColors.viewer;
            const canDelete = currentUser?.id === c.user_id || currentUser?.role === 'admin';
            return (
              <div key={c.id} className="comment-item">
                <div className="comment-avatar" style={{ background: rc.bg, color: rc.color }}>
                  {(c.username || '?').charAt(0).toUpperCase()}
                </div>
                <div className="comment-body">
                  <div className="comment-header">
                    <span className="comment-username">{c.username}</span>
                    <span className="comment-role" style={{ background: rc.bg, color: rc.color }}>
                      {ROLES[c.user_role]?.label || c.user_role}
                    </span>
                    <span className="comment-time">{timeAgo(c.created_at)}</span>
                  </div>
                  <div className="comment-text">{c.content}</div>
                </div>
                {canDelete && (
                  <button className="comment-delete" onClick={() => handleDelete(c.id)} aria-label="Xóa">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="comment-empty">Chưa có bình luận nào</div>
      )}

      {currentUser && (
        <div className="comment-input-row">
          <input
            className="form-input"
            placeholder="Viết bình luận..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="btn btn-primary" onClick={handleSend} disabled={sending || !text.trim()}>
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
