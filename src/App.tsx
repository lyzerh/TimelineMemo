/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TaskProvider, useTasks } from './context/TaskContext';
import { DateNavigator } from './components/DateNavigator';
import { AllDayTasks } from './components/AllDayTasks';
import { Timeline } from './components/Timeline';
import { CalendarView } from './components/CalendarView';
import { SettingsView } from './components/SettingsView';
import { BottomNavigation } from './components/BottomNavigation';
import { TaskEditor } from './components/TaskEditor';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Plus } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentTab, setCurrentTab, selectedDateTasks, selectedDate, openCreateModal } = useTasks();

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 min-h-screen flex flex-col relative shadow-2xl sm:border-x sm:border-slate-200/80 sm:dark:border-slate-800 transition-colors">
      {/* Offline connectivity indicator */}
      <OfflineIndicator />

      {/* Main Tab Content */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        {currentTab === 'timeline' && (
          <>
            <DateNavigator />
            <AllDayTasks tasks={selectedDateTasks.allDayTasks} />
            <Timeline tasks={selectedDateTasks.timedTasks} />
          </>
        )}

        {currentTab === 'calendar' && <CalendarView />}

        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Floating Action Button (FAB) */}
      {currentTab !== 'settings' && (
        <button
          onClick={() => openCreateModal(selectedDate)}
          aria-label="新增任务"
          className="fixed sm:absolute bottom-20 right-5 z-30 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
      />

      {/* Global Task Editor Modal */}
      <TaskEditor />
    </div>
  );
};

export default function App() {
  return (
    <TaskProvider>
      <div className="min-h-screen bg-slate-100/80 dark:bg-slate-950 flex justify-center text-slate-800 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white antialiased">
        <MainAppContent />
      </div>
    </TaskProvider>
  );
}
