import React from 'react';
import { Droplets, Sun, Thermometer, Wind } from 'lucide-react';

export const PlantCareGrid: React.FC = () => {
  const items = [
    { icon: Droplets, label: 'Water', value: 'Regularly' },
    { icon: Sun, label: 'Light', value: 'Bright Indirect' },
    { icon: Thermometer, label: 'Temp', value: '65-80°F' },
    { icon: Wind, label: 'Air', value: 'Well Ventilated' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <div key={i} className="bg-[#0b1f16] border border-emerald-500/15 p-4 rounded-2xl flex flex-col items-center gap-3 hover:bg-[#0c2419] transition-colors shadow-md">
          <item.icon className="w-6 h-6 text-emerald-400" />
          <div className="text-center space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{item.label}</p>
            <p className="text-xs font-semibold text-white">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
