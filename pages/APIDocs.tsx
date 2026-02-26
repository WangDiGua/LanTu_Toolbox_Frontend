import React, { useEffect, useState, useMemo } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { ExternalLink, Loader2 } from 'lucide-react';
import { APP_CONFIG } from '../config';

const BACKEND_URL = 'http://localhost:8000';

export const APIDocs: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [spec, setSpec] = useState<any>(null);

  const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TOKEN);
  const OPENAPI_URL = `${BACKEND_URL}/openapi.json?token=${token}`;

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const response = await fetch(OPENAPI_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSpec(data);
      } catch (error) {
        console.error('Failed to fetch OpenAPI spec:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSpec();
  }, [OPENAPI_URL]);

  const docsUrl = useMemo(() => {
    const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TOKEN);
    return `${BACKEND_URL}/docs?token=${token}`;
  }, []);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
      <div className="h-12 border-b border-slate-200 bg-slate-50 flex items-center justify-between px-4 dark:border-slate-800 dark:bg-slate-800">
        <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700 dark:text-slate-200">REST API Reference</span>
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-mono">v1.0</span>
        </div>
        <a 
            href={docsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs flex items-center text-blue-600 hover:text-blue-700 hover:underline"
        >
            <ExternalLink size={12} className="mr-1" /> 新窗口打开
        </a>
      </div>
      
      <div className="flex-1 relative bg-white overflow-auto">
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10 dark:bg-slate-900">
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">正在加载文档...</p>
                </div>
            </div>
        )}
        {spec && (
            <SwaggerUI 
                spec={spec}
                docExpansion="list"
                defaultModelsExpandDepth={1}
                defaultModelExpandDepth={1}
            />
        )}
      </div>
    </div>
  );
};
