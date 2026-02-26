import React, { useState, useEffect, useRef } from 'react';
import { Book, Save, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { kbConfigApi } from '../api';
import { useToast } from '../components/Toast';

interface KBConfigData {
  name: string;
  chunkSize: number;
  searchMode: 'hybrid' | 'dense' | 'sparse';
  embeddingModel: string;
}

export const KBConfig: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<KBConfigData>({
    name: '',
    chunkSize: 512,
    searchMode: 'hybrid',
    embeddingModel: 'te3s'
  });

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const res = await kbConfigApi.get();
        if (res.code === 200 && res.data) {
          setConfig(res.data);
        }
      } catch (e: any) {
        console.error('Failed to load config:', e);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await kbConfigApi.update(config);
      if (res.code === 200) {
        success('配置已保存');
      }
    } catch (e: any) {
      toastError(e.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">知识库配置</h1>
            <p className="text-slate-500 dark:text-slate-400">管理和配置您的知识库参数及索引策略。</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center dark:bg-indigo-900/20 dark:text-indigo-400">
                    <Book size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">默认知识库设置</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">配置全局默认的检索参数与分片策略</p>
                </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                      label="知识库名称" 
                      placeholder="Default KB" 
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      value={config.name}
                      onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    />
                    <Input 
                      label="索引分片大小 (Chunk Size)" 
                      placeholder="512" 
                      type="number"
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      value={config.chunkSize}
                      onChange={(e) => setConfig({ ...config, chunkSize: parseInt(e.target.value) || 512 })}
                    />
                    
                    <div>
                        <Select 
                            label="检索模式" 
                            value={config.searchMode}
                            onChange={(e) => setConfig({ ...config, searchMode: e.target.value as any })}
                            options={[
                                { label: 'Hybrid (混合检索)', value: 'hybrid' },
                                { label: 'Dense (向量检索)', value: 'dense' },
                                { label: 'Sparse (关键词检索)', value: 'sparse' },
                            ]}
                        />
                    </div>

                    <div>
                        <Select 
                            label="Embedding 模型"
                            value={config.embeddingModel}
                            onChange={(e) => setConfig({ ...config, embeddingModel: e.target.value })}
                            options={[
                                { label: 'text-embedding-3-small', value: 'te3s' },
                                { label: 'text-embedding-3-large', value: 'te3l' },
                                { label: 'm3e-base', value: 'm3e' },
                            ]}
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <Button onClick={handleSave} isLoading={saving}>
                        <Save size={16} className="mr-2" /> 保存配置
                    </Button>
                </div>
              </>
            )}
        </div>
    </div>
  );
};
