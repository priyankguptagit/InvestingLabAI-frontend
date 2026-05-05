"use client";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: "Jan", total: 1200 },
  { name: "Feb", total: 2100 },
  { name: "Mar", total: 800 },
  { name: "Apr", total: 1600 },
  { name: "May", total: 900 },
  { name: "Jun", total: 1700 },
  { name: "Jul", total: 2400 }, // Current
];

export function OverviewChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/> {/* Zinc-900 */}
            <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
          </linearGradient>
        </defs>
        
        <XAxis 
          dataKey="name" 
          stroke="#a1a1aa" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          stroke="#a1a1aa" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => `$${value}`} 
        />
        
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
        
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "#18181b", 
            border: "none", 
            borderRadius: "8px", 
            color: "#fff" 
          }}
          itemStyle={{ color: "#fff" }}
          cursor={{ stroke: '#d4d4d8', strokeWidth: 1 }}
        />
        
        <Area 
          type="monotone" 
          dataKey="total" 
          stroke="#18181b" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorTotal)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}