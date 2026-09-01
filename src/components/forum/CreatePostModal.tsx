import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Image as ImageIcon, 
  Camera, 
  HelpCircle, 
  Sparkles, 
  Upload, 
  Tag, 
  Leaf, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Eye, 
  Flower2, 
  Lightbulb, 
  MessageSquare 
} from 'lucide-react';
import { ForumCategory } from '../../types/forum';
import { checkContentSafety } from '../../utils/moderation';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    category: 'question' | 'showcase' | 'tip' | 'discussion' | 'identification';
    photoUrl?: string | null;
    plantTag?: string | null;
  }) => Promise<string>;
  suggestedPlants?: { name: string; scientificName: string }[];
}

const CATEGORY_OPTIONS: { 
  id: 'question' | 'showcase' | 'tip' | 'discussion' | 'identification'; 
  label: string; 
  desc: string; 
  icon: React.ComponentType<{ className?: string }>; 
  color: string;
}[] = [
  {
    id: 'question',
    label: 'Ask a Question',
    desc: 'Get advice on watering, diseases, pests, or pruning',
    icon: HelpCircle,
    color: 'amber'
  },
  {
    id: 'showcase',
    label: 'Garden Showcase',
    desc: 'Share photos of your flourishing indoor or outdoor garden',
    icon: Flower2,
    color: 'emerald'
  },
  {
    id: 'tip',
    label: 'Care Tip / Guide',
    desc: 'Share verified gardening wisdom and techniques',
    icon: Lightbulb,
    color: 'teal'
  },
  {
    id: 'identification',
    label: 'Plant ID Help',
    desc: 'Ask community botanists to identify an unknown species',
    icon: Leaf,
    color: 'lime'
  },
  {
    id: 'discussion',
    label: 'General Discussion',
    desc: 'Chat about seeds, microclimates, gear, and experiences',
    icon: MessageSquare,
    color: 'cyan'
  }
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  suggestedPlants = []
}) => {
  const [category, setCategory] = useState<'question' | 'showcase' | 'tip' | 'discussion' | 'identification'>('question');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [plantTag, setPlantTag] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoInputMode, setPhotoInputMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTextChange = (newTitle: string, newContent: string) => {
    setTitle(newTitle);
    setContent(newContent);
    const safety = checkContentSafety(newContent, newTitle);
    if (!safety.isSafe) {
      setSafetyWarning(safety.warningMessage || 'Restricted language detected.');
    } else {
      setSafetyWarning(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image size should be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoUrl(result);
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setPhotoUrl(urlInput.trim());
    setPhotoPreview(urlInput.trim());
    setUrlInput('');
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (title.trim().length < 3) {
      setFormError('Title must be at least 3 characters.');
      return;
    }
    if (content.trim().length < 10) {
      setFormError('Please provide more detail in your post (at least 10 characters).');
      return;
    }

    const safety = checkContentSafety(content, title);
    if (!safety.isSafe) {
      setFormError(safety.warningMessage || 'Content violates community guidelines.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        category,
        photoUrl,
        plantTag: plantTag.trim() || undefined
      });
      // Reset form
      setTitle('');
      setContent('');
      setPlantTag('');
      setPhotoUrl(null);
      setPhotoPreview(null);
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to publish post. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[#09150e] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between p-5 border-b border-emerald-900/30 bg-[#0c1c13]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Create Botanical Discussion</h3>
                <p className="text-xs text-emerald-400/80">Connect with the global gardening community</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-950/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Category Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                Select Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = category === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setCategory(opt.id)}
                      className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span className="text-xs font-semibold">{opt.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-1 leading-tight">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Post Title */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Post Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTextChange(e.target.value, content)}
                placeholder={
                  category === 'question'
                    ? 'e.g. Why are my Fiddle Leaf Fig leaves drooping after watering?'
                    : category === 'showcase'
                    ? 'e.g. My Japanese Zen balcony garden after 6 months of growth'
                    : 'e.g. Best organic spray recipe for whiteflies'
                }
                maxLength={180}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              <div className="flex justify-between items-center mt-1 text-[10px] text-slate-500">
                <span>Be specific and descriptive</span>
                <span>{title.length}/180</span>
              </div>
            </div>

            {/* Plant Tag & Species Link */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-1">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                Plant / Species Tag (Optional)
              </label>
              <input
                type="text"
                value={plantTag}
                onChange={(e) => setPlantTag(e.target.value)}
                placeholder="e.g. Monstera deliciosa, Ficus lyrata, English Rose"
                maxLength={80}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              {suggestedPlants.length > 0 && !plantTag && (
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  <span className="text-[10px] text-slate-500">From your garden:</span>
                  {suggestedPlants.slice(0, 4).map((p, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setPlantTag(`${p.name} (${p.scientificName})`)}
                      className="px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-[10px] text-emerald-300 hover:bg-emerald-900/50 transition-colors"
                    >
                      + {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content / Body */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Discussion Details & Context *
              </label>
              <textarea
                value={content}
                onChange={(e) => handleTextChange(title, e.target.value)}
                rows={5}
                placeholder={
                  category === 'question'
                    ? 'Describe your plant conditions: sunlight exposure, watering frequency, soil type, room temperature, and when the symptoms first appeared...'
                    : 'Share details of your care routine, potting mix, lighting setup, or tips for fellow plant lovers...'
                }
                maxLength={4500}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors resize-y leading-relaxed"
              />
              <div className="flex justify-between items-center mt-1 text-[10px] text-slate-500">
                <span>Markdown supported (**bold**, *italic*, - list)</span>
                <span>{content.length}/4500</span>
              </div>
            </div>

            {/* Photo Attachment Section */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Garden Photo / Evidence
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPhotoInputMode('upload')}
                    className={`px-2 py-0.5 rounded-md ${
                      photoInputMode === 'upload' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    Upload / Camera
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setPhotoInputMode('url')}
                    className={`px-2 py-0.5 rounded-md ${
                      photoInputMode === 'url' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-black/40 max-h-48 group">
                  <img
                    src={photoPreview}
                    alt="Uploaded preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-rose-300 hover:text-white hover:bg-rose-600 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : photoInputMode === 'upload' ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-900/40 hover:bg-slate-900/70"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-white">
                    Click to upload garden photo or snap with camera
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Supports JPG, PNG, WEBP (Max 5MB)
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Warnings & Safety Feedback */}
            {safetyWarning && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{safetyWarning}</span>
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Submit Toolbar */}
            <div className="pt-3 border-t border-emerald-900/30 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !!safetyWarning}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing Discussion...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Publish to Community
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
