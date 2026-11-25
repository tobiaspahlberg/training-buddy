package se.trainingbuddy.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;

import java.util.HashMap;
import java.util.Locale;
import java.util.Set;

/**
 * The app's one text to speech engine, and its tones.
 *
 * Two things talk through it: the Speech plugin, for what the web layer says
 * there and then ("Paused", the voice test), and WorkoutService, for the cues
 * of a running session, which have to keep coming when the web layer is
 * frozen behind another app. Sharing one engine means one chosen voice and
 * one speaker at a time.
 *
 * Speech is tagged as navigation guidance and takes transient audio focus,
 * which makes music duck for the cue and come back afterwards rather than
 * stopping. Focus is let go when the newest utterance ends, not by counting,
 * since a cue that interrupts another never gets the first one's "done".
 */
final class Speaker {

    private static Speaker instance;

    static synchronized Speaker get(Context context) {
        if (instance == null) instance = new Speaker(context.getApplicationContext());
        return instance;
    }

    private static final int RATE = 44100;

    private final AudioManager audioManager;
    private final Handler main = new Handler(Looper.getMainLooper());
    private TextToSpeech tts;
    private boolean ready = false;
    private String waiting;          // a cue that arrived before the engine was up
    private String current;          // id of the newest utterance
    private AudioFocusRequest focusRequest;
    private boolean focused = false;

    private Speaker(Context context) {
        audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);

        tts = new TextToSpeech(context, status -> {
            if (status != TextToSpeech.SUCCESS) return;

            tts.setLanguage(Locale.UK);
            tts.setSpeechRate(1.05f);
            tts.setAudioAttributes(attributes(AudioAttributes.CONTENT_TYPE_SPEECH));

            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) { }
                @Override public void onDone(String id) { ended(id); }
                @Override public void onError(String id) { ended(id); }
                @Override public void onStop(String id, boolean interrupted) { ended(id); }
            });

            synchronized (Speaker.this) {
                ready = true;
                if (waiting != null) { say(waiting, true); waiting = null; }
            }
        });
    }

    private static AudioAttributes attributes(int contentType) {
        return new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
            .setContentType(contentType)
            .build();
    }

    synchronized boolean isReady() { return ready; }

    synchronized TextToSpeech engine() { return ready ? tts : null; }

    /**
     * Speaks. With interrupt, whatever is being said is cut off first: only
     * the newest cue is worth hearing. Without it, it queues behind.
     */
    synchronized void say(String text, boolean interrupt) {
        if (text == null || text.isEmpty()) return;
        if (!ready) { waiting = text; return; }

        takeFocus();
        current = "tb-" + System.nanoTime();
        HashMap<String, String> params = new HashMap<>();
        params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, current);
        tts.speak(text, interrupt ? TextToSpeech.QUEUE_FLUSH : TextToSpeech.QUEUE_ADD, params);
    }

    /** Drops anything being said or queued. */
    synchronized void stop() {
        waiting = null;
        current = null;
        if (ready) tts.stop();
        releaseFocus();
    }

    private synchronized void ended(String id) {
        if (id != null && id.equals(current)) { current = null; releaseFocus(); }
    }

    /* ---- Voices ---- */

    synchronized Set<Voice> voices() { return ready ? tts.getVoices() : null; }

    /** Picks a voice by name. An empty name goes back to the default. */
    synchronized boolean setVoice(String want) {
        if (!ready) return false;
        if (want == null || want.isEmpty()) { tts.setLanguage(Locale.UK); return true; }
        try {
            for (Voice v : tts.getVoices()) {
                if (v.getName().equals(want)) return tts.setVoice(v) == TextToSpeech.SUCCESS;
            }
        } catch (Exception e) {
            return false;
        }
        return false;
    }

    /* ---- Tones ----
       The same soft sine blips the web layer plays (880 Hz means go, 590 Hz
       ease off, three rising ones for the finish), so the app sounds the same
       whether the cue came from the page or from the service. */

    void tones(double[] freqs) {
        if (freqs == null || freqs.length == 0) return;
        final int gap = RATE * 260 / 1000, len = RATE * 240 / 1000;
        short[] pcm = new short[gap * (freqs.length - 1) + len];
        for (int k = 0; k < freqs.length; k++) {
            for (int i = 0; i < len; i++) {
                double t = (double) i / RATE;
                /* 10 ms up, then an exponential fall, like the web version. */
                double env = t < 0.01 ? t / 0.01 : Math.exp(-(t - 0.01) * 30);
                pcm[k * gap + i] += (short) (Math.sin(2 * Math.PI * freqs[k] * t) * env * 0.35 * Short.MAX_VALUE);
            }
        }
        try {
            final AudioTrack track = new AudioTrack.Builder()
                .setAudioAttributes(attributes(AudioAttributes.CONTENT_TYPE_SONIFICATION))
                .setAudioFormat(new AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(RATE)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build())
                .setTransferMode(AudioTrack.MODE_STATIC)
                .setBufferSizeInBytes(pcm.length * 2)
                .build();
            track.write(pcm, 0, pcm.length);
            track.play();
            main.postDelayed(track::release, pcm.length * 1000L / RATE + 200);
        } catch (Exception e) {
            // A tone is a nicety: the spoken cue still follows.
        }
    }

    /* ---- Audio focus ---- */

    private void takeFocus() {
        if (focused || audioManager == null) return;
        focused = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                .setAudioAttributes(attributes(AudioAttributes.CONTENT_TYPE_SPEECH))
                .build();
            audioManager.requestAudioFocus(focusRequest);
        } else {
            audioManager.requestAudioFocus(null, AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK);
        }
    }

    private void releaseFocus() {
        if (!focused || audioManager == null) return;
        focused = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (focusRequest != null) audioManager.abandonAudioFocusRequest(focusRequest);
        } else {
            audioManager.abandonAudioFocus(null);
        }
    }
}
