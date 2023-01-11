use reqwest::Client;

#[tokio::main]
pub async fn download_url_main(
    url: &str,
    file_name: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Received URL {} \n filename {}", url, file_name);

    let client = Client::new();
    let response = client.get(url).send().await?;
    std::fs::write(file_name, response.bytes().await?)?;

    println!("File downloaded to {}", file_name);
    Ok(())
}
