import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  Eye, 
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import {
  fetchAllStats,
  fetchDashboardOverview,
  formatNumber,
  formatPercentage,
  DashboardOverviewData
} from '../services/InstagramService';

interface Stats {
  followers: number;
  engagementRate: number;
  weeklyReach: number;
  autoReplies: number;
  lastUpdated?: string;
}

export default function Dashboard() {
  // State management
  const [stats, setStats] = useState<Stats | null>(null);
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [daysRange, setDaysRange] = useState<7 | 30>(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch stats function
  const loadStats = async (isRefresh = false, range: 7 | 30 = daysRange) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('[Dashboard] Fetching real Instagram stats & overview...');
      const [statsData, overviewData] = await Promise.all([
        fetchAllStats(),
        fetchDashboardOverview(range)
      ]);

      setStats(statsData);
      setOverview(overviewData);
    } catch (err: any) {
      console.error('[Dashboard] Error loading stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadStats(false, daysRange);
  }, [daysRange]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[Dashboard] Auto-refreshing stats...');
      loadStats(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Manual refresh handler
  const handleRefresh = () => {
    loadStats(true);
  };

  // Format last updated time
  const formatLastUpdated = (timestamp?: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return date.toLocaleString();
  };

  // Build stats array with real data
  const STATS = stats ? [
    { 
      label: 'Total Followers', 
      value: formatNumber(stats.followers), 
      rawValue: stats.followers,
      subLabel: 'Connected account', 
      icon: Users, 
      color: 'text-blue-500' 
    },
    { 
      label: 'Engagement Rate', 
      value: formatPercentage(stats.engagementRate), 
      rawValue: stats.engagementRate,
      subLabel: `Across ${overview?.postsCount ?? 0} posts`, 
      icon: TrendingUp, 
      color: 'text-purple-500' 
    },
    { 
      label: 'Weekly Reach', 
      value: formatNumber(stats.weeklyReach), 
      rawValue: stats.weeklyReach,
      subLabel: 'Last 7 days', 
      icon: Eye, 
      color: 'text-pink-500' 
    },
    { 
      label: 'Auto-Replies', 
      value: formatNumber(stats.autoReplies), 
      rawValue: stats.autoReplies,
      subLabel: `${overview?.activeAutomations ?? 0} rules active`, 
      icon: MessageCircle, 
      color: 'text-green-500' 
    },
  ] : [];

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-4xl font-bold text-white tracking-tight">System Overview</h1>
          <p className="text-white/40 mt-1">Loading your statistics...</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 glass rounded-2xl relative overflow-hidden"
            >
              <div className="animate-pulse space-y-4">
                <div className="h-10 w-10 bg-white/10 rounded-lg" />
                <div className="h-4 w-24 bg-white/10 rounded" />
                <div className="h-8 w-16 bg-white/10 rounded" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-4xl font-bold text-white tracking-tight">System Overview</h1>
          <p className="text-white/40 mt-1">Failed to load statistics</p>
        </header>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 glass-darker rounded-3xl border border-red-500/20"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">Error Loading Statistics</h3>
              <p className="text-white/60 text-sm mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">System Overview</h1>
          <p className="text-white/40 mt-1">
            {overview?.activeAutomations ?? 0} Automations active • {overview?.postsCount ?? 0} Instagram posts
            {stats?.lastUpdated && (
              <span className="ml-3">• Updated {formatLastUpdated(stats.lastUpdated)}</span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 glass rounded-2xl relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <button className="text-white/30 hover:text-white transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-white/40 uppercase tracking-widest">{stat.label}</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-3xl font-bold text-white">{stat.value}</span>
                <span className="text-xs font-medium text-white/40 mb-1.5">
                  {stat.subLabel}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 p-8 glass rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-white">Engagement Pulse</h2>
              <p className="text-sm text-white/40">Past {daysRange} days performance</p>
            </div>
            <select
              value={daysRange}
              onChange={(e) => setDaysRange(e.target.value === '30' ? 30 : 7)}
              className="bg-white/5 text-sm border border-white/10 rounded-lg px-3 py-2 outline-none text-white cursor-pointer hover:bg-white/10 transition-colors"
            >
              <option className="bg-slate-900" value={7}>Last 7 Days</option>
              <option className="bg-slate-900" value={30}>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview?.engagementSeries || []}>
                <defs>
                  <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: '#ec4899' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="engagement" 
                  stroke="#ec4899" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorEngagement)" 
                  className="active-glow"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-8 glass-darker rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">Live Activity</h2>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div className="space-y-6">
            {(!overview?.recentActivity || overview.recentActivity.length === 0) ? (
              <div className="text-center py-8 text-white/40 text-sm">
                No recent comments or auto-replies yet.
              </div>
            ) : (
              overview.recentActivity.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex-shrink-0 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                    <MessageCircle className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white/80 truncate">
                        <span className="font-bold text-white">@{item.username}</span> commented
                      </p>
                      {item.replyStatus === 'sent' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                          Replied
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest mt-0.5">
                      {formatLastUpdated(item.timestamp)}
                    </p>
                    <div className="mt-2 p-3 bg-white/5 rounded-xl text-xs italic text-white/60 line-clamp-2 border border-white/5">
                      "{item.text}"
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-8 py-3 text-sm font-bold text-white/40 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5">
            View All Activity
          </button>
        </motion.div>
      </div>
    </div>
  );
}
