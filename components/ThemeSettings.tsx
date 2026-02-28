import React from 'react';
import { X, Moon, Sun, Monitor, Type, Palette, Check, Laptop, Move, Layout, Languages, Sidebar, PanelTop, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { useToast } from './Toast';

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  { name: 'Blue', value: '#2563eb' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Orange', value: '#ea580c' },
];

const TRANSITIONS = [
  { value: 'fade', label: '淡入淡出' },
  { value: 'slide', label: '滑动切换' },
  { value: 'scale', label: '缩放切换' },
  { value: 'flip', label: '翻转切换' },
  { value: 'zoom', label: '放大切换' },
  { value: 'rotate', label: '旋转切换' },
  { value: 'none', label: '关闭动画' },
];

const FONT_FAMILIES = [
  { value: 'default', label: '默认', desc: '系统默认字体' },
  { value: 'serif', label: '衬线', desc: '适合长文阅读' },
  { value: 'mono', label: '等宽', desc: '适合代码显示' },
  { value: 'rounded', label: '圆润', desc: '现代友好风格' },
];

const LAYOUT_MODES = [
  { value: 'sidebar', label: '侧边导航', desc: '经典左侧菜单布局', icon: Sidebar },
  { value: 'top', label: '顶部导航', desc: '现代顶部菜单布局', icon: PanelTop },
];

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useStore();
  const { success: toastSuccess } = useToast();
  const { themeMode, primaryColor, fontSize, fontFamily, pageTransition, layoutMode } = state;

  const themeModeLabels: Record<string, string> = {
    'light': '明亮模式',
    'dark': '暗黑模式',
    'system': '跟随系统'
  };

  const fontSizeLabels: Record<number, string> = {
    14: '小',
    16: '标准',
    18: '大'
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 bg-surface text-slate-800 shadow-2xl z-[100] border-l border-slate-200 flex flex-col dark:bg-slate-900 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
                <h2 className="font-semibold text-lg flex items-center gap-2 dark:text-white">
                    <Monitor size={18} /> 系统配置
                </h2>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors dark:text-slate-300">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 dark:bg-slate-900">
                
                {/* Theme Mode */}
                <section>
                    <h3 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider dark:text-slate-400">主题模式</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <button 
                            onClick={() => {
                              dispatch({ type: 'SET_THEME_MODE', payload: 'light' });
                              toastSuccess('已切换至明亮模式');
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                                themeMode === 'light' 
                                    ? "border-primary bg-blue-50 text-primary dark:bg-slate-800" 
                                    : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
                            )}
                        >
                            <Sun size={18} /> <span className="text-xs">明亮</span>
                        </button>
                        <button 
                            onClick={() => {
                              dispatch({ type: 'SET_THEME_MODE', payload: 'dark' });
                              toastSuccess('已切换至暗黑模式');
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                                themeMode === 'dark' 
                                    ? "border-primary bg-blue-50 text-primary dark:bg-slate-800" 
                                    : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
                            )}
                        >
                            <Moon size={18} /> <span className="text-xs">暗黑</span>
                        </button>
                        <button 
                            onClick={() => {
                              dispatch({ type: 'SET_THEME_MODE', payload: 'system' });
                              toastSuccess('已切换至跟随系统');
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                                themeMode === 'system' 
                                    ? "border-primary bg-blue-50 text-primary dark:bg-slate-800" 
                                    : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
                            )}
                        >
                            <Laptop size={18} /> <span className="text-xs">系统</span>
                        </button>
                    </div>
                </section>

                {/* Layout Mode */}
                <section>
                    <h3 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2 dark:text-slate-400">
                        <Layout size={14} /> 布局模式
                    </h3>
                    <div className="space-y-2">
                        {LAYOUT_MODES.map((layout) => {
                            const Icon = layout.icon;
                            return (
                                <button 
                                    key={layout.value}
                                    onClick={() => {
                                        dispatch({ type: 'SET_LAYOUT_MODE', payload: layout.value as any });
                                        toastSuccess(`布局已切换为${layout.label}`);
                                    }}
                                    className={cn(
                                        "w-full px-3 py-3 text-sm rounded-lg border transition-all text-left flex items-center justify-between group",
                                        layoutMode === layout.value 
                                            ? "border-primary bg-blue-50 text-primary font-medium dark:bg-slate-800" 
                                            : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon size={18} className={layoutMode === layout.value ? "text-primary" : "text-slate-400 group-hover:text-slate-600"} />
                                        <span>{layout.label}</span>
                                    </div>
                                    <span className="text-xs text-slate-400">{layout.desc}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Primary Color */}
                <section>
                    <h3 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2 dark:text-slate-400">
                        <Palette size={14} /> 主题色
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {COLORS.map((color) => (
                            <button
                                key={color.value}
                                onClick={() => {
                                  dispatch({ type: 'SET_PRIMARY_COLOR', payload: color.value });
                                  toastSuccess(`主题色已更改为${color.name}`);
                                }}
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-sm relative z-10",
                                    primaryColor === color.value ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-600" : ""
                                )}
                                style={{ backgroundColor: color.value }}
                            >
                                {primaryColor === color.value && <Check size={14} className="text-white" />}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Page Transition */}
                <section>
                    <h3 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2 dark:text-slate-400">
                        <Move size={14} /> 页面切换动画
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {TRANSITIONS.map((t) => (
                             <button 
                                key={t.value}
                                onClick={() => {
                                  dispatch({ type: 'SET_PAGE_TRANSITION', payload: t.value as any });
                                  toastSuccess(`页面动画已设置为${t.label}`);
                                }}
                                className={cn(
                                    "px-2 py-2 text-xs rounded-md border transition-all text-center",
                                    pageTransition === t.value 
                                        ? "border-primary bg-blue-50 text-primary font-medium dark:bg-slate-800" 
                                        : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400"
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Font Family */}
                <section>
                    <h3 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2 dark:text-slate-400">
                        <Languages size={14} /> 字体样式
                    </h3>
                    <div className="space-y-2">
                        {FONT_FAMILIES.map((font) => (
                            <button 
                                key={font.value}
                                onClick={() => {
                                  dispatch({ type: 'SET_FONT_FAMILY', payload: font.value as any });
                                  toastSuccess(`字体样式已设置为${font.label}`);
                                }}
                                className={cn(
                                    "w-full px-3 py-2.5 text-sm rounded-lg border transition-all text-left flex items-center justify-between",
                                    fontFamily === font.value 
                                        ? "border-primary bg-blue-50 text-primary font-medium dark:bg-slate-800" 
                                        : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400"
                                )}
                            >
                                <span>{font.label}</span>
                                <span className="text-xs text-slate-400">{font.desc}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Font Size */}
                <section>
                    <h3 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2 dark:text-slate-400">
                        <Type size={14} /> 字体大小
                    </h3>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1 flex items-center">
                        <button 
                            onClick={() => {
                              dispatch({ type: 'SET_FONT_SIZE', payload: 14 });
                              toastSuccess('字体大小已设置为小');
                            }}
                            className={cn("flex-1 py-1.5 text-xs rounded-md transition-all dark:text-slate-300", fontSize === 14 ? "bg-white dark:bg-slate-700 shadow text-primary font-medium" : "text-slate-500")}
                        >
                            小
                        </button>
                        <button 
                            onClick={() => {
                              dispatch({ type: 'SET_FONT_SIZE', payload: 16 });
                              toastSuccess('字体大小已设置为标准');
                            }}
                            className={cn("flex-1 py-1.5 text-sm rounded-md transition-all dark:text-slate-300", fontSize === 16 ? "bg-white dark:bg-slate-700 shadow text-primary font-medium" : "text-slate-500")}
                        >
                            标准
                        </button>
                        <button 
                            onClick={() => {
                              dispatch({ type: 'SET_FONT_SIZE', payload: 18 });
                              toastSuccess('字体大小已设置为大');
                            }}
                            className={cn("flex-1 py-1.5 text-base rounded-md transition-all dark:text-slate-300", fontSize === 18 ? "bg-white dark:bg-slate-700 shadow text-primary font-medium" : "text-slate-500")}
                        >
                            大
                        </button>
                    </div>
                </section>
                
                {/* Info */}
                <section className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-xs text-slate-500 dark:text-slate-400">
                    <p className="mb-1 font-semibold">关于配置持久化</p>
                    <p>配置已保存至本地存储，刷新页面后会自动应用。</p>
                </section>

                {/* Reset Button */}
                <section>
                    <button 
                        onClick={() => {
                          dispatch({ type: 'SET_THEME_MODE', payload: 'light' });
                          dispatch({ type: 'SET_PRIMARY_COLOR', payload: '#2563eb' });
                          dispatch({ type: 'SET_FONT_SIZE', payload: 16 });
                          dispatch({ type: 'SET_FONT_FAMILY', payload: 'default' });
                          dispatch({ type: 'SET_PAGE_TRANSITION', payload: 'fade' });
                          dispatch({ type: 'SET_LAYOUT_MODE', payload: 'sidebar' });
                          toastSuccess('已恢复默认设置');
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                    >
                        <RotateCcw size={16} /> 恢复默认设置
                    </button>
                </section>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};