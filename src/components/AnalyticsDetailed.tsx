import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { MOCK_ANALYTICS } from '../constants';

const PIE_DATA = [
  { name: '18-24', value: 400 },
  { name: '25-34', value: 300 },
  { name: '35-44', value: 200 },
  { name: '45+', value: 100 },
];

const COLORS = ['#6366f1', '#ec4899', '#06b6d4', '#f59e0b'];

export default function AnalyticsDetailed() {
  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-4xl font-bold text-white tracking-tight">Intelligence Terminal</h1>
        <p className="text-white/40 mt-1">Advanced multi-vector analysis of your social presence.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Growth Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 glass rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-white">Audience Growth</h2>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1">Daily Net Change</p>
            </div>
            <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <span className="text-[10px] font-bold text-green-400">+12.4%</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_ANALYTICS}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                />
                <Area type="monotone" dataKey="followers" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorGrowth)" className="active-glow" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Demographics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 glass rounded-3xl"
        >
          <h2 className="text-xl font-bold text-white mb-2">Age Distribution</h2>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1 mb-8">Follower Segmentation</p>
          <div className="h-[300px] flex items-center">
            <div className="flex-1 h-full">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={PIE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    >
                    {PIE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="active-glow" />
                    ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                    />
                </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="w-40 space-y-4">
              {PIE_DATA.map((item, i) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: COLORS[i], backgroundColor: COLORS[i] }} />
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-white">{item.value}</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${(item.value/1000)*100}%`, backgroundColor: COLORS[i] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Global Reach */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-8 glass-darker rounded-3xl"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-xl font-bold text-white">Reach vs Engagement Velocity</h2>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1">Multi-variable Correlation</p>
            </div>
            <div className="flex gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                    <span className="text-[10px] font-bold text-white/60 uppercase">Total Reach</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                    <span className="text-[10px] font-bold text-white/60 uppercase">Engagement</span>
                </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_ANALYTICS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                />
                <Line type="monotone" dataKey="reach" stroke="#06b6d4" strokeWidth={4} dot={{ r: 4, strokeWidth: 0, fill: '#06b6d4' }} activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }} className="active-glow" />
                <Line type="monotone" dataKey="engagement" stroke="#ec4899" strokeWidth={2} dot={{ r: 4, strokeWidth: 0, fill: '#ec4899' }} activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
