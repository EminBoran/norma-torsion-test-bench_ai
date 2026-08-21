import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTestBench } from '../context/TestBenchContext';
import { Activity, Zap, Play, Square, Gauge, Database, CheckCircle2 } from 'lucide-react';

export default function TorqueCalibration() {
  const {
    x3Status,
    x5Status,
    activeProgram,
    liveTorque,
    maxTorque,
    targetTorque,
    sampleCount,
    torqueData,
    motorPosition,
    motorRevolutions,
    toggleX3,
    triggerX5,
  } = useTestBench();

  const isX3Running = x3Status === 'running';
  const isX5Recording = x5Status === 'recording' || x5Status === 'triggering';

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Clean Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Live Torque */}
        <div className="p-5 rounded-sm bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live Drehmoment</span>
            <span className={`w-2 h-2 rounded-full ${isX3Running ? 'bg-indigo-600' : 'bg-slate-300'}`} />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {isX3Running ? liveTorque.toFixed(2) : '0.00'}
            </span>
            <span className="text-xs font-bold text-indigo-600">Nm</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Sollwert: <strong className="text-slate-700">{targetTorque} Nm</strong></span>
            <span className="text-slate-400 font-mono">CC50 Sensor</span>
          </div>
        </div>

        {/* Metric 2: Max Torque */}
        <div className="p-5 rounded-sm bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Maximal-Peak</span>
            <Activity className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {maxTorque.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-600">Nm</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Toleranz: <strong className="text-slate-700">± 0.5%</strong></span>
            <span className="text-slate-400">Peak-Hold</span>
          </div>
        </div>

        {/* Metric 3: Motor Angle */}
        <div className="p-5 rounded-sm bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Motorposition</span>
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {motorPosition.toFixed(1)}°
            </span>
            <span className="text-xs text-slate-400 font-mono">({motorRevolutions} U)</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Achse: <strong className="text-slate-700">A1 Synchron</strong></span>
            <span className="text-slate-400 font-mono">OPC UA</span>
          </div>
        </div>

        {/* Metric 4: X5 Trigger Buffer */}
        <div className="p-5 rounded-sm bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">X5 Trigger Puffer</span>
            <Database className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {sampleCount}
            </span>
            <span className="text-xs text-slate-400">Samples</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Status:</span>
            <span className={`font-semibold ${
              isX5Recording ? 'text-cyan-600' : isX3Running ? 'text-emerald-600' : 'text-slate-400'
            }`}>
              {isX5Recording ? 'Aufzeichnung...' : isX3Running ? 'Bereit' : 'Inaktiv'}
            </span>
          </div>
        </div>
      </div>

      {/* Clean Live Chart Area */}
      <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Drehmomentkennlinie (Nm / Zeit)</h4>
            <p className="text-xs text-slate-500">
              Messdatenverlauf des Baumer CC50 Sensors mit automatischer X5-Trigger Erfassung
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block mr-1.5" />
              Drehmoment (Nm)
            </span>
          </div>
        </div>

        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={torqueData} margin={{ top: 10, right: 15, bottom: 5, left: -10 }}>
              <defs>
                <linearGradient id="torqueGradientClean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                stroke="#94a3b8" 
                fontSize={11} 
                tickFormatter={(val) => `${val}s`} 
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                unit=" Nm" 
                domain={[0, Math.max(80, targetTorque * 1.3)]}
              />
              <Tooltip
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0', 
                  backgroundColor: '#ffffff',
                  fontSize: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                formatter={(value: any, name: any) => [
                  `${Number(value).toFixed(2)} Nm`,
                  name === 'torque' ? 'Drehmoment' : 'Messwert'
                ]}
                labelFormatter={(val) => `Zeit: ${val}s`}
              />
              <Area
                type="monotone"
                dataKey="torque"
                stroke="#4f46e5"
                strokeWidth={2}
                fill="url(#torqueGradientClean)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Automatischer Ringspeicher aktiv. Keine manuelle Aufnahmetaste erforderlich.</span>
          </div>
          <div className="flex items-center space-x-3 mt-1 sm:mt-0 font-mono text-slate-400">
            <span>Sampling: 50 Hz</span>
            <span>Port: X2 / X5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
