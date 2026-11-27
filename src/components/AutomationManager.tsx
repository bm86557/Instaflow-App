import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2,
  Pencil,
  Zap,
  RefreshCw,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Globe,
  AlertCircle,
  X
} from 'lucide-react';
import * as automationService from '../services/automationService';
import { AutomationRule, InstagramPost } from '../types/automationTypes';

export default function AutomationManager() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollStatus, setPollStatus] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({
    keyword: '',
    reply: '',
    dmMessage: '',
    narration: '',
    type: 'COMMENT',
    targetMediaId: ''
  });

  useEffect(() => {
    loadRules();
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      setPostsLoading(true);
      setPostsError(null);
      const fetchedPosts = await automationService.getInstagramPosts();
      setPosts(fetchedPosts);
    } catch (err: any) {
      setPostsError(err.message);
      console.error('Failed to load Instagram posts:', err);
    } finally {
      setPostsLoading(false);
    }
  }

  async function loadRules() {
    try {
      setLoading(true);
      setError(null);
      const fetchedRules = await automationService.getRules();
      setRules(fetchedRules);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  }

  const saveRule = async () => {
    const needsComment = newRule.type === 'COMMENT' || newRule.type === 'ALL';
    const needsDm = newRule.type === 'MESSAGE' || newRule.type === 'ALL';
    if (!newRule.keyword.trim()) return;
    if (needsComment && !newRule.reply.trim()) return;
    if (needsDm && !newRule.dmMessage.trim()) return;
    
    const selectedPost = newRule.targetMediaId
      ? posts.find((p) => p.id === newRule.targetMediaId)
      : undefined;

    const payload = {
      keyword: newRule.keyword,
      replyMessage: needsComment ? newRule.reply : '',
      dmMessage: needsDm ? newRule.dmMessage : null,
      narration: newRule.narration.trim() ? newRule.narration.trim() : null,
      type: newRule.type as any,
      targetMediaId: selectedPost ? selectedPost.id : null,
      targetMediaCaption: selectedPost?.caption || null,
      targetMediaUrl: selectedPost ? (selectedPost.thumbnail_url || selectedPost.media_url || null) : null
    };

    try {
      if (editingRuleId) {
        const updatedRule = await automationService.updateRule(editingRuleId, payload);
        setRules(rules.map(r => r.ruleId === editingRuleId ? updatedRule : r));
      } else {
        const createdRule = await automationService.createRule(payload);
        setRules([createdRule, ...rules]);
      }
      setIsAdding(false);
      setEditingRuleId(null);
      setNewRule({ keyword: '', reply: '', dmMessage: '', narration: '', type: 'COMMENT', targetMediaId: '' });
    } catch (err: any) {
      setModalError(err.message || `Failed to ${editingRuleId ? 'update' : 'create'} rule`);
    }
  };

  const openAddRuleForPost = (postId?: string) => {
    setEditingRuleId(null);
    setNewRule({
      keyword: '',
      reply: '',
      dmMessage: '',
      narration: '',
      type: 'COMMENT',
      targetMediaId: postId || ''
    });
    setIsAdding(true);
  };

  const openEditRule = (rule: AutomationRule) => {
    setEditingRuleId(rule.ruleId);
    setNewRule({
      keyword: rule.keyword || '',
      reply: rule.replyMessage || '',
      dmMessage: rule.dmMessage || '',
      narration: rule.narration || '',
      type: rule.type || 'COMMENT',
      targetMediaId: rule.targetMediaId || ''
    });
    setIsAdding(true);
  };

  const deleteRule = async (id: string) => {
    try {
      await automationService.deleteRule(id);
      setRules(rules.filter(r => r.ruleId !== id));
    } catch (err: any) {
      setModalError(err.message || 'Failed to delete rule');
    }
  };

  const toggleRule = async (id: string) => {
    try {
      const updatedRule = await automationService.toggleRule(id);
      setRules(rules.map(r => r.ruleId === id ? updatedRule : r));
    } catch (err: any) {
      setModalError(err.message || 'Failed to toggle rule');
    }
  };

  const handleCheckComments = async () => {
    try {
      setIsPolling(true);
      setPollStatus(null);
      const res = await automationService.pollComments();
      setPollStatus(`Checked ${res.checkedComments} recent comments across ${res.checkedMedia} posts.`);
      await loadRules();
    } catch (err: any) {
      setPollStatus('Check failed: ' + err.message);
    } finally {
      setIsPolling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-white/60 mt-4">Loading automation rules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="p-8 glass-darker border-red-500/30 rounded-3xl inline-block">
            <p className="text-red-400 mb-4">Error loading rules</p>
            <p className="text-white/60 text-sm mb-6">{error}</p>
            <button 
              onClick={loadRules}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Automation Rules</h1>
          <p className="text-white/40 mt-1">Set up keywords to automatically trigger replies to comments and DMs.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCheckComments}
            disabled={isPolling}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-semibold transition-all border border-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${isPolling ? 'animate-spin' : ''}`} />
            {isPolling ? 'Checking...' : 'Check Comments'}
          </button>
          <button 
            onClick={() => openAddRuleForPost()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" /> Add Rule
          </button>
        </div>
      </header>
      {pollStatus && (
        <div className="px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-sm text-indigo-200">
          {pollStatus}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 glass-darker border-indigo-500/30 rounded-3xl shadow-2xl"
              >
                <h3 className="text-lg font-bold text-white mb-6">
                  {editingRuleId ? 'Edit Automation Rule' : 'New Automation Rule'}
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Trigger Keyword</label>
                      <input 
                        type="text" 
                        placeholder="e.g. price, link, hello"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none text-white focus:bg-white/10 transition-colors"
                        value={newRule.keyword}
                        onChange={(e) => setNewRule({...newRule, keyword: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Trigger Type</label>
                      <select 
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none text-white focus:bg-white/10 transition-colors cursor-pointer"
                        value={newRule.type}
                        onChange={(e) => setNewRule({...newRule, type: e.target.value})}
                      >
                        <option className="bg-slate-900" value="COMMENT">Comments Only</option>
                        <option className="bg-slate-900" value="MESSAGE">DMs Only</option>
                        <option className="bg-slate-900" value="ALL">Both (Comment Reply + Private DM)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Target Post</label>
                    <select
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none text-white focus:bg-white/10 transition-colors cursor-pointer"
                      value={newRule.targetMediaId}
                      onChange={(e) => setNewRule({ ...newRule, targetMediaId: e.target.value })}
                    >
                      <option className="bg-slate-900" value="">All Posts (Global Rule)</option>
                      {posts.map((post) => (
                        <option className="bg-slate-900" key={post.id} value={post.id}>
                          {post.caption ? `${post.caption.slice(0, 60)}${post.caption.length > 60 ? '...' : ''}` : `Post ${post.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      Semantic Narration / Meaning (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Match if user asks about cost, pricing, rates, or how much this costs"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none text-white focus:bg-white/10 transition-colors"
                      value={newRule.narration}
                      onChange={(e) => setNewRule({ ...newRule, narration: e.target.value })}
                    />
                  </div>
                  {(newRule.type === 'COMMENT' || newRule.type === 'ALL') && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Comment Auto-Reply Message</label>
                      <textarea 
                        placeholder="Public reply on the comment (e.g. Sent you the details in DM!)"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none text-white h-24 resize-none focus:bg-white/10 transition-colors"
                        value={newRule.reply}
                        onChange={(e) => setNewRule({...newRule, reply: e.target.value})}
                      />
                    </div>
                  )}
                  {(newRule.type === 'MESSAGE' || newRule.type === 'ALL') && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Private DM Message</label>
                      <textarea 
                        placeholder="Private DM sent directly to that user (e.g. Here is the price & link: ...)"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none text-white h-24 resize-none focus:bg-white/10 transition-colors"
                        value={newRule.dmMessage}
                        onChange={(e) => setNewRule({...newRule, dmMessage: e.target.value})}
                      />
                    </div>
                  )}
                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      onClick={() => {
                        setIsAdding(false);
                        setEditingRuleId(null);
                      }}
                      className="px-6 py-2.5 text-sm font-bold text-white/40 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={saveRule}
                      className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold transition-all hover:bg-indigo-500 disabled:opacity-40"
                      disabled={
                        !newRule.keyword.trim() ||
                        ((newRule.type === 'COMMENT' || newRule.type === 'ALL') && !newRule.reply.trim()) ||
                        ((newRule.type === 'MESSAGE' || newRule.type === 'ALL') && !newRule.dmMessage.trim())
                      }
                    >
                      {editingRuleId ? 'Update Rule' : 'Save Rule'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {rules.length === 0 && !isAdding && (
            <div className="text-center py-12 glass rounded-3xl">
              <Zap className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No automation rules yet</p>
              <p className="text-white/40 text-sm mt-2">Click "Add Rule" to create your first automation</p>
            </div>
          )}

          <div className="space-y-4">
            {rules.map((rule) => (
              <motion.div
                key={rule.ruleId}
                layout
                className="p-5 glass overflow-hidden rounded-2xl flex items-center justify-between group hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-xl ${rule.enabled ? 'bg-indigo-500/20 text-indigo-400 active-glow' : 'bg-white/5 text-white/20'}`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="font-bold text-white">Trigger: <span className="text-indigo-400">"{rule.keyword}"</span></h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/5 font-bold uppercase tracking-wider">
                        {rule.type}
                      </span>
                      {rule.targetMediaId ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {rule.targetMediaCaption ? `${rule.targetMediaCaption.slice(0, 28)}...` : `Post ${rule.targetMediaId.slice(-6)}`}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-semibold flex items-center gap-1">
                          <Globe className="w-3 h-3" /> All Posts
                        </span>
                      )}
                    </div>
                    {rule.replyMessage && (
                      <p className="text-sm text-white/60 mt-1 line-clamp-1">
                        <span className="text-white/30 text-xs uppercase mr-1.5">Comment:</span>
                        {rule.replyMessage}
                      </p>
                    )}
                    {rule.dmMessage && (
                      <p className="text-sm text-indigo-300/80 mt-0.5 line-clamp-1">
                        <span className="text-indigo-400/60 text-xs uppercase mr-1.5">DM:</span>
                        {rule.dmMessage}
                      </p>
                    )}
                    {rule.narration && (
                      <p className="text-xs text-white/40 mt-0.5 italic line-clamp-1">
                        Meaning: {rule.narration}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => toggleRule(rule.ruleId)}
                    className={`w-12 h-6 rounded-full transition-all cursor-pointer relative p-1 ${rule.enabled ? 'bg-indigo-600 active-glow' : 'bg-white/10'}`}
                  >
                    <motion.div 
                      animate={{ x: rule.enabled ? 24 : 0 }}
                      className="w-4 h-4 bg-white rounded-full shadow-sm" 
                    />
                  </div>
                  <button 
                    onClick={() => openEditRule(rule)}
                    title="Edit rule"
                    className="p-2 text-white/30 hover:text-indigo-400 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteRule(rule.ruleId)}
                    title="Delete rule"
                    className="p-2 text-white/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 glass bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-3xl border border-indigo-500/30">
            <h3 className="font-bold text-lg flex items-center gap-2 text-indigo-300">
              <Zap className="w-5 h-5" /> Pro Tip: Smart Matching
            </h3>
            <p className="text-sm mt-4 text-white/70 leading-relaxed">
              InstaFlow uses semantic matching. If a user says "What is the cost?", it will trigger the "price" rule automatically.
            </p>
          </div>

          <div className="glass-darker rounded-3xl p-8">
            <h3 className="font-bold text-white text-sm mb-6 uppercase tracking-widest">Automation Efficiency</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/40">Total Rules</span>
                  <span className="font-bold text-white">{rules.length}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-indigo-500 active-glow" />
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/40">Active Rules</span>
                <span className="font-bold text-green-400">{rules.filter(r => r.enabled).length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/40">AI Accuracy</span>
                <span className="font-bold text-indigo-400">98.2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Instagram Business Posts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Your Instagram Posts</h2>
            <p className="text-white/40 text-sm mt-1">Select any post below to create an auto-reply trigger specifically for that post.</p>
          </div>
          <button
            onClick={loadPosts}
            disabled={postsLoading}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/80 px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${postsLoading ? 'animate-spin' : ''}`} />
            Refresh Posts
          </button>
        </div>

        {postsLoading ? (
          <div className="glass rounded-3xl p-8 text-center text-white/50 text-sm">
            Loading posts from your connected Instagram account...
          </div>
        ) : postsError ? (
          <div className="glass rounded-3xl p-8 text-center text-red-400 text-sm">
            {postsError}
          </div>
        ) : posts.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center text-white/50 text-sm">
            No posts found on your connected Instagram account.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {posts.map((post) => {
              const imageUrl = post.thumbnail_url || post.media_url;
              const postRules = rules.filter((r) => r.targetMediaId === post.id);
              return (
                <div
                  key={post.id}
                  className="glass rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-between hover:border-indigo-500/40 transition-colors"
                >
                  <div>
                    <div className="aspect-square bg-white/5 relative overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={post.caption || 'Instagram post'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <ImageIcon className="w-10 h-10" />
                        </div>
                      )}
                      {postRules.length > 0 && (
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-600/90 text-white shadow">
                          {postRules.length} {postRules.length === 1 ? 'Rule' : 'Rules'}
                        </span>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <p className="text-sm text-white/80 line-clamp-2 min-h-[2.5rem]">
                        {post.caption || 'No caption'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" /> {post.like_count ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" /> {post.comments_count ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => openAddRuleForPost(post.id)}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 py-2.5 rounded-xl text-xs font-bold transition-all"
                    >
                      <Plus className="w-4 h-4" /> Add Trigger for Post
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
                    <h3 className="text-base font-bold text-white">Action Failed</h3>
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
