import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import '@/styles/landing/artist.scss';

import { isAuthed } from '@/components/router/guard/auth';

import { DynamicBackground } from './dynamic-background';
import { HeadBar } from './headbar';
import { QuickAction } from './quick-action';

export const ArtistLandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleToWorkbench = () => {
    isAuthed()
      ? navigate({
          to: '/',
        })
      : navigate({
          to: '/login',
        });
  };

  return (
    <div className="artist-main-container">
      {/* 全屏动态背景 */}
      <DynamicBackground />
      
      <HeadBar />

      <div className="content-container">
        <div className="content-content fixed z-10 flex flex-col">
          <div className="slogan-section">
            <img 
              src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/icons/artist/home.svg" 
              alt="slogan" 
              className="slogan-icon"
            />
            <div className="enter-button" onClick={handleToWorkbench}>
              <svg className="button-icon-left" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="24" height="22.7998046875" viewBox="0 0 24 22.7998046875">
                <g>
                  <g>
                    <path 
                      d="M20.414621,7.7390924L20.145603,8.3532591C19.948801,8.802886,19.323929,8.802886,19.12702,8.3532591L18.858112,7.7390924C18.378654,6.6439967,17.515091,5.7721038,16.43749,5.2951164L15.60873,4.928297C15.160691,4.729948,15.160691,4.0809946,15.60873,3.8826451L16.39113,3.5363247C17.496439,3.0470688,18.375492,2.1429076,18.846657,1.0106162L19.122875,0.34691912C19.315418,-0.11563972,19.957314,-0.11563972,20.149748,0.34691912L20.425968,1.0106162C20.89724,2.1429076,21.776295,3.0470688,22.881603,3.5363247L23.663895,3.8826451C24.112041,4.0809946,24.112041,4.729948,23.663895,4.928297L22.835239,5.2951164C21.757639,5.7721038,20.894073,6.6439967,20.414621,7.7390924ZM10.909091,1.0857151C4.8841639,1.0857151,0,5.9466209,0,11.942858C0,13.791286,0.46411648,15.531795,1.2827022,17.055267L0,22.799999L5.7721863,21.523418C7.3029823,22.338139,9.0518188,22.799999,10.909091,22.799999C16.933966,22.799999,21.818182,17.939041,21.818182,11.942858C21.818182,11.505858,21.792221,11.074504,21.7416,10.650207L19.574947,10.906218C19.615528,11.24572,19.636366,11.591631,19.636366,11.942858C19.636366,16.73987,15.729055,20.628574,10.909091,20.628574C9.4532728,20.628574,8.0536156,20.275171,6.801033,19.608541L6.0880923,19.229088L2.8736296,19.940012L3.5879564,16.74085L3.2067165,16.031332C2.5368986,14.784716,2.1818182,13.391744,2.1818182,11.942858C2.1818182,7.1458678,6.089149,3.2571435,10.909091,3.2571435C11.663892,3.2571435,12.394691,3.3522527,13.09091,3.5305159L13.63451,1.4275739C12.762219,1.2042099,11.8488,1.0857151,10.909091,1.0857151ZM7.6363645,11.942858L5.4545455,11.942858C5.4545455,14.94095,7.8966331,17.371428,10.909091,17.371428C13.921529,17.371428,16.363638,14.94095,16.363638,11.942858L14.18182,11.942858C14.18182,13.741777,12.71662,15.200002,10.909091,15.200002C9.1015635,15.200002,7.6363645,13.741777,7.6363645,11.942858Z" 
                      fill="#FFFFFF" 
                      fillOpacity="1" 
                      style={{mixBlendMode: 'normal' as any}}
                    />
                  </g>
                </g>
              </svg>
              进入设计项目
              <svg className="button-icon-right" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="40" height="40" viewBox="0 0 40 40">
                <defs>
                  <filter id="master_svg0_262_20983" filterUnits="objectBoundingBox" colorInterpolationFilters="sRGB" x="0" y="0" width="1" height="1">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
                    <feOffset dy="4" dx="4"/>
                    <feGaussianBlur stdDeviation="4.349999904632568"/>
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
                    <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
                  </filter>
                  <clipPath id="master_svg1_262_20983">
                    <rect x="0" y="0" width="40" height="40" rx="8"/>
                  </clipPath>
                  <clipPath id="master_svg2_262_20985">
                    <rect x="10" y="10" width="20" height="20" rx="0"/>
                  </clipPath>
                </defs>
                <g filter="url(#master_svg0_262_20983)">
                  <g clipPath="url(#master_svg1_262_20983)">
                    <rect x="0" y="0" width="40" height="40" rx="8" fill="#000000" fillOpacity="1"/>
                    <g clipPath="url(#master_svg2_262_20985)">
                      <g>
                        <path d="M28.084326,11C27.965279,11,27.84623,11.027421515,27.727182,11.073358417L11.5601002,17.8574886C10.83690758,18.1595941,10.80925471,19.1666899,11.50502884,19.523873299999998L16.650102099999998,22.096574C16.430284999999998,22.453756,16.4759827,22.920626,16.7780547,23.222731C16.9519396,23.405776,17.190035299999998,23.497416,17.427897,23.497416C17.5928764,23.497416,17.7667618,23.451478,17.9132285,23.350932999999998L20.4858818,28.496334C20.6506271,28.835001,20.9803524,29,21.300469,29C21.648474,29,21.987104000000002,28.816954,22.142944,28.441492L28.926565,12.2726396C29.192081,11.64077288,28.697611,11,28.084326,11ZM21.227353,25.896213L19.2864971,22.005169000000002L20.2843437,21.016354C20.641253499999998,20.659171100000002,20.641253499999998,20.0823812,20.2843437,19.7254333C20.1013193,19.542388000000003,19.8723631,19.450748400000002,19.6342669,19.450748400000002C19.3964062,19.450748400000002,19.167450000000002,19.542388000000003,18.9844251,19.7254333L17.995718,20.7142487L14.114006,18.77318L26.372191,13.6277783L21.227353,25.896213Z" fill="#FFFFFF" fillOpacity="1" style={{mixBlendMode: 'normal' as any}}/>
                      </g>
                    </g>
                  </g>
                </g>
              </svg>
            </div>
          </div>
          
          <div className="center-content flex flex-1 flex-col items-center justify-center">
            {/* 内容区域 */}
          </div>

          <div className="flex h-[410px] w-full justify-between gap-[30px] p-[30px]">
            {['意图表达', '一键生成', '智能修改'].map((item, index) => (
              <QuickAction
                key={`${index}`}
                // iconUrl={`https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/quick-actions/${item}/icon.svg`}
                // titleUrl={`https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/quick-actions/${item}/title.svg`}
                // subtitleUrl={`https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/quick-actions/${item}/subtitle.svg`}
                iconUrl={`/src/components/landing/artist/quick-actions/${item}/icon.svg`}
                titleUrl={`/src/components/landing/artist/quick-actions/${item}/title.svg`}
                subtitleUrl={`/src/components/landing/artist/quick-actions/${item}/subtitle.svg`}
                onClick={handleToWorkbench}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
