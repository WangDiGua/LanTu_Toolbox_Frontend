import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { cn } from '../utils';
import { useStore } from '../store';

interface ChartProps {
  options: echarts.EChartsOption;
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
}

export const Chart: React.FC<ChartProps> = ({ options, className, style, loading = false }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { state } = useStore();
  const theme = state.themeMode === 'dark' ? 'dark' : 'light';

  // Init Chart
  useEffect(() => {
    if (chartRef.current) {
      // Dispose old instance if exists to handle strict mode or re-init
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
      
      chartInstance.current = echarts.init(chartRef.current, theme === 'dark' ? 'dark' : undefined, {
        renderer: 'canvas'
      });

      // Apply initial options
      chartInstance.current.setOption(options);
    }

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [theme]); // Re-init when theme changes

  // Update Options
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.setOption(options, { notMerge: false }); // Merge updates
    }
  }, [options]);

  // Loading State
  useEffect(() => {
    if (chartInstance.current) {
      if (loading) {
        chartInstance.current.showLoading({
            text: '',
            color: '#2563eb',
            textColor: '#000',
            maskColor: 'rgba(255, 255, 255, 0.8)',
            zlevel: 0,
        });
      } else {
        chartInstance.current.hideLoading();
      }
    }
  }, [loading]);

  // Force Resize when sidebar/layout might change (optional optimization)
  useEffect(() => {
      const timer = setTimeout(() => {
          chartInstance.current?.resize();
      }, 300);
      return () => clearTimeout(timer);
  }, [options]);

  return (
    <div 
        ref={chartRef} 
        className={cn("w-full h-full min-h-[300px]", className)} 
        style={style} 
    />
  );
};