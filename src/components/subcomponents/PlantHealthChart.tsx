import React from 'react';
import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LineChart } from 'lucide-react';
import { HealthHistoryEntry } from '../../services/firebase';

interface PlantHealthChartProps {
  healthHistory: HealthHistoryEntry[];
}

export const PlantHealthChart: React.FC<PlantHealthChartProps> = ({ healthHistory }) => {
  if (!healthHistory || healthHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted space-y-2">
        <LineChart className="w-8 h-8 opacity-20" />
        <p className="text-[10px] uppercase font-bold tracking-widest">No Trend Data Yet</p>
      </div>
    );
  }

  const data = healthHistory.map(h => ({
    date: h.createdAt?.toDate ? h.createdAt.toDate().toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'Now',
    score: h.healthScore,
    note: h.note,
    mood: h.mood
  }));

  return (
    <div className="h-48 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            domain={[0, 100]} 
            stroke="#6b7280" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            hide
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="glass-card p-3 border-green-500/30 shadow-glow-green text-[10px] space-y-1 z-50">
                    <p className="font-bold text-primary">{data.date}</p>
                    <p className="text-green-400 font-bold text-sm">Health: {data.score}%</p>
                    <p className="text-teal-400 uppercase font-bold tracking-widest">{data.mood}</p>
                    {data.note && <p className="text-secondary italic border-t border-white/10 pt-1 mt-1 max-w-[150px] leading-snug">{data.note}</p>}
                  </div>
                );
              }
              return null;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#4ade80" 
            strokeWidth={3} 
            dot={{ fill: '#4ade80', r: 4, strokeWidth: 2, stroke: '#0a0a0a' }}
            activeDot={{ r: 6, fill: '#4ade80', stroke: '#fff' }}
            animationDuration={1500}
          />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
};
