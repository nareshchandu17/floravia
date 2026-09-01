import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  EyeOff, 
  Trash2, 
  AlertOctagon, 
  Sparkles,
  ExternalLink,
  Loader2,
  RefreshCw,
  FileText
} from 'lucide-react';
import { ForumReport } from '../../types/forum';

interface ModerationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  reports: ForumReport[];
  isLoading: boolean;
  onActionReport: (reportId: string, action: 'reviewed' | 'dismissed' | 'actioned') => Promise<void>;
  onHidePost: (postId: string, status: 'active' | 'hidden') => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onRefresh: () => void;
  onViewPost: (postId: string) => void;
}

export const ModerationPanel: React.FC<ModerationPanelProps> = ({
  isOpen,
  onClose,
  reports,
  isLoading,
  onActionReport,
  onHidePost,
  onDeletePost,
  onRefresh,
  onViewPost
}) => {
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleDismiss = async (report: ForumReport) => {
    if (!report.id) return;
    setProcessingId(report.id);
    try {
      await onActionReport(report.id, 'dismissed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleHideAndAction = async (report: ForumReport) => {
    if (!report.id) return;
    setProcessingId(report.id);
    try {
      if (report.targetType === 'post') {
        await onHidePost(report.postId, 'hidden');
      }
      await onActionReport(report.id, 'actioned');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteAndAction = async (report: ForumReport) => {
    if (!report.id) return;
    if (!confirm('Are you sure you want to permanently delete this content?')) return;
    setProcessingId(report.id);
    try {
      if (report.targetType === 'post') {
        await onDeletePost(report.postId);
      }
      await onActionReport(report.id, 'actioned');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-[#09150e] border border-amber-500/30 rounded-2xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-amber-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">Botanical Moderator Command Center</h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] uppercase font-bold border border-amber-500/30">
                    Mod Portal
                  </span>
                </div>
                <p className="text-xs text-slate-400">Review flagged discussions and enforce community safety</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                title="Refresh queue"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body / Queue */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {reports.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-semibold text-white">All Clear! No Pending Flagged Content</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  The Floravia community ecosystem is flourishing with zero pending violation reports.
                </p>
              </div>
            ) : (
              reports.map((report) => {
                const isProcessing = processingId === report.id;
                return (
                  <div
                    key={report.id}
                    className="p-4 rounded-xl bg-slate-900/70 border border-amber-500/20 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                          Reason: {report.reason}
                        </span>
                        <span className="text-xs text-slate-400">
                          Reported on {report.targetType}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          onViewPost(report.postId);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        Inspect in Context
                      </button>
                    </div>

                    {report.targetTitle && (
                      <div className="text-xs font-semibold text-white">
                        "{report.targetTitle}"
                      </div>
                    )}

                    {report.details && (
                      <div className="p-2.5 rounded-lg bg-black/40 text-[11px] text-slate-300 border border-white/5">
                        <span className="text-slate-500 font-semibold block mb-0.5">Reporter Note:</span>
                        {report.details}
                      </div>
                    )}

                    {/* Action Toolbar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Target ID: {report.targetId.slice(0, 10)}...
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDismiss(report)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                        >
                          Dismiss (False Alarm)
                        </button>
                        <button
                          onClick={() => handleHideAndAction(report)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          Hide Post
                        </button>
                        <button
                          onClick={() => handleDeleteAndAction(report)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-amber-900/30 flex items-center justify-between text-xs text-slate-400">
            <span>Logged in as Botanical Administrator</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
