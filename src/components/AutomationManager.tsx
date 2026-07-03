import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2,
  Zap
} from 'lucide-react';
import * as automationService from '../services/automationService';
import { AutomationRule } from '../types/automationTypes';

export default function AutomationManager() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newRule, setNewRule] = useState({ keyword: '', reply: '', type: 'COMMENT' });

  useEffect(() => {
    loadRules();
  }, []);

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

  const addRule = async () => {
    if (!newRule.keyword || !newRule.reply) return;
    
    try {
      const createdRule = await automationService.createRule({
        keyword: newRule.keyword,
        replyMessage: newRule.reply,
        type: newRule.type as any
      });
      
      setRules([createdRule, ...rules]);
      setIsAdding(false);
      setNewRule({ keyword: '', reply: '', type: 'COMMENT' });
    } catch (err: any) {
      alert('Failed to create rule: ' + err.message);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await automationService.deleteRule(id);
      setRules(rules.filter(r => r.ruleId !== id));
    } catch (err: any) {
      alert('Failed to delete rule: ' + err.message);
    }
  };

  const toggleRule = async (id: string) => {
    try {
      const updatedRule = await automationService.toggleRule(id);
      setRules(rules.map(r => r.ruleId === id ? updatedRule : r));
    } catch (err: any) {
      alert('Failed to toggle rule: ' + err.message);
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
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" /> Add Rule
        </button>
      </header>

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
                <h3 className="text-lg font-bold text-white mb-6">New Automation Rule</h3>
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
                        <option className="bg-slate-900" value="ALL">Both</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Auto-Reply Message</label>
                    <textarea 
                      placeholder="What should InstaFlow say?"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none text-white h-28 resize-none focus:bg-white/10 transition-colors"
                      value={newRule.reply}
                      onChange={(e) => setNewRule({...newRule, reply: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      onClick={() => setIsAdding(false)}
                      className="px-6 py-2.5 text-sm font-bold text-white/40 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={addRule}
                      className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold transition-all hover:bg-indigo-500"
                      disabled={!newRule.keyword || !newRule.reply}
                    >
                      Save Rule
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
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-white">Trigger: <span className="text-indigo-400">"{rule.keyword}"</span></h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/5 font-bold uppercase tracking-wider">
                        {rule.type}
                      </span>
                    </div>
                    <p className="text-sm text-white/50 mt-1 line-clamp-1">{rule.replyMessage}</p>
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
                    onClick={() => deleteRule(rule.ruleId)}
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
    </div>
  );
}
