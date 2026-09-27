package com.timelinememo.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.style.StrikethroughSpan;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Native Android Home Screen Widget Provider for Timeline Memo
 */
public class TodayAppWidgetProvider extends AppWidgetProvider {

    public static final String PREFS_NAME = "TimelineMemoWidgetPrefs";
    public static final String KEY_PAYLOAD = "widget_payload";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (Intent.ACTION_DATE_CHANGED.equals(action) ||
            Intent.ACTION_TIMEZONE_CHANGED.equals(action) ||
            Intent.ACTION_TIME_CHANGED.equals(action)) {
            // When device date or timezone changes (e.g. crossing midnight), refresh widgets
            updateAllWidgets(context);
        }
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName thisWidget = new ComponentName(context, TodayAppWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
        if (appWidgetIds != null && appWidgetIds.length > 0) {
            for (int appWidgetId : appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId);
            }
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_today);

        // 1. Determine device local date key: YYYY-MM-DD
        SimpleDateFormat keyFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        String deviceTodayKey = keyFormat.format(new Date());

        // Default display date if no payload: e.g. "9月27日 周日"
        SimpleDateFormat displayFormat = new SimpleDateFormat("M月d日 E", Locale.CHINA);
        String defaultDateDisplay = displayFormat.format(new Date());

        // 2. Read SharedPreferences synced from React
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String payloadJson = prefs.getString(KEY_PAYLOAD, null);

        String dateDisplay = defaultDateDisplay;
        int total = 0;
        int completed = 0;
        JSONArray tasksArray = null;

        if (payloadJson != null) {
            try {
                JSONObject root = new JSONObject(payloadJson);
                JSONObject days = root.optJSONObject("days");
                if (days != null) {
                    // Try to get data for today's device date key
                    JSONObject dayData = days.optJSONObject(deviceTodayKey);
                    if (dayData != null) {
                        dateDisplay = dayData.optString("dateDisplay", defaultDateDisplay);
                        total = dayData.optInt("total", 0);
                        completed = dayData.optInt("completed", 0);
                        tasksArray = dayData.optJSONArray("tasks");
                    } else {
                        // If exact today is not found, check if a "today" snapshot exists as fallback
                        JSONObject fallbackToday = root.optJSONObject("today");
                        if (fallbackToday != null && deviceTodayKey.equals(fallbackToday.optString("date"))) {
                            dateDisplay = fallbackToday.optString("dateDisplay", defaultDateDisplay);
                            total = fallbackToday.optInt("total", 0);
                            completed = fallbackToday.optInt("completed", 0);
                            tasksArray = fallbackToday.optJSONArray("tasks");
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // 3. Bind Header
        views.setTextViewText(R.id.widget_date_text, dateDisplay);
        views.setTextViewText(R.id.widget_counter_text, completed + " / " + total + " completed");

        // 4. Bind Tasks (up to 4 visible rows)
        int[] rowIds = {R.id.task_row_1, R.id.task_row_2, R.id.task_row_3, R.id.task_row_4};
        int[] timeIds = {R.id.task_time_1, R.id.task_time_2, R.id.task_time_3, R.id.task_time_4};
        int[] titleIds = {R.id.task_title_1, R.id.task_title_2, R.id.task_title_3, R.id.task_title_4};

        int taskCount = tasksArray != null ? tasksArray.length() : 0;

        if (taskCount == 0) {
            views.setViewVisibility(R.id.widget_empty_view, View.VISIBLE);
            views.setViewVisibility(R.id.widget_more_text, View.GONE);
            for (int rId : rowIds) {
                views.setViewVisibility(rId, View.GONE);
            }
        } else {
            views.setViewVisibility(R.id.widget_empty_view, View.GONE);

            for (int i = 0; i < 4; i++) {
                if (i < taskCount) {
                    try {
                        JSONObject taskObj = tasksArray.getJSONObject(i);
                        String title = taskObj.optString("title", "");
                        boolean allDay = taskObj.optBoolean("allDay", false);
                        String startTime = taskObj.optString("startTime", "");
                        boolean isDone = taskObj.optBoolean("completed", false);

                        String timeLabel = allDay || startTime.isEmpty() ? "全天" : startTime;

                        views.setTextViewText(timeIds[i], timeLabel);

                        // If completed: strike-through title & dimmed colors
                        if (isDone) {
                            SpannableString span = new SpannableString(title);
                            span.setSpan(new StrikethroughSpan(), 0, title.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                            views.setTextViewText(titleIds[i], span);
                            views.setTextColor(titleIds[i], 0xFF94A3B8);
                            views.setTextColor(timeIds[i], 0xFF94A3B8);
                        } else {
                            views.setTextViewText(titleIds[i], title);
                            views.setTextColor(titleIds[i], 0xFF1E293B);
                            views.setTextColor(timeIds[i], allDay ? 0xFF64748B : 0xFF4F46E5);
                        }

                        views.setViewVisibility(rowIds[i], View.VISIBLE);
                    } catch (Exception e) {
                        views.setViewVisibility(rowIds[i], View.GONE);
                    }
                } else {
                    views.setViewVisibility(rowIds[i], View.GONE);
                }
            }

            // More items indicator
            if (taskCount > 4) {
                int moreCount = taskCount - 4;
                views.setTextViewText(R.id.widget_more_text, "+ " + moreCount + " more");
                views.setViewVisibility(R.id.widget_more_text, View.VISIBLE);
            } else {
                views.setViewVisibility(R.id.widget_more_text, View.GONE);
            }
        }

        // 5. Click Intent: Open Timeline Memo App (MainActivity)
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("OPEN_TARGET", "today_timeline");
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        // Commit update
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
