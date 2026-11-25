package se.trainingbuddy.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Keeps a running session talking while another app is in front.
 *
 * The page's clock lives in a WebView, and Android freezes that WebView - or
 * kills the whole app - once YouTube or anything else has the screen. The
 * time was never lost, since it is rebuilt from timestamps, but the cues went
 * silent. A foreground service is Android's way of saying "the user is
 * waiting on this", and it keeps the app alive.
 *
 * The page stays the owner of the session. Whenever its clock moves other
 * than by itself (start, pause, resume, skip) it sends every cue still to
 * come, each with its time of day, and this service only says them when the
 * moment arrives. It knows nothing about plans, steps or blocks.
 *
 * It also owns the ongoing notification while it runs. It posts on the same
 * channel the page used, so the phone treats it as the same notification.
 */
public class WorkoutService extends Service {

    static final String EXTRA_TITLE = "title";
    static final String EXTRA_NOTE = "note";
    static final String EXTRA_CUES = "cues";

    /** Shared with the page's own notification (NOTE_CHANNEL in index.html). */
    private static final String CHANNEL_ID = "tb-session-v1";
    private static final int NOTIFICATION_ID = 1;

    static WorkoutService instance;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private PowerManager.WakeLock wakeLock;
    private String title = "Workout";
    private JSONObject finishCue;    // still to be played, or null

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        /* startForeground has to come at once: a service started with
           startForegroundService that does not call it is killed. */
        String t = intent != null ? intent.getStringExtra(EXTRA_TITLE) : null;
        String note = intent != null ? intent.getStringExtra(EXTRA_NOTE) : null;
        String cues = intent != null ? intent.getStringExtra(EXTRA_CUES) : null;
        if (t != null) title = t;
        post(note != null ? note : "");

        /* Restarted by the system with nothing to say: the page will send the
           schedule again when it comes back. */
        if (cues == null) { end(false); return START_NOT_STICKY; }
        apply(t, note, cues);
        return START_NOT_STICKY;
    }

    /** Replaces whatever was scheduled with this. */
    void apply(String newTitle, String note, String cuesJson) {
        if (newTitle != null) title = newTitle;
        handler.removeCallbacksAndMessages(null);
        finishCue = null;
        post(note);

        long now = System.currentTimeMillis(), last = 0;
        try {
            JSONArray cues = new JSONArray(cuesJson);
            for (int i = 0; i < cues.length(); i++) {
                final JSONObject c = cues.getJSONObject(i);
                long at = c.getLong("at");
                last = Math.max(last, at);
                if (c.optBoolean("finish")) finishCue = c;
                handler.postDelayed(() -> fire(c), Math.max(0, at - now));
            }
        } catch (Exception e) {
            end(false);
            return;
        }

        if (last == 0) { releaseWakeLock(); return; }   // paused: shown, silent

        /* The CPU sleeps with the screen, and a delayed post does not run
           while it does, so it is held awake until the last cue. The service
           goes by itself a little after that, in case the page is gone. */
        long until = Math.max(0, last - now) + 15_000;
        acquireWakeLock(until);
        handler.postDelayed(() -> end(false), until);
    }

    private void fire(JSONObject c) {
        if (c.optBoolean("finish")) finishCue = null;
        Speaker sp = Speaker.get(this);
        JSONArray hz = c.optJSONArray("tones");
        if (hz != null && hz.length() > 0) {
            double[] f = new double[hz.length()];
            for (int i = 0; i < f.length; i++) f[i] = hz.optDouble(i, 880);
            sp.tones(f);
        }
        sp.say(c.optString("text", ""), true);
        String note = c.optString("note", "");
        if (!note.isEmpty()) post(note);
    }

    /** Stops the service and takes the notification with it. */
    void end(boolean finishing) {
        handler.removeCallbacksAndMessages(null);
        if (finishing && finishCue != null) fire(finishCue);
        finishCue = null;
        releaseWakeLock();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) stopForeground(STOP_FOREGROUND_REMOVE);
        else stopForeground(true);
        stopSelf();
        if (instance == this) instance = null;
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        releaseWakeLock();
        if (instance == this) instance = null;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    /* ---- The notification ---- */

    /** The same settings the page gives the channel: seen, never heard. */
    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "Running session",
            NotificationManager.IMPORTANCE_LOW);
        ch.setSound(null, null);
        ch.enableVibration(false);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(ch);
    }

    private void post(String text) {
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (open == null) open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent tap = PendingIntent.getActivity(this, 0, open,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CHANNEL_ID)
            : new Notification.Builder(this);
        Notification n = b
            .setSmallIcon(R.drawable.ic_stat_tb)
            .setColor(Color.parseColor("#4ADE80"))
            .setContentTitle(title)
            .setContentText(text)
            .setContentIntent(tap)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, n);
        }
    }

    /* ---- Wake lock ---- */

    private void acquireWakeLock(long ms) {
        releaseWakeLock();
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "TrainingBuddy:session");
        wakeLock.setReferenceCounted(false);
        wakeLock.acquire(Math.max(ms, 1000));
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        wakeLock = null;
    }
}
