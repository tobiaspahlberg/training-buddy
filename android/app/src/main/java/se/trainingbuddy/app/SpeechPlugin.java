package se.trainingbuddy.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import android.speech.tts.Voice;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;

/**
 * Spoken cues for the Android app.
 *
 * Android WebView does not implement the Web Speech API, so speechSynthesis
 * is simply missing inside the app even though it works in a browser. This
 * plugin exposes the platform TextToSpeech engine instead.
 *
 * Speech is tagged as navigation guidance and takes transient audio focus,
 * which makes music duck for the cue and come back afterwards rather than
 * stopping.
 */
@CapacitorPlugin(name = "Speech")
public class SpeechPlugin extends Plugin {

    private TextToSpeech tts;
    private boolean ready = false;
    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;
    private int speaking = 0;

    @Override
    public void load() {
        audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);

        tts = new TextToSpeech(getContext(), status -> {
            if (status != TextToSpeech.SUCCESS) return;

            tts.setLanguage(Locale.UK);
            tts.setSpeechRate(1.05f);
            tts.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build());

            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) { }
                @Override public void onDone(String id) { releaseFocus(); }
                @Override public void onError(String id) { releaseFocus(); }
            });

            ready = true;
        });
    }

    /** Reports whether the engine came up, so the web layer can fall back. */
    @PluginMethod
    public void available(PluginCall call) {
        JSObject res = new JSObject();
        res.put("available", ready);
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
        if (ready) {
            try {
                List<Voice> all = new ArrayList<>(tts.getVoices());
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
            } catch (Exception e) {
                // Some engines refuse getVoices() outright; an empty list is
                // the right answer, and the app keeps its default voice.
            }
        }
        JSObject res = new JSObject();
        res.put("voices", list);
        call.resolve(res);
    }

    /** Picks one of them by name. An empty name goes back to the default. */
    @PluginMethod
    public void setVoice(PluginCall call) {
        String want = call.getString("name", "");
        boolean done = false;
        if (ready) {
            if (want == null || want.isEmpty()) {
                tts.setLanguage(Locale.UK);
                done = true;
            } else {
                try {
                    for (Voice v : tts.getVoices()) {
                        if (v.getName().equals(want)) {
                            done = tts.setVoice(v) == TextToSpeech.SUCCESS;
                            break;
                        }
                    }
                } catch (Exception e) {
                    done = false;
                }
            }
        }
        JSObject res = new JSObject();
        res.put("ok", done);
        call.resolve(res);
    }

    /**
     * Speaks a cue. Cues queue behind each other so a countdown is not cut
     * off by the step change that follows it.
     */
    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        if (!ready || text == null || text.isEmpty()) { call.resolve(); return; }

        takeFocus();

        HashMap<String, String> params = new HashMap<>();
        params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "tb-" + System.nanoTime());
        tts.speak(text, TextToSpeech.QUEUE_ADD, params);

        call.resolve();
    }

    /** Drops anything queued, used when a session is stopped. */
    @PluginMethod
    public void stop(PluginCall call) {
        if (ready) tts.stop();
        speaking = 0;
        releaseFocus();
        call.resolve();
    }

    private void takeFocus() {
        speaking++;
        if (audioManager == null || speaking > 1) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                .setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build())
                .build();
            audioManager.requestAudioFocus(focusRequest);
        } else {
            audioManager.requestAudioFocus(null, AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK);
        }
    }

    private void releaseFocus() {
        if (speaking > 0) speaking--;
        if (speaking > 0 || audioManager == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (focusRequest != null) audioManager.abandonAudioFocusRequest(focusRequest);
        } else {
            audioManager.abandonAudioFocus(null);
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        releaseFocus();
    }
}
