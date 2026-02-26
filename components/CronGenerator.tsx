import React, { useState, useEffect } from 'react';
import { cn } from '../utils';
import { Clock, RefreshCw, Calendar, Code } from 'lucide-react';
import { Input } from './Input';
import { Select } from './Select';

interface CronGeneratorProps {
  value: string;
  onChange: (value: string) => void;
}

type TabType = 'interval' | 'daily' | 'weekly' | 'custom';

export const CronGenerator: React.FC<CronGeneratorProps> = ({ value, onChange }) => {
  const [activeTab, setActiveTab] = useState<TabType>('interval');
  
  const [intervalType, setIntervalType] = useState<'minutes' | 'hours'>('minutes');
  const [intervalValue, setIntervalValue] = useState(30);
  
  const [dailyTime, setDailyTime] = useState('02:00');
  
  const [weeklyDay, setWeeklyDay] = useState(1);
  const [weeklyTime, setWeeklyTime] = useState('03:00');

  useEffect(() => {
    if (!value) return;
    if (value.includes('/')) setActiveTab('interval');
    else if (value.endsWith('* * *')) setActiveTab('daily');
  }, []);

  const generateCron = () => {
    let cron = '';
    switch (activeTab) {
      case 'interval':
        if (intervalType === 'minutes') {
          cron = `*/${intervalValue} * * * *`;
        } else {
          cron = `0 */${intervalValue} * * *`;
        }
        break;
      case 'daily':
        const [dHour, dMinute] = dailyTime.split(':');
        cron = `${Number(dMinute)} ${Number(dHour)} * * *`;
        break;
      case 'weekly':
        const [wHour, wMinute] = weeklyTime.split(':');
        cron = `${Number(wMinute)} ${Number(wHour)} * * ${weeklyDay}`;
        break;
      case 'custom':
        return;
    }
    onChange(cron);
  };

  useEffect(() => {
    if (activeTab !== 'custom') {
      generateCron();
    }
  }, [activeTab, intervalType, intervalValue, dailyTime, weeklyDay, weeklyTime]);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'interval', label: '按周期', icon: <RefreshCw size={14} /> },
    { id: 'daily', label: '按天', icon: <Clock size={14} /> },
    { id: 'weekly', label: '按周', icon: <Calendar size={14} /> },
    { id: 'custom', label: '自定义', icon: <Code size={14} /> },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex space-x-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg mb-4 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              activeTab === tab.id
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-slate-600/50"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4 min-h-[80px]">
        {activeTab === 'interval' && (
          <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
            <span>每隔</span>
            <input 
              type="number" 
              min={1} 
              max={59}
              value={intervalValue}
              onChange={(e) => setIntervalValue(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 p-2.5 border border-slate-300 dark:border-slate-600 rounded-md text-center focus:border-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white"
            />
            <Select 
              value={intervalType}
              onChange={(val) => setIntervalType(val as any)}
              wrapperClassName="w-28"
              options={[
                  { label: '分钟', value: 'minutes' },
                  { label: '小时', value: 'hours' },
              ]}
            />
            <span>执行一次</span>
          </div>
        )}

        {activeTab === 'daily' && (
          <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
            <span>每天在</span>
            <input 
              type="time" 
              value={dailyTime}
              onChange={(e) => setDailyTime(e.target.value)}
              className="p-2.5 border border-slate-300 dark:border-slate-600 rounded-md focus:border-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white"
            />
            <span>执行同步</span>
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
            <span>每周</span>
            <Select 
              value={weeklyDay}
              onChange={(val) => setWeeklyDay(Number(val))}
              wrapperClassName="w-28"
              options={[
                  { label: '星期一', value: 1 },
                  { label: '星期二', value: 2 },
                  { label: '星期三', value: 3 },
                  { label: '星期四', value: 4 },
                  { label: '星期五', value: 5 },
                  { label: '星期六', value: 6 },
                  { label: '星期日', value: 0 },
              ]}
            />
            <span>的</span>
            <input 
              type="time" 
              value={weeklyTime}
              onChange={(e) => setWeeklyTime(e.target.value)}
              className="p-2.5 border border-slate-300 dark:border-slate-600 rounded-md focus:border-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white"
            />
            <span>执行同步</span>
          </div>
        )}

        {activeTab === 'custom' && (
          <div>
             <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">请输入标准的 Cron 表达式 (分 时 日 月 周)</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">生成的表达式 (Cron)</label>
        <div className="relative">
            <Input 
                value={value} 
                onChange={(e) => {
                    onChange(e.target.value);
                    if (activeTab !== 'custom') setActiveTab('custom');
                }}
                className="font-mono bg-white dark:bg-slate-800"
                placeholder="* * * * *"
            />
             {value && activeTab !== 'custom' && (
                <div className="absolute right-3 top-2.5 text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">
                    预览模式
                </div>
             )}
        </div>
        <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 flex gap-4">
            <span>示例: 0 2 * * * (每天凌晨2点)</span>
            <span>*/30 * * * * (每30分钟)</span>
        </div>
      </div>
    </div>
  );
};
