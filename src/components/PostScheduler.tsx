import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { 
  Plus, 
  Image as ImageIcon, 
  Video, 
  Calendar as CalendarIcon, 
  Clock, 
  Hash, 
  MapPin,
  X,
  Send,
  BarChart2,
  CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';

export default function PostScheduler() {
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isStory, setIsStory] = useState(false);
  const [hasPoll, setHasPoll] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'video/*': ['.mp4', '.mov']
    }
  } as any);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate scheduling
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setFiles([]);
      setCaption('');
      setScheduledDate('');
      setScheduledTime('');
    }, 3000);
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
            onClick={() => setIsStory(!isStory)}
            className={clsx(
              "px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
              isStory ? "bg-white text-indigo-600 active-glow" : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10",
            )}
          >
            Story Mode
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Media Upload Area */}
          <div 
            {...getRootProps()} 
            className={clsx(
              "relative border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer min-h-[400px]",
              isDragActive ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 glass-darker hover:border-white/20"
            )}
          >
            <input {...getInputProps()} />
            <div className="p-5 bg-indigo-500/20 text-indigo-400 rounded-2xl mb-6 active-glow">
              <Plus className="w-10 h-10" />
            </div>
            <p className="text-xl font-bold text-white uppercase tracking-tighter">Upload Creative Assets</p>
            <p className="text-sm text-white/30 mt-2 font-medium">JPG, PNG, MP4 (Max 50MB)</p>
            
            <AnimatePresence>
              {files.length > 0 && (
                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 w-full px-4">
                  {files.map((file, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative aspect-square group rounded-2xl overflow-hidden glass border border-white/10"
                    >
                      {file.type.startsWith('image') ? (
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                          <Video className="text-white/40 w-8 h-8" />
                        </div>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Caption & Controls */}
          <div className="glass rounded-3xl overflow-hidden shadow-2xl border border-white/5">
            <textarea
              placeholder="Write your caption here... Use AI to improve it! ✨"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full h-48 p-8 bg-transparent resize-none focus:outline-none text-white text-lg placeholder:text-white/10"
            />
            <div className="p-4 flex items-center gap-6 bg-white/5 border-t border-white/5">
              <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors">
                <Hash className="w-4 h-4" /> Tags
              </button>
              <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors">
                <MapPin className="w-4 h-4" /> Location
              </button>
              <button 
                onClick={() => setHasPoll(!hasPoll)}
                className={clsx(
                  "flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors",
                  hasPoll ? "text-indigo-400" : "text-white/30 hover:text-white"
                )}
              >
                <BarChart2 className="w-4 h-4" /> Add Poll
              </button>
            </div>
          </div>
        </div>

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
                <div className="w-12 h-6 bg-indigo-600 rounded-full relative p-1 cursor-pointer active-glow">
                  <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-md" />
                </div>
              </div>
              <p className="text-[10px] text-white/30 leading-relaxed uppercase font-medium">Content will be pushed live automatically.</p>
            </div>

            <button 
              onClick={handleSchedule}
              disabled={files.length === 0 || !scheduledDate || !scheduledTime}
              className="w-full bg-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed text-indigo-900 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-3"
            >
              {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <Send className="w-5 h-5" />}
              {isSuccess ? "Locked In" : "Schedule Mission"}
            </button>
          </div>

          <div className="p-8 glass rounded-3xl border border-indigo-500/20 bg-indigo-500/5">
            <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-2 uppercase tracking-widest">
              💡 Intelligence Note
            </h4>
            <p className="text-[11px] text-white/50 mt-4 leading-relaxed font-medium">
              Engagement predictions indicate <span className="text-indigo-300 font-black">6 PM - 9 PM</span> is the optimal window for your current audience cluster.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
