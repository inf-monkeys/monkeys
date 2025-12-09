import React, { useMemo, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { useSWRConfig } from 'swr';

import '@/styles/artist-login.scss';

import { Mail, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useLoginByPassword } from '@/apis/authz';
import { useSystemConfig } from '@/apis/common';
import { DynamicBackground } from '@/components/landing/artist/dynamic-background';
import { OAuthDingtalkProvider } from '@/components/layout/login/auth/oauth/dingtalk';
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
    logoSize?: string;
    logoLeft?: string;
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
      inputTextColor?: string;
      checkboxBackground?: string;
      checkboxCheckedBackground?: string;
      checkboxCheckColor?: string;
      checkboxBorder?: string;
      checkboxShape?: 'round' | 'square' | 'rounded';
      checkboxShadow?: string;
      titleGradient?: string;
      textColor?: string;
    };
  };
  primaryColor?: string;
  darkMode?: boolean;
  oemId?: string;
}

export const ArtistLogin: React.FC<IArtistLoginProps> = ({
  onLoginFinished,
  loginPageConfig,
  primaryColor,
  darkMode,
  oemId,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();
  const { trigger: triggerPassword } = useLoginByPassword();
  const { data: oem } = useSystemConfig();

  // 检查是否启用了钉钉登录
  const loginMethods = (oem?.auth?.enabled || []) as string[];
  const isDingtalkEnabled = loginMethods.some(
    (method) => method === 'oauth-dingtalk' || (typeof method === 'string' && method.startsWith('oauth-') && method.includes('dingtalk')),
  );
  const isBsdAndDingtalkEnabled = oemId === 'bsd' && isDingtalkEnabled;

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const logoLocation = loginPageConfig?.logoLocation ?? 'bottom';
  // 文本与输入颜色：优先 OEM 配置；否则按背景亮度选择
  const resolvedTextColor = loginPageConfig?.theme?.textColor ?? (darkMode ? '#fff' : '#000');
  const resolvedInputTextColor =
    loginPageConfig?.theme?.inputTextColor ??
    loginPageConfig?.theme?.textColor ??
    (darkMode ? '#fff' : '#000');
  const resolvedCheckboxBg =
    loginPageConfig?.theme?.checkboxBackground ?? (darkMode ? '#fff' : '#fff');
  const resolvedCheckboxCheckedBg =
    loginPageConfig?.theme?.checkboxCheckedBackground ?? (darkMode ? '#000' : '#fff');
  const resolvedCheckboxCheckColor =
    loginPageConfig?.theme?.checkboxCheckColor ?? (darkMode ? '#fff' : '#000');
  const resolvedCheckboxBorder =
    loginPageConfig?.theme?.checkboxBorder ?? (darkMode ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(0,0,0,0.5)');
  const resolvedCheckboxRadius = (() => {
    const shape = loginPageConfig?.theme?.checkboxShape ?? 'rounded';
    if (shape === 'round') return '50%';
    if (shape === 'square') return '2px';
    return '6px';
  })();

  const defaultTitleGradient = useMemo(() => {
    if (loginPageConfig?.theme?.titleGradient) {
      return loginPageConfig.theme.titleGradient;
    }
    // 如果没有配置 titleGradient，使用 primaryColor 生成默认渐变
    // 使用更明显的渐变：从 primaryColor 到更亮的灰色，增加中间停止点
    return `linear-gradient(270deg, ${primaryColor} 0%, ${primaryColor} 30%, #B0B0B0 70%, #D0D0D0 100%), #FFFFFF`;
  }, [loginPageConfig?.theme?.titleGradient, primaryColor]);

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
      ['--login-checkbox-bg-checked' as string]: resolvedCheckboxCheckedBg,
      ['--login-checkbox-check-color' as string]: resolvedCheckboxCheckColor,
      ['--login-checkbox-border' as string]: resolvedCheckboxBorder,
      ['--login-checkbox-radius' as string]: resolvedCheckboxRadius,
      ['--login-checkbox-shadow' as string]: loginPageConfig?.theme?.checkboxShadow,
      ['--login-title-gradient' as string]: defaultTitleGradient,
      ['--login-text-color' as string]: resolvedTextColor,
      ['--login-input-text' as string]: resolvedInputTextColor,
    }),
    [
      loginPageConfig,
      primaryColor,
      resolvedTextColor,
      resolvedInputTextColor,
      resolvedCheckboxCheckedBg,
      resolvedCheckboxCheckColor,
      resolvedCheckboxBorder,
      resolvedCheckboxRadius,
      defaultTitleGradient,
    ],
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

  const isBsdTheme = oemId === 'bsd';

  return (
    <div className={`artist-login-container ${darkMode ? 'dark-mode' : ''} ${isBsdTheme ? 'bsd-theme' : ''}`} style={containerStyle}>
      {/* 背景：优先使用 OEM 配置的图片，否则回退原动态背景 */}
      {loginPageConfig?.background ? (
        <div
          className="artist-login-bg"
          style={{
            backgroundImage: `url(${loginPageConfig.background})`,
            backgroundPosition: oemId === 'bsd' ? 'center top' : 'center',
            ...(oemId === 'bsd'
              ? {
                  position: 'absolute',
                  top: '128px',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: 'auto',
                  height: 'auto',
                }
              : {}),
          }}
        />
      ) : (
        <DynamicBackground />
      )}

      {/* 品牌标志：若有自定义 logo 则展示单图，否则保持原来的 icon+title */}
      <div
        className={`artist-logo logo-location-${logoLocation}`}
        style={{
          left: loginPageConfig?.logoLeft || undefined,
        }}
      >
        {loginPageConfig?.logo ? (
          (() => {
            const logoSize = loginPageConfig.logoSize;
            // 如果值是百分比格式（如 "200%"），转换为 scale
            const isPercentage = logoSize && /^\d+%$/.test(logoSize.trim());
            const scale = isPercentage ? parseFloat(logoSize) / 100 : undefined;
            
            return (
              <img
                className="logo-single"
                src={loginPageConfig.logo}
                alt="logo"
                style={{
                  ...(isPercentage
                    ? {
                        transform: `scale(${scale})`,
                        transformOrigin: 'left center',
                      }
                    : {
                        height: logoSize || undefined,
                      }),
                }}
              />
            );
          })()
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
          <span>返回首页</span>
          <svg
            className="back-icon"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            fill="none"
            version="1.1"
            width="16.484106063842773"
            height="17.4375"
            viewBox="0 0 16.484106063842773 17.4375"
          >
            <g>
              <path
                d="M9.6216078,3.7109375L2.707545,3.7109375L5.0219984,1.3964844C5.3423109,1.0761719,5.3423109,0.55859375,5.0219984,0.24023438C4.7016859,-0.080078125,4.1841078,-0.080078125,3.8657484,0.24023438L0.23684214,3.8671875C0.061060902,4.0429688,-0.013157844,4.2773438,0.0024671552,4.5058594C-0.015110969,4.734375,0.061060902,4.96875,0.23684214,5.1445312L3.8637953,8.7714844C4.0239515,8.9316406,4.2329359,9.0117188,4.4419203,9.0117188C4.6509047,9.0117188,4.859889,8.9316406,5.0200453,8.7714844C5.3403578,8.4511719,5.3403578,7.9335938,5.0200453,7.6152344L2.7524669,5.3476562L9.5180922,5.3476562C12.375513,5.3476562,14.783716,7.5976562,14.848169,10.455078C14.914576,13.390625,12.545435,15.800781,9.6235609,15.800781L8.5766859,15.800781C8.5649672,15.800781,8.5512953,15.798828,8.5395765,15.798828L1.518092,15.798828C1.5044202,15.798828,1.4927014,15.800781,1.4809827,15.800781C1.0903577,15.818359,0.77395147,16.107422,0.71145147,16.484375L0.71145147,16.753906C0.77395147,17.128906,1.0903577,17.417969,1.4770764,17.4375L9.500514,17.4375C13.262232,17.4375,16.414576,14.460938,16.482935,10.701172C16.553247,6.859375,13.447779,3.7109375,9.6216078,3.7109375Z"
                fill="currentColor"
                fillOpacity="0.85"
              />
            </g>
          </svg>

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

          {/* 钉钉登录按钮 - 仅在 BSD 且启用钉钉登录时显示 */}
          {isBsdAndDingtalkEnabled && isLogin && (
            <div className="mt-4 w-full flex flex-col items-center gap-2">
              <div className="text-sm" style={{ color: resolvedTextColor || 'rgba(255,255,255,0.8)' }}>
                {t('auth.login.other')}
              </div>
              <OAuthDingtalkProvider>
                <Button
                  type="button"
                  className="dingtalk-button"
                  style={{
                    width: '50%',
                    maxWidth: '200px',
                    minWidth: '120px',
                    background: 'linear-gradient(135deg, #1677FF 0%, #4096FF 100%)',
                    color: 'white',
                  }}
                >
                  <svg
                    className="mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    fill="none"
                    version="1.1"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                  >
                    <defs>
                      <clipPath id="master_svg0_1_022">
                        <rect x="0" y="0" width="20" height="20" rx="0" />
                      </clipPath>
                    </defs>
                    <g clipPath="url(#master_svg0_1_022)">
                      <g>
                        <path
                          d="M14.0160097890625,13.32282440625L16.293009789062502,13.32282440625L12.1520099890625,19.11182440625L12.0520095890625,19.07682440625L12.9520101890625,15.27182340625L11.1720094890625,15.27182340625C11.3720092890625,14.34882340625,11.5640096890625,13.48182440625,11.7720098890625,12.53382440625C11.2660092890625,12.68582340625,10.8240098890625,12.77382340625,10.421008589062499,12.94982340625C9.548008889062501,13.32982340625,8.763008589062501,13.16782240625,8.0550093890625,12.60582240625C7.5784177890625,12.23938840625,7.1401800890625,11.82560940625,6.7470089890625005,11.37082340625C6.3470089890625,10.89282320625,6.4740085890625,10.61982250625,7.080009189062499,10.51782320625C8.363009489062499,10.30182270625,9.6500091890625,10.11182310625,10.9390091890625,9.87182330625L10.1300096890625,9.87182330625C9.0210094890625,9.86082360625,7.9110087890625,9.84282300625,6.8020093890624995,9.83882330625C6.1210090890625,9.83882330625,5.6410090890625,9.48382280625,5.2300090890625,8.98982330625C4.7107814890625,8.36002680625,4.3433150890625,7.61927750625,4.1560092890625,6.82482290625C4.0300094490625,6.31682300625,4.1690094890625,6.17682310625,4.6930092890625,6.29882290625C6.0180091890625,6.60682300625,7.3410091890625,6.92582270625,8.6660093890625,7.23582310625C9.343382789062499,7.40267560625,10.028974989062501,7.53418680625,10.7200088890625,7.62982320625C9.9200090890625,7.36382290625,9.1040095890625,7.11982340625,8.3110088890625,6.82982350625C7.1010090890625,6.38182350625,5.9110087890625,5.89382310625,4.7010089890625,5.42982340625C4.3556087890625,5.30491970625,4.0791622390625,5.03973530625,3.9400089390625,4.69982460625C3.4690090090625,3.62582470625,3.1170089719625,2.52082440625,3.1090087890625,1.33482438625C3.1090087890625,0.90282440185,3.2500087790625,0.79682435825,3.6210086990625,0.97682438025C7.4000086890625,2.79982460625,11.3070087890625,4.34182430625,15.2260087890625,5.84582470625C15.6039857890625,6.00003770625,15.9640977890625,6.19484660625,16.3000097890625,6.42682410625C16.9510087890625,6.85982470625,17.1630097890625,7.40582420625,16.8260087890625,8.09182450625C16.1340097890625,9.49982450625,15.3730087890625,10.87382410625,14.6340097890625,12.25882440625C14.4490077890625,12.59982440625,14.2430087890625,12.93082440625,14.0160097890625,13.32282440625Z"
                          fill="#FFFFFF"
                          fillOpacity="0.85"
                        />
                      </g>
                    </g>
                  </svg>
                  {t('auth.oauth.dingtalk.label')}
                </Button>
              </OAuthDingtalkProvider>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
