package se.trainingbuddy.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import androidx.annotation.RequiresApi;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Writing a backup to a file the phone's own file manager can find.
 *
 * A WebView will not do this on its own: nothing in Capacitor listens for a
 * download, and a blob: URL is not something Android's download manager can
 * fetch anyway, so the anchor that works in a browser silently does nothing
 * inside the app. The file is written here instead.
 *
 * From Android 10 the way in is MediaStore, which needs no permission at all
 * for the shared Downloads folder. Older phones would need one, so they get
 * the app's own folder on external storage rather than a permission prompt
 * for something they asked for once. Either way the path that comes back is
 * the real one, and the app says it out loud - a backup nobody can find is
 * no better than no backup.
 */
@CapacitorPlugin(name = "Backup")
public class BackupPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        String name = call.getString("name", "training-buddy.json");
        String text = call.getString("text", "");
        JSObject res = new JSObject();
        try {
            String where = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                ? saveToDownloads(name, text)
                : saveBeside(name, text);
            res.put("ok", true);
            res.put("where", where);
        } catch (Exception e) {
            /* Not an error to throw at the web layer: it has the clipboard to
               fall back on, and a refusal it can act on beats a rejection. */
            res.put("ok", false);
            res.put("error", String.valueOf(e.getMessage()));
        }
        call.resolve(res);
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    private String saveToDownloads(String name, String text) throws Exception {
        ContentResolver cr = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME, name);
        values.put(MediaStore.Downloads.MIME_TYPE, "application/json");
        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
        values.put(MediaStore.Downloads.IS_PENDING, 1);

        Uri uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (uri == null) throw new Exception("the phone would not take the file");

        try (OutputStream out = cr.openOutputStream(uri)) {
            if (out == null) throw new Exception("the file could not be opened for writing");
            out.write(text.getBytes(StandardCharsets.UTF_8));
        }

        values.clear();
        values.put(MediaStore.Downloads.IS_PENDING, 0);
        cr.update(uri, values, null, null);

        return "Downloads/" + displayName(cr, uri, name);
    }

    /** Two backups on the same day: the phone renames the second one itself. */
    private String displayName(ContentResolver cr, Uri uri, String fallback) {
        try (Cursor c = cr.query(uri, new String[]{ MediaStore.Downloads.DISPLAY_NAME },
                                 null, null, null)) {
            if (c != null && c.moveToFirst()) {
                String found = c.getString(0);
                if (found != null && !found.isEmpty()) return found;
            }
        } catch (Exception e) {
            // the file is written either way; only its name is in doubt
        }
        return fallback;
    }

    private String saveBeside(String name, String text) throws Exception {
        File dir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (dir == null) throw new Exception("this phone has nowhere to write to");
        if (!dir.exists() && !dir.mkdirs()) throw new Exception("the folder could not be made");

        File file = new File(dir, name);
        try (FileOutputStream out = new FileOutputStream(file)) {
            out.write(text.getBytes(StandardCharsets.UTF_8));
        }
        return file.getAbsolutePath();
    }
}
