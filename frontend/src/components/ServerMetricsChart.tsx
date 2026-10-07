"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ServerMetricsChartProps {
  history?: any[];
  current?: any;
}

export default function ServerMetricsChart({ history, current }: ServerMetricsChartProps) {
  const data: any[] = ((history || []).length > 0 ? history : (current ? [current] : [])) || [];
  if (!data.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6 text-center">
        <p className="text-sm font-medium text-slate-700">Live monitoring not available</p>
        <p className="text-xs text-slate-500 mt-1">Install monitoring agent on the server for graphs.</p>
      </div>
    );
  }

  const formatted = data.map((d: any, i: number) => ({
    time: d.time || `T-${data.length - i}`,
    cpu: d.cpu ?? d.cpuPercent ?? 0,
    ram: d.ram ?? d.memoryPercent ?? 0,
    netIn: d.netIn ?? d.networkIn ?? 0,
    netOut: d.netOut ?? d.networkOut ?? 0,
  }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
      <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Server Monitoring</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} />
            <Line type="monotone" dataKey="cpu" stroke="#00b7ff" strokeWidth={2} dot={false} name="CPU %" />
            <Line type="monotone" dataKey="ram" stroke="#00ff88" strokeWidth={2} dot={false} name="RAM %" />
            <Line type="monotone" dataKey="netIn" stroke="#b500ff" strokeWidth={2} dot={false} name="Net In" />
            <Line type="monotone" dataKey="netOut" stroke="#ff007f" strokeWidth={2} dot={false} name="Net Out" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
