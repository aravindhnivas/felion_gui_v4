#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use get_port::tcp::TcpPort;
// use get_port::udp::UdpPort;
use get_port::{Ops, Range};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn get_tcp_port() -> u16 {
    let tcp_port = TcpPort::in_range(
        "127.0.0.1",
        Range {
            min: 6000,
            max: 7000,
        },
    )
    .unwrap();
    // let udp_port = UdpPort::in_range("127.0.0.1", Range {min: 8000, max: 9000 }).unwrap();
    format!("Available port, {}", tcp_port);
    return tcp_port;
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_tcp_port])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
