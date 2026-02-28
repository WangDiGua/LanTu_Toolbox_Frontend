import React, { useState } from 'react';
import { Eraser, ArrowRight, Copy, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { useToast } from '../components/Toast';
import { llmApi } from '../api';

export const LLMClean: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [cleaning, setCleaning] = useState(false);

  const handleClean = async () => {
    if (!input.trim()) {
      toastError('请输入需要清洁的内容');
      return;
    }
    
    setCleaning(true);
    try {
      const res = await llmApi.clean({ content: input });
      if (res.code === 200) {
        const data = res.data as any;
        setOutput(data.cleaned || data || '');
        success('清洁完成');
      }
    } catch (e: any) {
      toastError(e.message || '清洁失败');
    } finally {
      setCleaning(false);
    }
  };

  const copyToClipboard = () => {
      if (!output) return;
      navigator.clipboard.writeText(output);
      success('已复制到剪贴板');
  };

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">大模型输出清洁</h1>
            <p className="text-slate-500 dark:text-slate-400">清洗和格式化 LLM 生成的原始文本数据，去除冗余对话和标记。</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-240px)] min-h-[500px]">
            <div className="flex flex-col h-full">
                <label className="mb-2 font-medium text-slate-700 dark:text-slate-300">输入原始内容</label>
                <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 w-full p-4 rounded-xl border border-slate-200 resize-none focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] bg-white font-mono text-sm leading-relaxed transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:focus:border-blue-400" 
                    placeholder="在此粘贴原始 LLM 输出..." 
                />
            </div>

            <div className="flex flex-col h-full relative">
                 <div className="absolute top-1/2 -left-3 transform -translate-y-1/2 lg:block hidden z-10">
                    <div className="bg-white p-2 rounded-full shadow-md border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                        <ArrowRight size={20} className="text-slate-400" />
                    </div>
                 </div>
                <div className="flex justify-between items-center mb-2">
                    <label className="font-medium text-slate-700 dark:text-slate-300">清洁结果</label>
                    {output && (
                        <button onClick={copyToClipboard} className="text-xs flex items-center text-blue-600 hover:text-blue-700 transition-colors">
                            <Copy size={14} className="mr-1" /> 复制结果
                        </button>
                    )}
                </div>
                <div className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 font-mono text-sm leading-relaxed overflow-y-auto whitespace-pre-wrap dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-300">
                    {cleaning ? (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            <Loader2 size={20} className="animate-spin mr-2" />
                            正在处理文本...
                        </div>
                    ) : output ? (
                        output
                    ) : (
                        <span className="text-slate-400 italic">等待执行清洁操作...</span>
                    )}
                </div>
            </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button onClick={handleClean} isLoading={cleaning} disabled={!input}>
                <Eraser size={16} className="mr-2" /> 执行清洁
            </Button>
        </div>
    </div>
  );
};
