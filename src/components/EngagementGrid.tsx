import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, MessageCircle, Send, MoreHorizontal, Check } from 'lucide-react';
import { MOCK_COMMENTS } from '../constants';
import { generateSmartReply } from '../services/aiService';

export default function EngagementGrid() {
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSmartReply = async (commentId: string, text: string) => {
    setIsGenerating(true);
    const aiReply = await generateSmartReply(text);
    setReplyText(aiReply);
    setIsGenerating(false);
  };

  const submitReply = (id: string) => {
    setComments(comments.map(c => c.id === id ? { ...c, replied: true } : c));
    setReplyingTo(null);
    setReplyText('');
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold text-white tracking-tight">Personalized Engagement</h1>
        <p className="text-white/40 mt-1">Directly engage with your audience. Use AI for faster responses.</p>
      </header>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {comments.map((comment) => (
          <motion.div 
            key={comment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="break-inside-avoid glass rounded-2xl p-6 shadow-xl hover:bg-white/10 transition-all border border-white/5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white border border-white/20">
                  {comment.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm text-white">@{comment.username}</p>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Subscriber</p>
                </div>
              </div>
              <button className="text-white/30 hover:text-white transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-white/70 text-sm leading-relaxed">
              {comment.text}
            </p>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-6">
              <button className="flex items-center gap-2 text-white/40 hover:text-pink-400 transition-colors text-xs font-bold uppercase tracking-widest leading-none">
                <Heart className="w-4 h-4" /> Like
              </button>
              <button 
                onClick={() => setReplyingTo(comment.id)}
                className="flex items-center gap-2 text-white/40 hover:text-indigo-400 transition-colors text-xs font-bold uppercase tracking-widest leading-none"
              >
                <MessageCircle className="w-4 h-4" /> {comment.replied ? 'Replied' : 'Reply'}
              </button>
              <span className="ml-auto text-[10px] text-white/20 font-bold tracking-tighter uppercase tabular-nums">2h ago</span>
            </div>

            {replyingTo === comment.id && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-white/10 space-y-4"
              >
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  className="w-full bg-white/5 rounded-xl p-4 text-sm outline-none text-white border border-white/10 resize-none h-24 focus:bg-white/10 transition-colors"
                />
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => handleSmartReply(comment.id, comment.text)}
                    disabled={isGenerating}
                    className="text-[10px] bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 px-4 py-2 rounded-full font-bold uppercase tracking-wider flex items-center gap-2 transition-colors active-glow"
                  >
                    {isGenerating ? "Processing..." : "✨ AI Agent Suggest"}
                  </button>
                  <button 
                    onClick={() => submitReply(comment.id)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {comment.replied && !replyingTo && (
              <div className="mt-4 flex items-center gap-2 text-[10px] text-green-400 font-bold uppercase tracking-widest px-3 py-1 bg-green-500/10 rounded-full w-fit">
                <Check className="w-3 h-3" /> Auto-Replied
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
