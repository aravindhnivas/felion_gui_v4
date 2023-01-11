use error_chain::error_chain;
// use futures::stream::{Stream, StreamExt};
error_chain! {
    foreign_links {
        Io(std::io::Error);
        HttpRequest(reqwest::Error);
    }
}

// #[tokio::main]
pub async fn download_url_main(url: &str, file_name: &str) -> Result<()> {
    let response = reqwest::get(url).await?;

    if !response.status().is_success() {
        return Err(format!("Failed to download file: {}", response.status()).into());
    }
    std::fs::write(file_name, response.bytes().await?)?;
    Ok(())
}
