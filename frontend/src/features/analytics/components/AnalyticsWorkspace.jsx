import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
   AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Clock, Target, Activity } from 'lucide-react';

const COLORS = ['url(#colorPrimary)', 'url(#colorSuccess)', 'url(#colorWarning)', '#bf4800', '#ff3b30'];

const CHART_TOOLTIP = {
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  color: '#f8fafc',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
};

const CHART_AXIS = '#71717a';
const CHART_GRID = 'rgba(255, 255, 255, 0.05)';

export function AnalyticsWorkspace({ user }) {
  const analyticsData = useMemo(() => {
    let totalMins = 0;
    const mockScores = [];
    const topicDistribution = {};
    
    const parseTime = (timeStr) => {
      if (!timeStr || timeStr === 'N/A') return 0;
      let m = 0;
      const minsMatch = timeStr.match(/(\d+)\s*Mins/i);
      const secsMatch = timeStr.match(/(\d+)\s*Secs/i);
      if (minsMatch) m += parseInt(minsMatch[1], 10);
      if (secsMatch) m += parseInt(secsMatch[1], 10) / 60;
      return m;
    };

    // Process Mock Progress
    if (user?.mockProgress) {
      user.mockProgress.forEach((mock, index) => {
        totalMins += parseTime(mock.elapsedTime);
        mockScores.push({
          name: `Mock ${index + 1}`,
          score: mock.score,
          accuracy: mock.accuracy
        });
      });
    }

    // Process Syllabus Progress
    if (user?.progress) {
      user.progress.forEach((prog) => {
        totalMins += parseTime(prog.elapsedTime);
        if (!topicDistribution[prog.topicId]) {
          topicDistribution[prog.topicId] = 0;
        }
        topicDistribution[prog.topicId] += 1;
      });
    }

    const pieData = Object.entries(topicDistribution).map(([name, value]) => ({
      name: name.substring(0, 15) + (name.length > 15 ? '...' : ''),
      value
    })).sort((a,b) => b.value - a.value).slice(0, 5); // Top 5 topics

    const hours = Math.floor(totalMins / 60);
    const mins = Math.floor(totalMins % 60);

    // Calculate Last 7 Days Activity
    const last7DaysMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { weekday: 'short' });
      last7DaysMap[dateStr] = { name: displayDate, minutes: 0 };
    }

    const processDate = (prog) => {
      if (!prog.timestamp) return;
      const d = new Date(prog.timestamp);
      const dateStr = d.toISOString().split('T')[0];
      if (last7DaysMap[dateStr]) {
        last7DaysMap[dateStr].minutes += parseTime(prog.elapsedTime);
      }
    };

    if (user?.mockProgress) user.mockProgress.forEach(processDate);
    if (user?.progress) user.progress.forEach(processDate);

    const barData = Object.values(last7DaysMap);

    return {
      totalTimeStr: hours > 0 ? `${hours}h ${mins}m` : `${mins} Mins`,
      mockCount: user?.mockProgress?.length || 0,
      syllabusCount: user?.progress?.length || 0,
      mockScores,
      pieData,
      barData
    };
  }, [user]);

  return (
    <div className="study-workspace">
      <div className="workspace-header-sticky">
        <div className="section-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Insights & Analytics
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '6px' }}>Visualize your study time, mock progression, and engagement scale.</p>
          </div>
        </div>
      </div>

      <div className="workspace-scrollable-content">
      {/* Top Stats */}
      <div className="stats-row" style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div className="stat-box" style={{ background: 'linear-gradient(135deg, rgba(52, 199, 89, 0.1) 0%, rgba(52, 199, 89, 0.02) 100%)', border: '1px solid rgba(52, 199, 89, 0.2)', borderRadius: '24px', padding: '24px', backdropFilter: 'blur(10px)' }}>
          <span className="stat-label" style={{ color: '#28a745', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Clock size={18} /> Total Time on Mock
          </span>
          <span className="stat-val" style={{ color: '#28a745', fontSize: '2.5rem', fontWeight: '700', marginTop: '12px', display: 'block', letterSpacing: '-0.03em' }}>{analyticsData.totalTimeStr}</span>
        </div>
        <div className="stat-box" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '24px', backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow-sm)' }}>
          <span className="stat-label" style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Target size={18} /> Total Mocks Given
          </span>
          <span className="stat-val" style={{ color: 'var(--color-primary)', fontSize: '2.5rem', fontWeight: '700', marginTop: '12px', display: 'block', letterSpacing: '-0.03em' }}>{analyticsData.mockCount}</span>
        </div>
        <div className="stat-box" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '24px', backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow-sm)' }}>
          <span className="stat-label" style={{ color: '#ff9f0a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Activity size={18} /> Syllabus Tests Taken
          </span>
          <span className="stat-val" style={{ color: '#ff9f0a', fontSize: '2.5rem', fontWeight: '700', marginTop: '12px', display: 'block', letterSpacing: '-0.03em' }}>{analyticsData.syllabusCount}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Weekly Activity Bar Chart */}
        <div className="chart-container" style={{ background: 'var(--glass-bg)', padding: '24px', borderRadius: '32px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-premium)', backdropFilter: 'blur(20px)' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '24px', fontSize: '1.25rem', fontWeight: '600' }}>Daily Study Time (Last 7 Days)</h3>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={analyticsData.barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34c759" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#28a745" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="name" stroke={CHART_AXIS} fontSize={13} tickLine={false} axisLine={false} dy={10} fontFamily="var(--font-sans)" />
                <YAxis stroke={CHART_AXIS} fontSize={13} tickLine={false} axisLine={false} dx={-10} fontFamily="var(--font-sans)" />
                <RechartsTooltip 
                  contentStyle={CHART_TOOLTIP}
                  itemStyle={{ color: '#34c759', fontWeight: '600', fontFamily: 'var(--font-sans)' }}
                  labelStyle={{ color: '#86868b', marginBottom: '4px', fontFamily: 'var(--font-sans)' }}
                  formatter={(value) => [`${Math.round(value)} Mins`, 'Time Spent']}
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                />
                <Bar dataKey="minutes" fill="url(#colorBar)" radius={[8, 8, 8, 8]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Syllabus Topic Distribution */}
        <div className="chart-container" style={{ background: 'var(--glass-bg)', padding: '24px', borderRadius: '32px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-premium)', backdropFilter: 'blur(20px)' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '24px', fontSize: '1.25rem', fontWeight: '600' }}>Top 5 Practiced Topics</h3>
          {analyticsData.pieData.length > 0 ? (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <PieChart>
                  <defs>
                    <linearGradient id="colorPrimary" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#0071e3" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#005bb5" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#34c759" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#28a745" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="colorWarning" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ff9f0a" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#e08900" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <Pie
                    data={analyticsData.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={110}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: CHART_AXIS, strokeWidth: 1 }}
                  >
                    {analyticsData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={CHART_TOOLTIP}
                    itemStyle={{ color: '#1d1d1f', fontWeight: '600', fontFamily: 'var(--font-sans)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No syllabus tests taken yet.
            </div>
          )}
        </div>
      </div>

      {/* Mock Progression Chart */}
      <div className="chart-container" style={{ background: 'var(--glass-bg)', padding: '24px', borderRadius: '32px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-premium)', backdropFilter: 'blur(20px)', marginBottom: '32px' }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '24px', fontSize: '1.25rem', fontWeight: '600' }}>Mock Score Progression</h3>
        {analyticsData.mockScores.length > 0 ? (
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer>
              <AreaChart data={analyticsData.mockScores} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0071e3" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0071e3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="name" stroke={CHART_AXIS} fontSize={13} tickLine={false} axisLine={false} dy={10} fontFamily="var(--font-sans)" />
                <YAxis stroke={CHART_AXIS} fontSize={13} domain={[0, 200]} tickLine={false} axisLine={false} dx={-10} fontFamily="var(--font-sans)" />
                <RechartsTooltip 
                  contentStyle={CHART_TOOLTIP}
                  itemStyle={{ color: '#0071e3', fontWeight: '600', fontFamily: 'var(--font-sans)' }}
                  labelStyle={{ color: '#86868b', marginBottom: '4px', fontFamily: 'var(--font-sans)' }}
                />
                <Area type="monotone" dataKey="score" name="Score" stroke="var(--color-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 8, fill: 'var(--color-primary)', stroke: '#fff', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Not enough mock data to show progression.
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
