import React, { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useLoginByPassword } from '@/apis/authz';
import { DynamicBackground } from '@/components/landing/artist/dynamic-background';
import { saveAuthToken } from '@/components/router/guard/auth';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';

import '@/styles/artist-login.scss';

const ICON_URL = 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/icon.svg';
const ICON_TITLE_URL = 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/title.svg';

interface IArtistLoginProps {
  onLoginFinished?: () => void;
}

export const ArtistLogin: React.FC<IArtistLoginProps> = ({ onLoginFinished }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();
  const { trigger: triggerPassword } = useLoginByPassword();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('请填写完整信息');
      return;
    }

    if (!isLogin && password !== repeatPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await triggerPassword({ email, password });
        if (result?.token) {
          const user = await saveAuthToken(result.token);
          if (user) {
            toast.success('登录成功');
            
            // 刷新团队数据
            await mutate('/api/teams');
            
            if (onLoginFinished) {
              onLoginFinished();
            } else {
              // 默认跳转到首页
              navigate({ to: '/' });
            }
          } else {
            toast.error('登录失败，请重试');
          }
        } else {
          toast.error('登录失败，请检查邮箱和密码');
        }
      } else {
        // 注册逻辑 - 这里需要根据实际API调整
        toast.success('注册成功，请登录');
        setIsLogin(true);
        setPassword('');
        setRepeatPassword('');
      }
    } catch (error) {
      toast.error(isLogin ? '登录失败' : '注册失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate({ to: '/home' });
  };

  return (
    <div className="artist-login-container">
      {/* 动态背景 */}
      <DynamicBackground />
      
      {/* ARTIST品牌标志 */}
      <div className="artist-logo">
        <img className="logo-icon" src={ICON_URL} alt="logo" />
        <img className="logo-title" src={ICON_TITLE_URL} alt="logo" />
      </div>

      {/* 登录表单容器 */}
      <div className="login-form-container">
        {/* 返回首页链接 */}
        <div className="back-to-home" onClick={handleBackToHome}>
          <ArrowLeft className="back-icon" />
          <span>返回首页</span>
        </div>

        {/* 表单标题 */}
        <h1 className="form-title">
          {isLogin ? '欢迎回来' : '欢迎加入'}
        </h1>

        {/* 登录/注册选项卡 */}
        <div className="auth-tabs">
          <button
            className={`tab-button ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            <Mail className="tab-icon" />
            邮箱登录
          </button>
          {/* <button
            className={`tab-button ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            <Search className="tab-icon" />
            注册账号
          </button> */}
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="login-form">
           <div className="form-field">
             <Input
               type="email"
               placeholder="请输入邮箱"
               value={email}
               onChange={(value) => setEmail(value)}
               className="form-input"
             />
           </div>

           <div className="form-field">
             <Input
               type="password"
               placeholder="请输入密码"
               value={password}
               onChange={(value) => setPassword(value)}
               className="form-input"
             />
           </div>

           {!isLogin && (
             <div className="form-field">
               <Input
                 type="password"
                 placeholder="请重复密码"
                 value={repeatPassword}
                 onChange={(value) => setRepeatPassword(value)}
                 className="form-input"
               />
             </div>
           )}

          {/* 辅助选项 */}
          <div className="form-options">
            <div className="remember-section">
              <div className="remember-password">
                <Checkbox
                  id="remember"
                  checked={rememberPassword}
                  onCheckedChange={(checked) => setRememberPassword(checked === true)}
                />
                <Label htmlFor="remember">记住密码</Label>
              </div>
              <div className="remember-hint">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                <span className="hint-text">未注册用户将自动注册</span>
              </div>
            </div>
            {/* {isLogin && (
              <button type="button" className="forgot-password">
                忘记密码?
              </button>
            )} */}
          </div>

          {/* 提交按钮 */}
          <Button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </Button>
        </form>
      </div>
    </div>
  );
};
