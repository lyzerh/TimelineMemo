import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { Task, TaskColor } from '../types/Task';
import { timeStringToMinutes } from '../utils/dateUtils';
import { X, Trash2, CheckCircle2, Clock, Calendar, FileText, Palette, Check } from 'lucide-react';

const COLOR_OPTIONS: Array<{ value: TaskColor; label: string; bg: string }> = [
  { value: 'indigo', label: '沉稳蓝', bg: 'bg-indigo-500' },
  { value: 'emerald', label: '薄荷绿', bg: 'bg-emerald-500' },
  { value: 'amber', label: '活力橙', bg: 'bg-amber-500' },
  { value: 'rose', label: '珊瑚红', bg: 'bg-rose-500' },
  { value: 'purple', label: '优雅紫', bg: 'bg-purple-500' },
  { value: 'sky', label: '天空青', bg: 'bg-sky-500' },
];

export const TaskEditor: React.FC = () => {
  const {
    isEditorOpen,
    editingTask,
    editorPresetDate,
    editorPresetStartTime,
    closeEditorModal,
    createTask,
    updateTask,
    deleteTask,
    setSelectedDate,
  } = useTasks();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [note, setNote] = useState('');
  const [color, setColor] = useState<TaskColor>('indigo');
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync form state when modal opens or editingTask changes
  useEffect(() => {
    if (isEditorOpen) {
      setError('');
      setConfirmDelete(false);
      if (editingTask) {
        setTitle(editingTask.title);
        setDate(editingTask.date);
        setAllDay(editingTask.allDay);
        setStartTime(editingTask.startTime || '09:00');
        setEndTime(editingTask.endTime || '10:00');
        setNote(editingTask.note || '');
        setColor(editingTask.color || 'indigo');
        setCompleted(editingTask.completed);
      } else {
        setTitle('');
        setDate(editorPresetDate);
        setAllDay(!editorPresetStartTime);
        const presetStart = editorPresetStartTime || '09:00';
        setStartTime(presetStart);
        // Calculate default end time 1 hour later
        const [h, m] = presetStart.split(':').map(Number);
        const nextH = Math.min(23, (h || 9) + 1);
        setEndTime(`${String(nextH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`);
        setNote('');
        setColor('indigo');
        setCompleted(false);
      }
    }
  }, [isEditorOpen, editingTask, editorPresetDate, editorPresetStartTime]);

  if (!isEditorOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('请输入任务标题');
      return;
    }

    if (!allDay) {
      if (startTime && endTime) {
        const startMins = timeStringToMinutes(startTime);
        const endMins = timeStringToMinutes(endTime);
        if (endMins <= startMins) {
          setError('结束时间必须晚于开始时间');
          return;
        }
      }
    }

    try {
      if (editingTask) {
        await updateTask({
          ...editingTask,
          title: title.trim(),
          date,
          allDay,
          startTime: allDay ? undefined : startTime,
          endTime: allDay ? undefined : endTime,
          note: note.trim() || undefined,
          color,
          completed,
        });
      } else {
        await createTask({
          title: title.trim(),
          date,
          allDay,
          startTime: allDay ? undefined : startTime,
          endTime: allDay ? undefined : endTime,
          note: note.trim() || undefined,
          color,
          completed,
        });
      }

      // If user scheduled task for a different date, switch view to that date so they immediately see it!
      setSelectedDate(date);
      closeEditorModal();
    } catch (err) {
      console.error(err);
      setError('保存失败，请重试');
    }
  };

  const handleConfirmDelete = async () => {
    if (!editingTask) return;
    try {
      await deleteTask(editingTask.id);
      closeEditorModal();
    } catch (e) {
      console.error(e);
      setError('删除失败，请重试');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in p-0 sm:p-4">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={closeEditorModal} />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] z-10 transition-transform">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {editingTask ? '编辑任务' : '新建课表 / 待办'}
            </h3>
            {editingTask && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  completed
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {completed ? '已完成' : '进行中'}
              </span>
            )}
          </div>
          <button
            onClick={closeEditorModal}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              任务名称 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：写实验报告、背单词、健身..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
            />
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>日期</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* All day toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">全天 To-do</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  没有具体时间，置于顶部全天清单
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAllDay(!allDay)}
              className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                allDay ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 left-0.5 ${
                  allDay ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Start Time & End Time (Hidden if allDay) */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 animate-fade-in">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  开始时间
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  结束时间（可选）
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Color Tag Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              <span>课表分类色彩</span>
            </label>
            <div className="flex items-center gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-transform ${
                    color === c.value
                      ? 'ring-3 ring-indigo-500/40 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-110 shadow-xs'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.label}
                >
                  {color === c.value && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>备注</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="添加细节或要点..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
            />
          </div>

          {/* Edit status actions */}
          {editingTask && (
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCompleted(!completed)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition ${
                  completed
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{completed ? '标记为未完成' : '设为已完成'}</span>
              </button>

              {confirmDelete ? (
                <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 p-1 pl-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 animate-fade-in">
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">确定删除？</span>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 active:scale-95 transition shadow-xs cursor-pointer"
                  >
                    删除
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>删除任务</span>
                </button>
              )}
            </div>
          )}

          {/* Submit & Cancel Buttons */}
          <div className="pt-2 flex gap-2.5">
            <button
              type="button"
              onClick={closeEditorModal}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
