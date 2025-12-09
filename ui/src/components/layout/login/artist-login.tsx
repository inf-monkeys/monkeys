import React, { useMemo, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { useSWRConfig } from 'swr';

import '@/styles/artist-login.scss';

import { ArrowLeft, Mail, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useLoginByPassword } from '@/apis/authz';
import { DynamicBackground } from '@/components/landing/artist/dynamic-background';
import { saveAuthToken } from '@/components/router/guard/auth';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ICON_URL = 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/icon.svg';
const ICON_TITLE_URL = 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/title.svg';

// 密码强度验证规则（与后端保持一致）
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{8,32}$/;

const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: '密码长度不能少于8位' };
  }
  if (password.length > 32) {
    return { valid: false, message: '密码长度不能超过32位' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含字母' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: '密码必须包含数字' };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return { valid: false, message: '密码格式不正确' };
  }
  return { valid: true };
};

interface IArtistLoginProps {
  onLoginFinished?: () => void;
  loginPageConfig?: {
    background?: string;
    logo?: string;
    logoLocation?: 'top' | 'middle' | 'bottom';
    formRadius?: string;
    theme?: {
      cardBackground?: string;
      cardBorder?: string;
      cardBorderImage?: string;
      cardBlur?: string;
      tabInactiveColor?: string;
      inputBackground?: string;
      inputBorder?: string;
      inputPlaceholder?: string;
      checkboxBackground?: string;
      checkboxShadow?: string;
      titleGradient?: string;
    };
  };
  primaryColor?: string;
}

export const ArtistLogin: React.FC<IArtistLoginProps> = ({ onLoginFinished, loginPageConfig, primaryColor }) => {
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

  const logoLocation = loginPageConfig?.logoLocation ?? 'bottom';

  const containerStyle = useMemo<React.CSSProperties>(
    () => ({
      ['--login-form-radius' as string]: loginPageConfig?.formRadius,
      ['--login-primary-color' as string]: primaryColor,
      ['--login-card-bg' as string]: loginPageConfig?.theme?.cardBackground,
      ['--login-card-border' as string]: loginPageConfig?.theme?.cardBorder,
      ['--login-card-border-image' as string]: loginPageConfig?.theme?.cardBorderImage,
      ['--login-card-blur' as string]: loginPageConfig?.theme?.cardBlur,
      ['--login-tab-inactive-color' as string]: loginPageConfig?.theme?.tabInactiveColor,
      ['--login-input-bg' as string]: loginPageConfig?.theme?.inputBackground,
      ['--login-input-border' as string]: loginPageConfig?.theme?.inputBorder,
      ['--login-input-placeholder' as string]: loginPageConfig?.theme?.inputPlaceholder,
      ['--login-checkbox-bg' as string]: loginPageConfig?.theme?.checkboxBackground,
      ['--login-checkbox-shadow' as string]: loginPageConfig?.theme?.checkboxShadow,
      ['--login-title-gradient' as string]: loginPageConfig?.theme?.titleGradient,
    }),
    [loginPageConfig, primaryColor],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('请填写完整信息');
      return;
    }

    // 注册模式下的额外验证
    if (!isLogin) {
      // 验证密码强度
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        toast.error(passwordValidation.message || '密码格式不正确');
        return;
      }

      // 验证两次密码是否一致
      if (password !== repeatPassword) {
        toast.error('两次输入的密码不一致');
        return;
      }
    }

    setIsLoading(true);

    try {
      // 登录和注册都使用同一个 API（后端会自动处理注册逻辑）
      const result = await triggerPassword({ email, password });
      if (result?.token) {
        const user = await saveAuthToken(result.token);
        if (user) {
          toast.success(isLogin ? '登录成功' : '注册成功');

          // 刷新团队数据
          await mutate('/api/teams');

          if (onLoginFinished) {
            onLoginFinished();
          } else {
            // 默认跳转到首页
            navigate({ to: '/' });
          }
        } else {
          toast.error(isLogin ? '登录失败，请重试' : '注册失败，请重试');
        }
      } else {
        toast.error(isLogin ? '登录失败，请检查邮箱和密码' : '注册失败，请检查信息');
      }
    } catch (error: any) {
      // 解析错误信息
      const errorMessage = error?.message || (isLogin ? '登录失败' : '注册失败');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate({ to: '/home' });
  };

  return (
    <div className="artist-login-container" style={containerStyle}>
      {/* 背景：优先使用 OEM 配置的图片，否则回退原动态背景 */}
      {loginPageConfig?.background ? (
        <div className="artist-login-bg" style={{ backgroundImage: `url(${loginPageConfig.background})` }} />
      ) : (
        <DynamicBackground />
      )}

      {/* 品牌标志：若有自定义 logo 则展示单图，否则保持原来的 icon+title */}
      <div className={`artist-logo logo-location-${logoLocation}`}>
        {loginPageConfig?.logo ? (
          <img className="logo-single" src={loginPageConfig.logo} alt="logo" />
        ) : (
          <>
            <img className="logo-icon" src={ICON_URL} alt="logo" />
            <img className="logo-title" src={ICON_TITLE_URL} alt="logo" />
          </>
        )}
      </div>

      {/* 登录表单容器 */}
      <div className="login-form-container" style={{ borderRadius: loginPageConfig?.formRadius }}>
        {/* 返回首页链接 */}
        <div className="back-to-home" onClick={handleBackToHome}>
          <ArrowLeft className="back-icon" />
          <span>返回首页</span>
        </div>

        {/* 表单标题 */}
        <h1 className="form-title">{isLogin ? '欢迎回来' : '欢迎加入'}</h1>

        {/* 登录/注册选项卡 */}
        <div className="auth-tabs">
          <button className={`tab-button ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>
            <Mail className="tab-icon" />
            邮箱登录
          </button>
          <button className={`tab-button ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>
            <UserPlus className="tab-icon" />
            注册账号
          </button>
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

          {/* 辅助选项 - 仅在登录模式显示 */}
          {isLogin && (
            <div className="form-options">
              <div className="remember-section">
                <div className="remember-password">
                  <Checkbox
                    id="remember"
                    checked={rememberPassword}
                    onCheckedChange={(checked) => setRememberPassword(checked === true)}
                className="login-checkbox"
                  />
                  <Label htmlFor="remember">记住密码</Label>
                </div>
                {/* <div className="remember-hint">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-info"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                  <span className="hint-text">未注册用户将自动注册</span>
                </div> */}
              </div>
              {/* {isLogin && (
                <button type="button" className="forgot-password">
                  忘记密码?
                </button>
              )} */}
            </div>
          )}

          {/* 提交按钮 */}
          <Button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? '处理中...' : isLogin ? '登录' : '注册'}
          </Button>
        </form>
      </div>
    </div>
  );
};
