package cc.lskl.souzou;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // Enable edge-to-edge display (draw behind status bar and navigation bar)
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // Make status bar and navigation bar transparent
        window.setStatusBarColor(android.graphics.Color.TRANSPARENT);
        window.setNavigationBarColor(android.graphics.Color.TRANSPARENT);

        // For Android 10+ (API 29+), enable gesture navigation edge-to-edge
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(false);
        }

        // Set navigation bar to be transparent and not scrim
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            window.getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            );
        }
    }
}
