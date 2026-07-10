import { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Clock, Target, Activity } from 'lucide-react';
import { StatCard } from '@/shared/components/ui/StatCard';

const PIE_COLORS = ['#8b93f8', '#5eead4', '#f5c76a', '#f9a8d4', '#93c5fd'];

const CHART_TOOLTIP = {
  backgroundColor: 'rgba(20, 22, 34, 0.92)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '14px',
  color: '#f8fafc',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
};

const CHART_AXIS = '#8b92a8';
const CHART_GRID = 'rgba(128, 128, 160, 0.12)';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${breakpoint}px)`).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isMobile;
}

export function AnalyticsWorkspace({ user }) {
  const isMobile = useIsMobile();

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
      name: name.length > 18 ? `${name.slice(0, 16)}…` : name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    const hours = Math.floor(totalMins / 60);
    const mins = Math.floor(totalMins % 60);

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

    return {
      totalTimeStr: hours > 0 ? `${hours}h ${mins}m` : `${mins} Mins`,
      mockCount: user?.mockProgress?.length || 0,
      syllabusCount: user?.progress?.length || 0,
      mockScores,
      pieData,
      barData: Object.values(last7DaysMap)
    };
  }, [user]);

  const pieOuter = isMobile ? 72 : 105;
  const pieInner = isMobile ? 44 : 70;

  return (
    <div className="study-workspace">
      <div className="workspace-header-sticky">
        <div className="section-header">
          <div>
            <h1>Insights & Analytics</h1>
            <p>Visualize your study time, mock progression, and engagement scale.</p>
          </div>
        </div>
      </div>

      <div className="workspace-scrollable-content">
        <div className="stats-row">
          <StatCard icon={Clock} label="Total Time on Mock" value={analyticsData.totalTimeStr} variant="mint" />
          <StatCard icon={Target} label="Total Mocks Given" value={analyticsData.mockCount} variant="blue" />
          <StatCard icon={Activity} label="Syllabus Tests Taken" value={analyticsData.syllabusCount} variant="peach" />
        </div>

        <div className="analytics-charts-grid">
          <div className="chart-container">
            <h3>Daily Study Time (Last 7 Days)</h3>
            <div className="chart-plot">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.barData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.75} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                  <XAxis dataKey="name" stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} width={36} />
                  <RechartsTooltip
                    contentStyle={CHART_TOOLTIP}
                    formatter={(value) => [`${Math.round(value)} Mins`, 'Time Spent']}
                    cursor={{ fill: 'rgba(129, 140, 248, 0.08)' }}
                  />
                  <Bar dataKey="minutes" fill="url(#colorBar)" radius={[8, 8, 8, 8]} barSize={isMobile ? 22 : 32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-container">
            <h3>Top 5 Practiced Topics</h3>
            {analyticsData.pieData.length > 0 ? (
              <div className="chart-plot chart-plot--pie">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                    <Pie
                      data={analyticsData.pieData}
                      cx="50%"
                      cy={isMobile ? '40%' : '46%'}
                      innerRadius={pieInner}
                      outerRadius={pieOuter}
                      paddingAngle={4}
                      cornerRadius={8}
                      dataKey="value"
                      nameKey="name"
                      stroke="none"
                    >
                      {analyticsData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      layout="horizontal"
                      height={isMobile ? 80 : 56}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: isMobile ? 11 : 12, color: 'var(--text-secondary)', paddingTop: 4 }}
                      formatter={(value) => (
                        <span style={{ color: 'var(--text-secondary)', maxWidth: isMobile ? 90 : 140, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                          {value}
                        </span>
                      )}
                    />
                    <RechartsTooltip contentStyle={CHART_TOOLTIP} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="chart-empty">No syllabus tests taken yet.</div>
            )}
          </div>
        </div>

        <div className="chart-container chart-container--full">
          <h3>Mock Score Progression</h3>
          {analyticsData.mockScores.length > 0 ? (
            <div className="chart-plot chart-plot--tall">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.mockScores} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                  <XAxis dataKey="name" stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke={CHART_AXIS} fontSize={12} domain={[0, 200]} tickLine={false} axisLine={false} width={36} />
                  <RechartsTooltip contentStyle={CHART_TOOLTIP} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    name="Score"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    activeDot={{ r: 6, fill: 'var(--color-primary)', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="chart-empty">Not enough mock data to show progression.</div>
          )}
        </div>
      </div>
    </div>
  );
}
