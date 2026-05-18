use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, AeadCore, Nonce,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct EncryptedPayload {
    nonce: String,
    ciphertext: String,
}

pub fn encrypt(plaintext: &str, key: &[u8; 32]) -> Result<String, String> {
    let cipher =
        Aes256Gcm::new_from_slice(key).map_err(|e| format!("Failed to create cipher: {e}"))?;
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let ciphertext = cipher
        .encrypt(&nonce, plaintext.as_bytes())
        .map_err(|e| format!("Encryption failed: {e}"))?;

    let payload = EncryptedPayload {
        nonce: BASE64.encode(nonce.as_slice()),
        ciphertext: BASE64.encode(&ciphertext),
    };

    serde_json::to_string(&payload).map_err(|e| format!("Serialization failed: {e}"))
}

pub fn decrypt(encrypted_json: &str, key: &[u8; 32]) -> Result<String, String> {
    let payload: EncryptedPayload =
        serde_json::from_str(encrypted_json).map_err(|e| format!("Invalid payload: {e}"))?;

    let nonce_bytes = BASE64
        .decode(&payload.nonce)
        .map_err(|e| format!("Invalid nonce: {e}"))?;
    let ciphertext = BASE64
        .decode(&payload.ciphertext)
        .map_err(|e| format!("Invalid ciphertext: {e}"))?;

    let nonce = Nonce::from_slice(&nonce_bytes);
    let cipher =
        Aes256Gcm::new_from_slice(key).map_err(|e| format!("Failed to create cipher: {e}"))?;

    let plaintext = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|e| format!("Decryption failed: {e}"))?;

    String::from_utf8(plaintext).map_err(|e| format!("Invalid UTF-8: {e}"))
}
