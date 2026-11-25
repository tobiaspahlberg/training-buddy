package se.trainingbuddy.app;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

/**
 * Spoken cues for the Android app.
 *
 * Android WebView does not implement the Web Speech API, so speechSynthesis
 * is simply missing inside the app even though it works in a browser. This
 * plugin exposes the platform TextToSpeech engine instead (see Speaker).
 *
 * It also hands a running session's cues to WorkoutService. The WebView is
 * frozen, and sometimes killed, once another app is in front, so cues spoken
 * from the page's own clock simply stop; the service speaks them instead.
 */
@CapacitorPlugin(name = "Speech")
public class SpeechPlugin extends Plugin {

    /** Plugin calls arrive on a worker thread; the service lives on the main one. */
    private final Handler main = new Handler(Looper.getMainLooper());

    @Override
    public void load() {
        Speaker.get(getContext());   // start the engine now, so the first cue is not late
    }

    /** Reports whether the engine came up, so the web layer can fall back. */
    @PluginMethod
    public void available(PluginCall call) {
        JSObject res = new JSObject();
        res.put("available", Speaker.get(getContext()).isReady());
        call.resolve(res);
    }

    /**
     * The English voices the engine has to offer, without the ones that need
     * a network: a cue has to arrive on a trail with no signal.
     *
     * Only the name and the locale are reported. What a voice sounds like is
     * hidden in its name - Google writes them "en-us-x-iom#male_1-local" -
     * and reading that is the web layer's business, since it is the part that
     * has to put words on the screen anyway.
     */
    @PluginMethod
    public void voices(PluginCall call) {
        JSArray list = new JSArray();
        try {
            Set<Voice> found = Speaker.get(getContext()).voices();
            if (found != null) {
                List<Voice> all = new ArrayList<>(found);
                List<String> seen = new ArrayList<>();
                Collections.sort(all, (a, b) -> a.getName().compareTo(b.getName()));
                for (Voice v : all) {
                    if (v.getLocale() == null) continue;
                    if (!"eng".equals(v.getLocale().getISO3Language())) continue;
                    if (v.isNetworkConnectionRequired()) continue;
                    if (v.getFeatures() != null &&
                        v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                    if (seen.contains(v.getName())) continue;
                    seen.add(v.getName());

                    JSObject o = new JSObject();
                    o.put("name", v.getName());
                    o.put("lang", v.getLocale().toLanguageTag());
                    o.put("quality", v.getQuality());
                    list.put(o);
                }
            }
        } catch (Exception e) {
            // Some engines refuse getVoices() outright; an empty list is
            // the right answer, and the app keeps its default voice.
        }
        JSObject res = new JSObject();
        res.put("voices", list);
        call.resolve(res);
    }

    /** Picks one of them by name. An empty name goes back to the default. */
    @PluginMethod
    public void setVoice(PluginCall call) {
        JSObject res = new JSObject();
        res.put("ok", Speaker.get(getContext()).setVoice(call.getString("name", "")));
        call.resolve(res);
    }

    /**
     * Speaks a cue. Cues queue behind each other; the web layer calls stop()
     * first when it wants the newest one to cut in.
     */
    @PluginMethod
    public void speak(PluginCall call) {
        Speaker.get(getContext()).say(call.getString("text", ""), false);
        call.resolve();
    }

    /** Drops anything queued, used when a session is stopped. */
    @PluginMethod
    public void stop(PluginCall call) {
        Speaker.get(getContext()).stop();
        call.resolve();
    }

    /**
     * Hands the service everything still to come in a running session, and
     * starts it if it is not running yet. Sent again whenever the clock moves
     * other than by itself: start, pause, resume, skip.
     *
     * { title, note, cues: [{ at: epoch ms, text, tones: [Hz...], note, finish }] }
     * An empty list is a paused session: the notification stays, nothing is said.
     */
    @PluginMethod
    public void workout(PluginCall call) {
        String title = call.getString("title", "Workout");
        String note = call.getString("note", "");
        String cues = call.getArray("cues", new JSArray()).toString();
        main.post(() -> {
            try {
                if (WorkoutService.instance != null) {
                    WorkoutService.instance.apply(title, note, cues);
                } else {
                    Context ctx = getContext();
                    Intent intent = new Intent(ctx, WorkoutService.class)
                        .putExtra(WorkoutService.EXTRA_TITLE, title)
                        .putExtra(WorkoutService.EXTRA_NOTE, note)
                        .putExtra(WorkoutService.EXTRA_CUES, cues);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(intent);
                    else ctx.startService(intent);
                }
                call.resolve();
            } catch (Exception e) {
                call.reject("The workout service would not start: " + e.getMessage());
            }
        });
    }

    /**
     * The session is over. With finish, the finishing cue is played now if
     * the service has not played it yet - the page and the service reach the
     * end at almost the same moment, and it must be heard exactly once.
     */
    @PluginMethod
    public void workoutEnd(PluginCall call) {
        boolean finish = Boolean.TRUE.equals(call.getBoolean("finish", false));
        main.post(() -> {
            if (WorkoutService.instance != null) WorkoutService.instance.end(finish);
            call.resolve();
        });
    }
}
