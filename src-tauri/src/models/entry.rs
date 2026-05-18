use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entry {
    pub id: String,
    pub category_id: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_name: Option<String>,
    pub title: String,
    pub website: Option<String>,
    pub is_favorite: bool,
    pub created_at: String,
    pub updated_at: String,
    // Decrypted fields (never stored, only returned to frontend)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_fields: Option<Vec<CustomField>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tag_ids: Option<Vec<i64>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomField {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedEntryData {
    pub username: String,
    pub password: String,
    pub notes: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub totp_secret: Option<String>,
    pub custom_fields: Vec<CustomField>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateEntry {
    pub category_id: Option<i64>,
    pub title: String,
    pub website: Option<String>,
    pub username: String,
    pub password: String,
    pub notes: Option<String>,
    pub custom_fields: Option<Vec<CustomField>>,
    pub tag_ids: Option<Vec<i64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub totp_secret: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateEntry {
    pub category_id: Option<i64>,
    pub title: Option<String>,
    pub website: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub totp_secret: Option<String>,
    pub custom_fields: Option<Vec<CustomField>>,
    pub tag_ids: Option<Vec<i64>>,
}
