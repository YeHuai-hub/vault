use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use pbkdf2::pbkdf2_hmac_array;
use rand::RngCore;
use sha2::{Sha256, Digest};

const PBKDF2_ITERATIONS: u32 = 600_000;
const SALT_LENGTH: usize = 32;
const KEY_LENGTH: usize = 32;

pub fn generate_salt() -> String {
    let mut salt = [0u8; SALT_LENGTH];
    rand::rngs::OsRng.fill_bytes(&mut salt);
    BASE64.encode(salt)
}

pub fn derive_key(master_password: &str, salt_b64: &str) -> Result<[u8; KEY_LENGTH], String> {
    let salt_bytes = BASE64
        .decode(salt_b64)
        .map_err(|e| format!("Invalid salt: {e}"))?;

    Ok(pbkdf2_hmac_array::<Sha256, KEY_LENGTH>(
        master_password.as_bytes(),
        &salt_bytes,
        PBKDF2_ITERATIONS,
    ))
}

/// Fast: SHA256 hash of the derived key — used as auth verification
pub fn key_to_auth_hash(key: &[u8; KEY_LENGTH]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(key);
    BASE64.encode(hasher.finalize())
}
