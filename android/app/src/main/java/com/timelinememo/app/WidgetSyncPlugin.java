package com.timelinememo.app;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetSyncPlugin")
public class WidgetSyncPlugin extends Plugin {

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        String payload = call.getString("payload");
        if (payload == null) {
            JSObject data = call.getObject("payload");
            if (data != null) {
                payload = data.toString();
            }
        }

        if (payload != null) {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(
                    TodayAppWidgetProvider.PREFS_NAME,
                    Context.MODE_PRIVATE
            );
            prefs.edit().putString(TodayAppWidgetProvider.KEY_PAYLOAD, payload).apply();

            // Refresh all installed Home Screen Widgets immediately
            TodayAppWidgetProvider.updateAllWidgets(context);

            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } else {
            call.reject("Payload is missing");
        }
    }

    @PluginMethod
    public void getWidgetData(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(
                TodayAppWidgetProvider.PREFS_NAME,
                Context.MODE_PRIVATE
        );
        String payload = prefs.getString(TodayAppWidgetProvider.KEY_PAYLOAD, "{}");
        JSObject res = new JSObject();
        res.put("payload", payload);
        call.resolve(res);
    }
}
