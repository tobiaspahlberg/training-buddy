package se.trainingbuddy.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SpeechPlugin.class);
        registerPlugin(BackupPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
