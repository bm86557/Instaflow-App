import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
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
import {
  RefreshCw,
  AlertCircle,
  Users,
  UserPlus,
  Image as ImageIcon,
  Eye,
  TrendingUp,
  Heart,
  MessageCircle,
  ExternalLink,
  Instagram,
  Info
} from 'lucide-react';
import {
  fetchDetailedAnalytics,
  formatNumber,
  formatPercentage,
  DetailedAnalyticsData
} from '../services/InstagramService';

const COLORS = ['#6366f1', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#a855f7'];

export default function AnalyticsDetailed() {
  const [days, setDays] = useState<7 | 30>(7);
  const [data, setData] = useState<DetailedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (range: 7 | 30, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await fetchDetailedAnalytics(range);
      setData(res);
    } catch (err: any) {
      console.error('[AnalyticsDetailed] Error loading analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(days, false);
  }, [days, loadAnalytics]);

  if (loading) {
    return (
      <div className="space-y-8 pb-20">
        <header>
          <h1 className="text-4xl font-bold text-white tracking-tight">Intelligence Terminal</h1>
          <p className="text-white/40 mt-1">Loading live analytics from your connected Instagram account...</p>
        </header>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6 glass rounded-2xl animate-pulse space-y-3">
              <div className="h-4 w-20 bg-white/10 rounded" />
              <div className="h-8 w-16 bg-white/10 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[380px] glass rounded-3xl animate-pulse" />
          <div className="h-[380px] glass rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-8 pb-20">
        <header>
          <h1 className="text-4xl font-bold text-white tracking-tight">Intelligence Terminal</h1>
          <p className="text-white/40 mt-1">Advanced multi-vector analysis of your social presence.</p>
        </header>
        <div className="p-8 glass-darker rounded-3xl border border-red-500/20 flex items-start gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">Failed to Load Analytics</h3>
            <p className="text-sm text-white/60 mb-4">{error || 'No analytics data returned.'}</p>
            <button
              onClick={() => loadAnalytics(days, true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalAgeCount = data.ageDistribution.reduce((sum, item) => sum + item.value, 0);
  const totalMixCount = data.contentMix.reduce((sum, item) => sum + item.value, 0);
  const netGrowth = data.summary.netFollowerChange;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-4xl font-bold text-white tracking-tight">Intelligence Terminal</h1>
            {data.account.username && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold text-white">
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                @{data.account.username}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              {data.account.authProvider === 'instagram' ? 'Instagram Direct' : 'Facebook Page'}
            </span>
          </div>
          <p className="text-white/40 mt-1">Live insights scoped strictly to your currently connected Instagram account.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(e.target.value === '30' ? 30 : 7)}
            className="bg-white/5 text-sm border border-white/10 rounded-xl px-4 py-2.5 outline-none text-white cursor-pointer hover:bg-white/10 transition-colors"
          >
            <option className="bg-slate-900" value={7}>Last 7 Days</option>
            <option className="bg-slate-900" value={30}>Last 30 Days</option>
          </select>
          <button
            onClick={() => loadAnalytics(days, true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Top Account KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 glass rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-4 h-4" /> Followers
          </div>
          <p className="text-2xl font-bold text-white">{formatNumber(data.account.followersCount)}</p>
        </div>
        <div className="p-5 glass rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <UserPlus className="w-4 h-4" /> Following
          </div>
          <p className="text-2xl font-bold text-white">{formatNumber(data.account.followsCount)}</p>
        </div>
        <div className="p-5 glass rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ImageIcon className="w-4 h-4" /> Total Posts
          </div>
          <p className="text-2xl font-bold text-white">{formatNumber(data.account.mediaCount)}</p>
        </div>
        <div className="p-5 glass rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Eye className="w-4 h-4" /> {days}d Reach
          </div>
          <p className="text-2xl font-bold text-white">{formatNumber(data.summary.totalReach)}</p>
        </div>
        <div className="p-5 glass rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-pink-400 text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingUp className="w-4 h-4" /> Engagement
          </div>
          <p className="text-2xl font-bold text-white">{formatPercentage(data.summary.avgEngagementRate)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Audience Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 glass rounded-3xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Audience Growth</h2>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1">
                Daily Net Change ({data.growthSource === 'meta' ? 'Meta Insights' : 'Daily Snapshots'})
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full border ${netGrowth >= 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              <span className="text-xs font-bold">{netGrowth >= 0 ? `+${netGrowth}` : netGrowth}</span>
            </div>
          </div>

          {data.growthUnavailableReason && data.growthSource !== 'meta' && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>{data.growthUnavailableReason}</span>
            </div>
          )}

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeSeries}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} dy={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="followersChange" name="Net Followers" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Age Distribution / Content Mix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 glass rounded-3xl"
        >
          <h2 className="text-xl font-bold text-white mb-1">Age Distribution</h2>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-6">Follower Segmentation</p>

          {data.ageDistribution.length > 0 ? (
            <div className="h-[280px] flex items-center">
              <div className="flex-1 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.ageDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.ageDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-44 space-y-3">
                {data.ageDistribution.map((item, i) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[11px] font-bold text-white/70">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-white">{item.value}</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${totalAgeCount > 0 ? (item.value / totalAgeCount) * 100 : 0}%`,
                          backgroundColor: COLORS[i % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-center px-6 space-y-4">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-indigo-300">
                <Info className="w-6 h-6" />
              </div>
              <p className="text-sm text-white/70 max-w-sm">
                {data.demographicsUnavailableReason || 'Age demographics are not yet available from Instagram for this account.'}
              </p>
              {data.contentMix.length > 0 && (
                <div className="w-full pt-4 border-t border-white/10 space-y-2.5 text-left">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Your Actual Content Mix</p>
                  {data.contentMix.map((item, i) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70">{item.name}</span>
                        <span className="font-bold text-white">{item.value}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${totalMixCount > 0 ? (item.value / totalMixCount) * 100 : 0}%`,
                            backgroundColor: COLORS[i % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Reach vs Engagement Velocity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-8 glass-darker rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Reach vs Engagement Velocity</h2>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1">
                Last {days} Days Multi-variable Correlation
              </p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-cyan-500" />
                <span className="text-[10px] font-bold text-white/60 uppercase">Daily Reach</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-pink-500" />
                <span className="text-[10px] font-bold text-white/60 uppercase">Post Engagement</span>
              </div>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} dy={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Line type="monotone" dataKey="reach" name="Daily Reach" stroke="#06b6d4" strokeWidth={3} dot={{ r: 3, fill: '#06b6d4' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="engagement" name="Engagement" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3, fill: '#ec4899' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Performing Posts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 p-8 glass rounded-3xl space-y-5"
        >
          <div>
            <h2 className="text-xl font-bold text-white">Top Performing Posts</h2>
            <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1">
              Ranked by Total Engagement (Likes + Comments)
            </p>
          </div>

          {data.topPosts.length === 0 ? (
            <p className="text-sm text-white/40 py-6 text-center">No posts found on @{data.account.username} yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-white/5 overflow-hidden flex-shrink-0 border border-white/10 flex items-center justify-center">
                      {post.imageUrl ? (
                        <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-white/30" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white line-clamp-1">
                        {post.caption || 'No caption'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                        <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-white/5">{post.mediaType}</span>
                        {post.timestamp && <span>{new Date(post.timestamp).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-pink-300">
                      <Heart className="w-4 h-4" /> {post.likes}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-indigo-300">
                      <MessageCircle className="w-4 h-4" /> {post.comments}
                    </div>
                    {post.permalink && (
                      <a
                        href={post.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
                        title="Open on Instagram"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
