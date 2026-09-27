import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, CheckCircle2, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'primary' | 'compact' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'primary',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone mode (installed as PWA or APK)
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-sm">已安装应用</p>
            <p className="text-emerald-700/80 dark:text-emerald-300/80">
              当前正在以独立应用窗口（PWA / APK模式）运行
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // General instructions for desktop / other browsers
      setShowIOSGuide(true);
    }
  };

  if (variant === 'card') {
    return (
      <>
        <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">安装到手机主屏幕</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                支持离线打开、全屏沉浸课表，可预留打包为 APK
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-medium transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>{isIOS ? '查看添加到桌面步骤' : '立即安装 PWA'}</span>
          </button>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-600" />
                添加到手机桌面 / 安装
              </h3>
              <div className="mt-3 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold">1</span>
                  <p>在 Safari 或 Chrome 底部/右上角点击 <span className="font-semibold inline-flex items-center gap-0.5"><Share className="w-3.5 h-3.5 inline" /> 分享</span> 按钮。</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold">2</span>
                  <p>滑动找到并点击 <span className="font-semibold inline-flex items-center gap-0.5"><PlusSquare className="w-3.5 h-3.5 inline" /> 添加至主屏幕</span>。</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold">3</span>
                  <p>点击“添加”完成，之后即可像原生 App 一样在桌面无边框启动。</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                我知道了
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Compact variant (e.g. for header)
  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ${
          isInstallable
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
        } ${className}`}
        title="安装到主屏幕"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{isIOS ? '添加到桌面' : '安装'}</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-indigo-600" />
              添加到手机桌面
            </h3>
            <div className="mt-3 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold">1</span>
                <p>点击浏览器菜单中的 <span className="font-semibold inline-flex items-center gap-0.5"><Share className="w-3.5 h-3.5 inline" /> 分享</span> 或“添加至主屏幕”。</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold">2</span>
                <p>选择 <span className="font-semibold inline-flex items-center gap-0.5"><PlusSquare className="w-3.5 h-3.5 inline" /> 添加至主屏幕</span> 即可全屏运行。</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </>
  );
};
