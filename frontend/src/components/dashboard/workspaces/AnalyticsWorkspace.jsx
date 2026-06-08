import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
   AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Clock, Target, Activity } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

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
        <div className="section-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>
              Insights & Analytics
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Visualize your study time, mock progression, and engagement scale.</p>
          </div>
        </div>
      </div>

      <div className="workspace-scrollable-content">
      {/* Top Stats */}
      <div className="stats-row" style={{ marginBottom: '30px' }}>
        <div className="stat-box" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <span className="stat-label" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} /> Total Time on Mock
          </span>
          <span className="stat-val" style={{ color: '#10b981', fontSize: '2rem', marginTop: '8px' }}>{analyticsData.totalTimeStr}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={16} /> Total Mocks Given
          </span>
          <span className="stat-val" style={{ color: '#3b82f6', marginTop: '8px' }}>{analyticsData.mockCount}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={16} /> Syllabus Tests Taken
          </span>
          <span className="stat-val" style={{ color: '#f1c40f', marginTop: '8px' }}>{analyticsData.syllabusCount}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Weekly Activity Bar Chart */}
        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>Daily Study Time (Last 7 Days)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={analyticsData.barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  formatter={(value) => [`${Math.round(value)} Mins`, 'Time Spent']}
                />
                <Bar dataKey="minutes" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Syllabus Topic Distribution */}
        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>Top 5 Practiced Topics</h3>
          {analyticsData.pieData.length > 0 ? (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={analyticsData.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#64748b' }}
                  >
                    {analyticsData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No syllabus tests taken yet.
            </div>
          )}
        </div>
      </div>

      {/* Mock Progression Chart */}
      <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>Mock Score Progression</h3>
        {analyticsData.mockScores.length > 0 ? (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={analyticsData.mockScores} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={12} domain={[0, 200]} tickLine={false} axisLine={false} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
                  itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="score" name="Score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
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
