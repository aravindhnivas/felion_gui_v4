#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use portpicker::pick_unused_port;
use tauri_plugin_window_state;
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn get_tcp_port() -> u16 {
    let port: u16 = pick_unused_port().expect("No ports free");
    return port;
}

mod download;

#[tauri::command]
async fn download_url(url: &str, file_name: &str) -> Result<String, String> {
    match download::download_url_main(url, file_name).await {
        Ok(_) => Ok("Download completed successfully".into()),
        Err(e) => Err(format!("{:?}", e).into()),
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_tcp_port, download_url])
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
