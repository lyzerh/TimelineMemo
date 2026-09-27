import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { getLocalDateKey } from '../utils/dateUtils';
import { widgetSyncService } from '../services/widgetSyncService';
import { PWAInstallButton } from './PWAInstallButton';
import { TodayWidget } from './TodayWidget';
import {
  Moon,
  Sun,
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Info,
  Smartphone,
  Eye,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    isDark,
    toggleDarkMode,
    tasks,
    resetToDemo,
    clearAllTasks,
    exportTasksJSON,
    importTasks,
    toggleTaskComplete,
    openEditModal,
  } = useTasks();

  const [importStatus, setImportStatus] = useState<string>('');
  const [showWidgetPreview, setShowWidgetPreview] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleManualSyncWidget = async () => {
    try {
      await widgetSyncService.syncWidgetSnapshot(tasks);
      setSyncStatus('已同步最新数据到桌面小组件！');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch {
      setSyncStatus('同步完成');
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const handleExport = async () => {
    try {
      const json = await exportTasksJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline-memo-backup-${getLocalDateKey()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('导出备份失败');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        await importTasks(text);
        setImportStatus('成功导入任务！');
        setTimeout(() => setImportStatus(''), 3000);
      } catch (err) {
        console.error(err);
        setImportStatus('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = async () => {
    await resetToDemo();
    setConfirmReset(false);
  };

  const handleClear = async () => {
    await clearAllTasks();
    setConfirmClear(false);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-28 p-4 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">应用设置</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          个性化偏好、桌面 Widget 预览与数据备份
        </p>
      </div>

      {/* PWA & Install Card */}
      <PWAInstallButton variant="card" />

      {/* Section 1: Appearance */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
          界面外观
        </h3>

        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            {isDark ? (
              <div className="w-8 h-8 rounded-xl bg-indigo-950/60 text-indigo-400 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                深色模式 (Dark Mode)
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {isDark ? '已启用深色夜间主题' : '已启用浅色清新主题'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleDarkMode}
            className={`w-12 h-7 rounded-full transition-colors relative focus:outline-none ${
              isDark ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-1 left-1 ${
                isDark ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Section 2: Today Widget Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Today Widget 预览
            </h3>
          </div>
          <button
            onClick={() => setShowWidgetPreview(!showWidgetPreview)}
            className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showWidgetPreview ? '收起' : '展开'}</span>
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          模拟手机桌面小组件 (Home Screen Widget)。独立组件设计，已封装 Android 原生 AppWidgetProvider，支持长按桌面添加。
        </p>

        {syncStatus && (
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium animate-fade-in">
            {syncStatus}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleManualSyncWidget}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>立即同步原生小组件</span>
          </button>
        </div>

        {showWidgetPreview && (
          <div className="pt-2">
            <TodayWidget
              tasks={tasks}
              onToggleTask={toggleTaskComplete}
              onOpenTask={openEditModal}
            />
          </div>
        )}
      </div>

      {/* Section 3: Data Management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">本地数据管理</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          当前共存储 <strong>{tasks.length}</strong> 条任务数据。全本地安全运行，支持随时备份导出。
        </p>

        {importStatus && (
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
            {importStatus}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出 JSON 备份</span>
          </button>

          <label className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>导入备份文件</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex flex-col gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-2">
            {confirmReset ? (
              <div className="flex-1 flex items-center justify-between p-1.5 px-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 animate-fade-in text-xs">
                <span className="text-indigo-700 dark:text-indigo-300 font-medium">恢复示例数据？</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleResetDemo}
                    className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer"
                  >
                    确认
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>重置为示例数据</span>
              </button>
            )}

            {confirmClear ? (
              <div className="flex-1 flex items-center justify-between p-1.5 px-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 animate-fade-in text-xs">
                <span className="text-rose-600 dark:text-rose-400 font-medium">确认清空？</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleClear}
                    className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 cursor-pointer"
                  >
                    清空
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空所有任务</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: About & Packaging Info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">关于应用</h3>
        </div>
        <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          <p>
            <strong>Timeline Memo (课表备忘录)</strong> v1.0.0
          </p>
          <p>以“日期 + 课表时间轴”为核心的移动端优先时间规划与待办备忘工具。</p>
          <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 mt-2 space-y-0.5">
            <p>• 预留 PWA / TWA / Capacitor / APK 一键打包条件</p>
            <p>• 本地毫秒级瞬时响应，离线完整可用</p>
          </div>
        </div>
      </div>
    </div>
  );
};
