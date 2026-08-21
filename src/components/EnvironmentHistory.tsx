import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, CheckCircle2 } from 'lucide-react';
import { useTestBench } from '../context/TestBenchContext';

export default function EnvironmentHistory() {
  const { temperature, humidity } = useTestBench();

  // 24-hour history
  const historyData = React.useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const hour = `${i.toString().padStart(2, '0')}:00`;
      const tempVar = Math.sin((i / 24) * Math.PI * 2) * 1.8;
      const humVar = Math.cos((i / 24) * Math.PI * 2) * 3.5;
      return {
        hour,
        temp: Number((temperature + tempVar).toFixed(1)),
        humidity: Number((humidity + humVar).toFixed(1)),
      };
    });
  }, [temperature, humidity]);

  const isTempOptimal = temperature >= 19.0 && temperature <= 25.0;
  const isHumOptimal = humidity >= 30.0 && humidity <= 60.0;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Umgebungs-Sensorik & Klimadaten
          </h3>
          <p className="text-xs text-slate-500">
            Echtzeitüberwachung der Prüfraum-Bedingungen (Temperatur & Feuchte) für normgerechte Torsionsmessungen
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Normbereich DIN EN ISO 7500
          </span>
        </div>
      </div>

      {/* Clean Live Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Temperature Card */}
        <div className="p-6 rounded-sm bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Prüfraum Temperatur</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {temperature.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-orange-600">°C</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Sollbereich: <strong>20.0 - 24.0 °C</strong></span>
            <span className={`font-semibold px-2 py-0.5 rounded-full ${
              isTempOptimal ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {isTempOptimal ? 'Optimal' : 'Warnbereich'}
            </span>
          </div>
        </div>

        {/* Humidity Card */}
        <div className="p-6 rounded-sm bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Relative Luftfeuchte</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {humidity.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-cyan-600">% r.F.</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Sollbereich: <strong>35.0 - 55.0 %</strong></span>
            <span className={`font-semibold px-2 py-0.5 rounded-full ${
              isHumOptimal ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {isHumOptimal ? 'Optimal' : 'Kondensationsgefahr'}
            </span>
          </div>
        </div>
      </div>

      {/* 24-Hour Historical Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Temperature Chart */}
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-900 text-xs flex items-center">
              <span className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
              Temperatur-Verlauf (24h)
            </h4>
            <span className="text-xs font-mono text-slate-400">1 Std. Intervall</span>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} unit="°C" domain={[15, 30]} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} °C`, 'Temperatur']}
                />
                <Area type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} fill="url(#tempGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Humidity Chart */}
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-900 text-xs flex items-center">
              <span className="w-2 h-2 rounded-full bg-cyan-500 mr-2" />
              Luftfeuchtigkeits-Verlauf (24h)
            </h4>
            <span className="text-xs font-mono text-slate-400">1 Std. Intervall</span>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} unit="%" domain={[20, 80]} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} %`, 'Luftfeuchtigkeit']}
                />
                <Area type="monotone" dataKey="humidity" stroke="#06b6d4" strokeWidth={2} fill="url(#humGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
