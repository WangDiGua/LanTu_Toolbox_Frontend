import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNameMap: Record<string, string> = {
  dashboard: '仪表盘',
  vector: '向量管理',
  'vector-search': '向量搜索',
  'vector-config': '向量配置',
  kb: '知识库',
  config: '配置',
  retrieval: '检索',
  tools: '节点工具',
  'llm-clean': '大模型输出清洁',
  docs: 'API 文档',
  settings: '系统设置',
  menus: '菜单管理',
  users: '用户管理',
  roles: '角色管理',
  security: '系统安全',
  'login-logs': '登录日志',
  logs: '日志管理',
  'log-audit': '日志审计',
  profile: '个人中心',
  connections: '数据源管理'
};

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex mb-4 text-sm text-slate-500" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        <li className="inline-flex items-center">
          <Link to="/" className="inline-flex items-center hover:text-blue-600 transition-colors">
            <Home size={16} className="mr-1" />
            首页
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const name = routeNameMap[value] || value;

          return (
            <li key={to}>
              <div className="flex items-center">
                <ChevronRight size={16} className="mx-1 text-slate-400" />
                {isLast ? (
                  <span className="font-medium text-slate-800 dark:text-slate-200">{name}</span>
                ) : (
                  <Link to={to} className="hover:text-blue-600 transition-colors">
                    {name}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};