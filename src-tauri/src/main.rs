#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use portpicker::pick_unused_port;
use tauri_plugin_window_state;

use tauri::Manager;
use tauri_plugin_log::{fern::colors::ColoredLevelConfig, LogTarget, LoggerBuilder};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn get_tcp_port() -> u16 {
    let port: u16 = pick_unused_port().expect("No ports free");
    return port;
}

fn main() {
    let targets = [LogTarget::LogDir, LogTarget::Stdout, LogTarget::Webview];
    let colors = ColoredLevelConfig::default();
    let context = tauri::generate_context!();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_tcp_port])
        .setup(|app| {
            #[cfg(debug_assertions)]
            app.get_window("main").unwrap().open_devtools();
            Ok(())
        })
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(
            LoggerBuilder::new()
                .with_colors(colors)
                .targets(targets)
                .build(),
        )
        .run(context)
        .expect("error while running tauri application");
}
