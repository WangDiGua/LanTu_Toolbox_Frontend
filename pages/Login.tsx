import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Key, ArrowRight, Cpu, Database, Zap, Layers, Box } from 'lucide-react';
import { motion } from 'framer-motion';
import { APP_CONFIG } from '../config';
import { useToast } from '../components/Toast';
import { useStore } from '../store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi } from '../api';
import { transformMenuData } from '../utils';
import { resetAuthState } from '../api/request';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useStore();
  const { error: toastError, success: toastSuccess } = useToast();
  
  const [captchaUrl, setCaptchaUrl] = useState('');
  const [captchaData, setCaptchaData] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const captchaFetchedRef = useRef(false);

  useEffect(() => {
    const authError = sessionStorage.getItem('auth_error_message');
    if (authError) {
      sessionStorage.removeItem('auth_error_message');
      setTimeout(() => {
        toastError(authError);
      }, 100);
    }
  }, []);

  const loginSchema = z.object({
    username: z.string().min(1, '请输入用户名'),
    password: z.string().min(1, '请输入密码'),
    captcha: z.string().min(1, '请输入验证码'),
  });

  type LoginFormInputs = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    resetField,
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      captcha: '',
    }
  });

  const refreshCaptcha = async () => {
    try {
      const res = await authApi.getCaptcha();
      if (res.code === 200) {
        setCaptchaData(res.data.data);
        setCaptchaUrl(res.data.image);
      } else {
        toastError('获取验证码失败');
      }
    } catch (e: any) {
      console.error("Captcha fetch failed:", e);
      toastError(e.message || '获取验证码失败');
    }
    resetField('captcha');
  };

  useEffect(() => {
    if (captchaFetchedRef.current) return;
    captchaFetchedRef.current = true;
    
    refreshCaptcha();
    
    const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TOKEN);
    if (token) {
      navigate(APP_CONFIG.ROUTES.DASHBOARD);
      return;
    }
    
    const expires = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.REMEMBER_ME);
    if (expires && new Date().getTime() < parseInt(expires)) {
      const savedUser = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_INFO);
      if (savedUser) {
        const user = JSON.parse(savedUser);
        dispatch({ type: 'SET_USER', payload: user });
        if (user.permissions) {
          dispatch({ type: 'SET_PERMISSIONS', payload: user.permissions });
        }
        navigate(APP_CONFIG.ROUTES.DASHBOARD);
      }
    }
  }, [navigate, dispatch]);

  const onSubmit = async (data: LoginFormInputs) => {
    if (!captchaData) {
      toastError('验证码数据异常，请刷新验证码后重试');
      refreshCaptcha();
      return;
    }
    
    setLoading(true);
    try {
      const res = await authApi.login({
        username: data.username,
        password: data.password,
        captcha: data.captcha,
        captcha_data: captchaData,
        rememberMe: rememberMe
      });

      if (res.code === 200) {
        const { token, refresh_token } = res.data;
        
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refresh_token);

        const meRes = await authApi.getMe();
        if (meRes.code === 200) {
          const { user, menus } = meRes.data;
          
          const permissions = user.permissions || [];
          const transformedMenus = transformMenuData(menus as any);
          
          localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_INFO, JSON.stringify(user));
          localStorage.setItem(APP_CONFIG.STORAGE_KEYS.PERMISSIONS, JSON.stringify(permissions));
          localStorage.setItem('menus', JSON.stringify(transformedMenus));
          
          dispatch({ type: 'SET_USER', payload: user });
          dispatch({ type: 'SET_MENUS', payload: transformedMenus });
          dispatch({ type: 'SET_PERMISSIONS', payload: permissions });
        }

        if (rememberMe) {
          const sevenDaysLater = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
          localStorage.setItem(APP_CONFIG.STORAGE_KEYS.REMEMBER_ME, sevenDaysLater.toString());
        } else {
          localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.REMEMBER_ME);
        }
        
        toastSuccess('登录成功');
        resetAuthState();
        setTimeout(() => {
          navigate(APP_CONFIG.ROUTES.DASHBOARD);
        }, 0);
      }
    } catch (err: any) {
      toastError(err.message || '登录失败');
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @media (min-width: 1024px) {
          .login-left-panel {
            display: flex !important;
          }
          .login-right-panel {
            width: 50% !important;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div 
        style={{ 
          minHeight: '100vh',
          display: 'flex',
          backgroundColor: '#ffffff',
          fontSize: '16px',
          fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div 
          className="login-left-panel"
          style={{
            display: 'none',
            width: '50%',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px',
          }}
        >
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
            animation: 'gradient-shift 15s ease infinite',
            backgroundSize: '200% 200%',
          }}></div>
          
          <div style={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'pulse-glow 4s ease-in-out infinite',
          }}></div>
          
          <div style={{
            position: 'absolute',
            bottom: '20%',
            left: '5%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)',
            filter: 'blur(30px)',
            animation: 'pulse-glow 5s ease-in-out infinite 1s',
          }}></div>

          <div style={{
            position: 'absolute',
            top: '20%',
            left: '15%',
            animation: 'float 6s ease-in-out infinite',
          }}>
            <Box size={40} style={{ color: 'rgba(99, 102, 241, 0.3)' }} />
          </div>
          
          <div style={{
            position: 'absolute',
            top: '60%',
            right: '20%',
            animation: 'float 5s ease-in-out infinite 1s',
          }}>
            <Database size={35} style={{ color: 'rgba(139, 92, 246, 0.3)' }} />
          </div>
          
          <div style={{
            position: 'absolute',
            bottom: '30%',
            left: '25%',
            animation: 'float 7s ease-in-out infinite 2s',
          }}>
            <Layers size={30} style={{ color: 'rgba(99, 102, 241, 0.25)' }} />
          </div>
          
          <div style={{
            position: 'absolute',
            top: '35%',
            right: '15%',
            animation: 'float 4s ease-in-out infinite 0.5s',
          }}>
            <Zap size={28} style={{ color: 'rgba(139, 92, 246, 0.25)' }} />
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 10, color: 'white', maxWidth: '480px' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '32px',
              overflow: 'hidden',
            }}
          >
            <img src="/LOGO.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: '42px',
              fontWeight: 'bold',
              marginBottom: '16px',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            兰途工具箱
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '20px',
              marginBottom: '24px',
            }}
          >
            <span style={{ fontSize: '14px', color: '#a5b4fc', fontWeight: 500 }}>
              软件工厂低代码平台 · 自定义工具集
            </span>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              fontSize: '18px',
              color: '#c7d2fe',
              lineHeight: '1.7',
              marginBottom: '32px',
            }}
          >
            为低代码平台提供强大的自定义工具能力。
            <br/>向量管理、数据处理、智能检索，一站式解决方案。
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { icon: Database, label: '向量管理' },
              { icon: Zap, label: '智能检索' },
              { icon: Layers, label: '数据处理' },
            ].map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <item.icon size={16} style={{ color: '#a5b4fc' }} />
                </div>
                <span style={{ fontSize: '14px', color: '#c7d2fe' }}>{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div 
        className="login-right-panel"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          backgroundColor: '#f8fafc',
        }}
      >
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            width: '100%',
            maxWidth: '448px',
            backgroundColor: '#ffffff',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            border: '1px solid #f1f5f9',
          }}
        >
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>欢迎回来</h2>
            <p style={{ color: '#64748b', marginTop: '8px', fontSize: '14px' }}>请填写以下信息登录您的账户</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>用户名</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  paddingLeft: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  color: '#94a3b8',
                }}>
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="请输入用户名"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    padding: '10px 12px 10px 40px',
                    fontSize: '14px',
                    color: '#1e293b',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  {...register('username')}
                />
              </div>
              <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444', fontWeight: 500, height: '16px', lineHeight: '16px' }}>{errors.username?.message || ''}</p>
            </div>
            
            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>密码</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  paddingLeft: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  color: '#94a3b8',
                }}>
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="请输入密码"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    padding: '10px 12px 10px 40px',
                    fontSize: '14px',
                    color: '#1e293b',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  {...register('password')}
                />
              </div>
              <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444', fontWeight: 500, height: '16px', lineHeight: '16px' }}>{errors.password?.message || ''}</p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>验证码</label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    paddingLeft: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    color: '#94a3b8',
                  }}>
                    <Key size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="请输入验证码"
                    style={{
                      display: 'block',
                      width: '100%',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      padding: '10px 12px 10px 40px',
                      fontSize: '14px',
                      color: '#1e293b',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                    {...register('captcha')}
                  />
                </div>
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444', fontWeight: 500, height: '16px', lineHeight: '16px' }}>{errors.captcha?.message || ''}</p>
              </div>
              <div 
                style={{
                  width: '112px',
                  height: '42px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginTop: '26px',
                }}
                onClick={refreshCaptcha}
                title="点击刷新"
              >
                {captchaUrl ? (
                  <img src={captchaUrl} alt="Captcha" style={{ width: 'auto', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>加载中...</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#2563eb',
                  cursor: 'pointer',
                }}
              />
              <label htmlFor="remember-me" style={{
                marginLeft: '8px',
                display: 'block',
                fontSize: '14px',
                color: '#334155',
                cursor: 'pointer',
                userSelect: 'none',
              }}>
                记住登录状态 (7天)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '44px',
                fontSize: '16px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 500,
                borderRadius: '8px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
              onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2563eb')}
            >
              {loading ? (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #ffffff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}></div>
              ) : (
                <>
                  立即登录
                  <ArrowRight size={18} style={{ marginLeft: '8px', opacity: 0.8 }} />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
    </>
  );
};
