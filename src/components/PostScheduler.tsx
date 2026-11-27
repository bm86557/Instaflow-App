import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import {
  Plus,
  Video,
  Calendar as CalendarIcon,
  Clock,
  X,
  Send,
  CheckCircle2,
  Zap,
  Trash2,
  RefreshCw,
  AlertCircle,
  Link as LinkIcon,
  Play,
  Loader2,
  Image as ImageIcon,
  AtSign
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  uploadMediaToCloudinary,
  getScheduledPosts,
  createScheduledPost,
  deleteScheduledPost,
  publishScheduledPostNow
} from '../services/schedulerService';
import { ScheduledMediaItem, ScheduledMediaType, ScheduledPost } from '../types/schedulerTypes';

export default function PostScheduler() {
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [manualUrls, setManualUrls] = useState<ScheduledMediaItem[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [userTags, setUserTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [appendMentionsToCaption, setAppendMentionsToCaption] = useState(false);
  const [isStory, setIsStory] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [autoPublish, setAutoPublish] = useState(true);

  // Automated engagement attachment
  const [enableAutoEng, setEnableAutoEng] = useState(false);
  const [engKeyword, setEngKeyword] = useState('');
  const [engType, setEngType] = useState<'COMMENT' | 'MESSAGE' | 'ALL'>('COMMENT');
  const [engNarration, setEngNarration] = useState('');
  const [engCommentReply, setEngCommentReply] = useState('');
  const [engDmMessage, setEngDmMessage] = useState('');

  // Queue & UI states
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      setLoadingQueue(true);
      const list = await getScheduledPosts();
      setScheduledPosts(list);
    } catch (err: any) {
      console.error('[PostScheduler] Failed to load queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'video/*': ['.mp4', '.mov']
    }
  } as any);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeManualUrl = (index: number) => {
    setManualUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddManualUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      setModalError('Please enter a valid public HTTPS image or video URL.');
      return;
    }
    const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(trimmed);
    setManualUrls((prev) => [...prev, { url: trimmed, isVideo }]);
    setUrlInput('');
  };

  const handleAddUserTag = () => {
    const cleaned = tagInput.replace(/^@+/, '').trim();
    if (!cleaned) return;
    if (!/^[a-zA-Z0-9._]+$/.test(cleaned)) {
      setModalError('Instagram usernames can only contain letters, numbers, periods, and underscores.');
      return;
    }
    if (!userTags.includes(cleaned)) {
      setUserTags((prev) => [...prev, cleaned]);
    }
    setTagInput('');
  };

  const removeUserTag = (username: string) => {
    setUserTags((prev) => prev.filter((u) => u !== username));
  };

  const totalAssets = files.length + manualUrls.length;

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAssets === 0 || !scheduledDate || !scheduledTime) return;

    const scheduledDateObj = new Date(`${scheduledDate}T${scheduledTime}`);
    if (Number.isNaN(scheduledDateObj.getTime())) {
      setModalError('Please choose a valid date and time.');
      return;
    }

    if (enableAutoEng) {
      if (!engKeyword.trim()) {
        setModalError('Please enter a trigger keyword for Automated Engagement.');
        return;
      }
      if ((engType === 'COMMENT' || engType === 'ALL') && !engCommentReply.trim()) {
        setModalError('Please enter a Comment Reply message for Automated Engagement.');
        return;
      }
      if ((engType === 'MESSAGE' || engType === 'ALL') && !engDmMessage.trim()) {
        setModalError('Please enter a Private DM message for Automated Engagement.');
        return;
      }
    }

    try {
      setSubmitting(true);

      // 1. Upload local files to Cloudinary
      const uploadedItems: ScheduledMediaItem[] = [...manualUrls];
      for (const file of files) {
        const uploaded = await uploadMediaToCloudinary(file);
        uploadedItems.push(uploaded);
      }

      // 2. Determine Instagram media type
      let mediaType: ScheduledMediaType = 'IMAGE';
      if (isStory) {
        mediaType = 'STORIES';
      } else if (uploadedItems.length >= 2) {
        mediaType = 'CAROUSEL';
      } else if (uploadedItems[0]?.isVideo) {
        mediaType = 'REELS';
      }

      // 3. Collect all user tags (including any typed-but-uncommitted username in tagInput)
      const pendingTags = tagInput
        .split(/[\s,]+/)
        .map((t) => t.replace(/^@+/, '').trim())
        .filter((t) => t && /^[a-zA-Z0-9._]+$/.test(t));
      const effectiveUserTags = isStory ? [] : Array.from(new Set([...userTags, ...pendingTags]));

      // Build final caption (optionally appending @mentions not already in caption)
      let finalCaption = isStory ? '' : caption.trim();
      if (!isStory && appendMentionsToCaption && effectiveUserTags.length > 0) {
        const missingMentions = effectiveUserTags
          .map((u) => `@${u}`)
          .filter((m) => !finalCaption.toLowerCase().includes(m.toLowerCase()));
        if (missingMentions.length > 0) {
          finalCaption = finalCaption
            ? `${finalCaption}\n\n${missingMentions.join(' ')}`
            : missingMentions.join(' ');
        }
      }

      // 4. Create scheduled post in Firestore via backend
      const created = await createScheduledPost({
        mediaType,
        mediaItems: uploadedItems,
        caption: finalCaption,
        userTags: effectiveUserTags,
        scheduledAt: scheduledDateObj.toISOString(),
        autoPublish,
        autoEngagement: enableAutoEng
          ? {
              enabled: true,
              keyword: engKeyword.trim(),
              type: engType,
              replyMessage: engType === 'COMMENT' || engType === 'ALL' ? engCommentReply.trim() : '',
              dmMessage: engType === 'MESSAGE' || engType === 'ALL' ? engDmMessage.trim() : null,
              narration: engNarration.trim() || null
            }
          : null
      });

      setScheduledPosts((prev) => [created, ...prev]);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setFiles([]);
        setManualUrls([]);
        setCaption('');
        setUserTags([]);
        setTagInput('');
        setScheduledDate('');
        setScheduledTime('');
        setEnableAutoEng(false);
        setEngKeyword('');
        setEngNarration('');
        setEngCommentReply('');
        setEngDmMessage('');
      }, 1800);
    } catch (err: any) {
      setModalError(err.message || 'Failed to schedule post');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishNow = async (postId: string) => {
    try {
      setPublishingId(postId);
      const updated = await publishScheduledPostNow(postId);
      setScheduledPosts((prev) => prev.map((p) => (p.postId === postId ? updated : p)));
    } catch (err: any) {
      setModalError(err.message || 'Failed to publish post');
      await loadQueue();
    } finally {
      setPublishingId(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteScheduledPost(postId);
      setScheduledPosts((prev) => prev.filter((p) => p.postId !== postId));
    } catch (err: any) {
      setModalError(err.message || 'Failed to delete scheduled post');
    }
  };

  const statusBadge = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'publishing':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Create Content</h1>
          <p className="text-white/40 mt-1">Schedule images, videos, and stories with automated engagement.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsStory(!isStory)}
            className={clsx(
              'px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all',
              isStory
                ? 'bg-white text-indigo-600 active-glow'
                : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
            )}
          >
            {isStory ? 'Story Mode: ON' : 'Story Mode'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Media Upload Area */}
          <div
            {...getRootProps()}
            className={clsx(
              'relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer min-h-[300px]',
              isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 glass-darker hover:border-white/20'
            )}
          >
            <input {...getInputProps()} />
            <div className="p-5 bg-indigo-500/20 text-indigo-400 rounded-2xl mb-5 active-glow">
              <Plus className="w-9 h-9" />
            </div>
            <p className="text-xl font-bold text-white uppercase tracking-tighter">Upload Creative Assets</p>
            <p className="text-sm text-white/30 mt-2 font-medium">JPG, PNG, MP4 (Uploaded via Cloudinary)</p>

            <AnimatePresence>
              {(files.length > 0 || manualUrls.length > 0) && (
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 w-full px-2">
                  {files.map((file, idx) => (
                    <motion.div
                      key={`file-${idx}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative aspect-square group rounded-2xl overflow-hidden glass border border-white/10"
                    >
                      {file.type.startsWith('image') ? (
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt={file.name} />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 p-2 text-center">
                          <Video className="text-white/50 w-8 h-8 mb-1" />
                          <span className="text-[10px] text-white/40 line-clamp-1">{file.name}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                  {manualUrls.map((item, idx) => (
                    <motion.div
                      key={`url-${idx}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative aspect-square group rounded-2xl overflow-hidden glass border border-indigo-500/30"
                    >
                      {item.isVideo ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                          <Video className="text-indigo-300 w-8 h-8" />
                          <span className="text-[10px] text-white/40 mt-1">Video URL</span>
                        </div>
                      ) : (
                        <img src={item.url} className="w-full h-full object-cover" alt="Media preview" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeManualUrl(idx);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Direct Public HTTPS URL Fallback */}
          <div className="glass rounded-2xl p-4 border border-white/10 flex items-center gap-3">
            <LinkIcon className="w-4 h-4 text-white/40 flex-shrink-0 ml-1" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Or paste a direct public HTTPS image/MP4 URL..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            />
            <button
              type="button"
              onClick={handleAddManualUrl}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
            >
              Add URL
            </button>
          </div>

          {/* Caption Box */}
          <div className="glass rounded-3xl overflow-hidden shadow-2xl border border-white/5">
            {isStory ? (
              <div className="p-6 text-sm text-white/50">
                Story Mode is enabled — Instagram Stories API does not support captions on stories.
              </div>
            ) : (
              <textarea
                placeholder="Write your exact Instagram caption here..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full h-40 p-6 bg-transparent resize-none focus:outline-none text-white text-base placeholder:text-white/20"
              />
            )}
          </div>

          {/* Tag & Mention People (Images / Reels / Carousels) */}
          {!isStory && (
            <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <AtSign className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Tag & Mention People</h3>
                </div>
                <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={appendMentionsToCaption}
                    onChange={(e) => setAppendMentionsToCaption(e.target.checked)}
                    className="accent-indigo-500 rounded"
                  />
                  Also @mention in caption
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUserTag();
                    }
                  }}
                  placeholder="Enter Instagram @username (e.g. bilal___00)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:bg-white/10"
                />
                <button
                  type="button"
                  onClick={handleAddUserTag}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-xs font-bold text-white transition-colors"
                >
                  Add Person
                </button>
              </div>
              {userTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {userTags.map((username) => (
                    <span
                      key={username}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-xs font-semibold text-indigo-200"
                    >
                      @{username}
                      <button
                        type="button"
                        onClick={() => removeUserTag(username)}
                        className="text-indigo-300/70 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-white/35">
                Tagged people are added as Instagram post tags (for public accounts) and optionally @mentioned in the caption.
              </p>
            </div>
          )}

          {/* Optional Automated Engagement Attachment */}
          <div className="glass-darker rounded-3xl p-6 border border-white/10 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Attach Automated Engagement</h3>
                  <p className="text-xs text-white/40">
                    Automatically creates a post-specific Comment / DM auto-reply rule once this post goes live.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEnableAutoEng(!enableAutoEng)}
                className={clsx(
                  'w-12 h-6 rounded-full relative p-1 transition-colors',
                  enableAutoEng ? 'bg-indigo-600 active-glow' : 'bg-white/10'
                )}
              >
                <div
                  className={clsx(
                    'w-4 h-4 bg-white rounded-full shadow transition-transform',
                    enableAutoEng ? 'translate-x-6' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {enableAutoEng && (
              <div className="space-y-4 pt-3 border-t border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Trigger Keyword</label>
                    <input
                      type="text"
                      placeholder="e.g. price, link"
                      value={engKeyword}
                      onChange={(e) => setEngKeyword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Trigger Type</label>
                    <select
                      value={engType}
                      onChange={(e) => setEngType(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                    >
                      <option className="bg-slate-900" value="COMMENT">Comments Only</option>
                      <option className="bg-slate-900" value="MESSAGE">DMs Only</option>
                      <option className="bg-slate-900" value="ALL">Both (Comment + Private DM)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Semantic Narration (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Match if user asks about cost, pricing, or rates"
                    value={engNarration}
                    onChange={(e) => setEngNarration(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>
                {(engType === 'COMMENT' || engType === 'ALL') && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Comment Auto-Reply</label>
                    <textarea
                      placeholder="Public comment reply..."
                      value={engCommentReply}
                      onChange={(e) => setEngCommentReply(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white h-20 resize-none outline-none"
                    />
                  </div>
                )}
                {(engType === 'MESSAGE' || engType === 'ALL') && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Private DM Message</label>
                    <textarea
                      placeholder="Private DM sent to that user..."
                      value={engDmMessage}
                      onChange={(e) => setEngDmMessage(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white h-20 resize-none outline-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Deployment Controls */}
        <div className="space-y-6">
          <div className="p-8 glass-darker rounded-3xl border border-white/10 space-y-8">
            <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Deployment</h3>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Post Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-4 outline-none text-white font-medium focus:bg-white/10 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Launch Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-4 outline-none text-white font-medium focus:bg-white/10 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white/80">Auto-publish</span>
                <button
                  type="button"
                  onClick={() => setAutoPublish(!autoPublish)}
                  className={clsx(
                    'w-12 h-6 rounded-full relative p-1 cursor-pointer transition-colors',
                    autoPublish ? 'bg-indigo-600 active-glow' : 'bg-white/10'
                  )}
                >
                  <div
                    className={clsx(
                      'w-4 h-4 bg-white rounded-full shadow-md transition-transform',
                      autoPublish ? 'translate-x-6' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
              <p className="text-[10px] text-white/30 leading-relaxed uppercase font-medium">
                {autoPublish ? 'Content will be pushed live automatically at exact time.' : 'Saved as draft in queue until you click Publish Now.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSchedule}
              disabled={submitting || totalAssets === 0 || !scheduledDate || !scheduledTime}
              className="w-full bg-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed text-indigo-900 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Uploading...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" /> Locked In
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" /> Schedule Mission
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scheduled Queue & History */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Scheduled Queue & History</h2>
            <p className="text-white/40 text-sm mt-1">Upcoming posts publish automatically at their exact scheduled date & time.</p>
          </div>
          <button
            type="button"
            onClick={loadQueue}
            disabled={loadingQueue}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/80 px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 transition-colors"
          >
            <RefreshCw className={clsx('w-4 h-4', loadingQueue && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {loadingQueue ? (
          <div className="glass rounded-3xl p-8 text-center text-white/50 text-sm">Loading scheduled posts...</div>
        ) : scheduledPosts.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center text-white/40 text-sm">
            No scheduled posts yet. Upload an image/video or paste a public URL above to schedule your first post.
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledPosts.map((post) => {
              const firstMedia = post.mediaItems?.[0];
              const scheduledLocal = post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : '—';
              return (
                <div
                  key={post.postId}
                  className="glass rounded-2xl p-4 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden flex-shrink-0 border border-white/10 flex items-center justify-center">
                      {firstMedia?.url && !firstMedia.isVideo ? (
                        <img src={firstMedia.url} alt="Scheduled media" className="w-full h-full object-cover" />
                      ) : firstMedia?.isVideo ? (
                        <Video className="w-6 h-6 text-indigo-300" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-white/20" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={clsx('text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border', statusBadge(post.status))}>
                          {post.status}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/60 font-bold uppercase">
                          {post.mediaType}
                        </span>
                        {post.autoEngagement?.enabled && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Trigger: "{post.autoEngagement.keyword}"
                          </span>
                        )}
                        {post.userTags && post.userTags.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold flex items-center gap-1">
                            <AtSign className="w-3 h-3" /> {post.userTags.map((u) => `@${u}`).join(', ')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white font-medium mt-1 line-clamp-1">
                        {post.caption || (post.mediaType === 'STORIES' ? 'Instagram Story' : 'No caption')}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">Scheduled for: {scheduledLocal}</p>
                      {post.errorMessage && (
                        <p className="text-xs text-red-400 mt-1">Error: {post.errorMessage}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {post.status !== 'published' && post.status !== 'publishing' && (
                      <button
                        type="button"
                        onClick={() => handlePublishNow(post.postId)}
                        disabled={publishingId === post.postId}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-colors"
                      >
                        {publishingId === post.postId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        {publishingId === post.postId ? 'Publishing...' : 'Publish Now'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.postId)}
                      className="p-2 text-white/30 hover:text-red-400 transition-colors"
                      title="Delete scheduled post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* App-styled Error Modal */}
      <AnimatePresence>
        {modalError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalError(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass-darker border border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Scheduling Error</h3>
                    <p className="text-xs text-white/40">Please review the details below</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalError(null)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-200 leading-relaxed">
                {modalError}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setModalError(null)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
