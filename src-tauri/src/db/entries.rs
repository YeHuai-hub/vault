use rusqlite::{params, Connection, Result as SqliteResult, OptionalExtension};
use crate::models::entry::{CreateEntry, Entry, UpdateEntry};

pub fn list(
    conn: &Connection,
    category_id: Option<i64>,
    search: Option<&str>,
    tag_id: Option<i64>,
) -> SqliteResult<Vec<Entry>> {
    let mut sql = String::from(
        "SELECT e.id, e.category_id, c.name as category_name, e.title, e.website, e.encrypted_data, e.is_favorite, e.created_at, e.updated_at
         FROM entries e LEFT JOIN categories c ON e.category_id = c.id"
    );
    let mut conditions: Vec<String> = Vec::new();
    let mut param_values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(tid) = tag_id {
        sql.push_str(" JOIN entry_tags et ON e.id = et.entry_id");
        conditions.push(format!("et.tag_id = ?{}", param_values.len() + 1));
        param_values.push(Box::new(tid));
    }

    if let Some(cid) = category_id {
        conditions.push(format!("e.category_id = ?{}", param_values.len() + 1));
        param_values.push(Box::new(cid));
    }

    if let Some(q) = search {
        conditions.push(format!(
            "(e.title LIKE ?{0} OR e.website LIKE ?{0})",
            param_values.len() + 1
        ));
        let pattern = format!("%{q}%");
        param_values.push(Box::new(pattern.clone()));
        param_values.push(Box::new(pattern));
    }

    if !conditions.is_empty() {
        sql.push_str(" WHERE ");
        sql.push_str(&conditions.join(" AND "));
    }

    sql.push_str(" ORDER BY e.title ASC");

    let mut stmt = conn.prepare(&sql)?;
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = param_values.iter().map(|p| p.as_ref()).collect();

    let rows = stmt.query_map(params_refs.as_slice(), |row| {
        Ok(Entry {
            id: row.get(0)?,
            category_id: row.get(1)?,
            category_name: row.get(2)?,
            title: row.get(3)?,
            website: row.get(4)?,
            username: None,
            password: None,
            notes: None,
            custom_fields: None,
            is_favorite: row.get::<_, i64>(6)? != 0,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
            tags: None,
            tag_ids: None,
        })
    })?;

    let mut entries = Vec::new();
    for row in rows {
        entries.push(row?);
    }
    Ok(entries)
}

pub fn get_by_id(conn: &Connection, id: &str) -> SqliteResult<Option<Entry>> {
    let mut stmt = conn.prepare(
        "SELECT e.id, e.category_id, c.name as category_name, e.title, e.website, e.encrypted_data, e.is_favorite, e.created_at, e.updated_at
         FROM entries e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = ?1",
    )?;

    let mut rows = stmt.query_map(params![id], |row| {
        Ok(Entry {
            id: row.get(0)?,
            category_id: row.get(1)?,
            category_name: row.get(2)?,
            title: row.get(3)?,
            website: row.get(4)?,
            username: None,
            password: None,
            notes: None,
            custom_fields: None,
            is_favorite: row.get::<_, i64>(6)? != 0,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
            tags: None,
            tag_ids: None,
        })
    })?;

    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn get_encrypted_data(conn: &Connection, id: &str) -> SqliteResult<Option<String>> {
    conn.query_row(
        "SELECT encrypted_data FROM entries WHERE id = ?1",
        params![id],
        |row| row.get(0),
    )
    .optional()
}

pub fn insert(
    conn: &Connection,
    entry: &CreateEntry,
    id: &str,
    encrypted_data: &str,
    now: &str,
) -> SqliteResult<Entry> {
    conn.execute(
        "INSERT INTO entries (id, category_id, title, website, encrypted_data, is_favorite, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, ?7)",
        params![id, entry.category_id, entry.title, entry.website, encrypted_data, now, now],
    )?;

    Ok(Entry {
        id: id.to_string(),
        category_id: entry.category_id,
        category_name: None,
        title: entry.title.clone(),
        website: entry.website.clone(),
        username: Some(entry.username.clone()),
        password: Some(entry.password.clone()),
        notes: entry.notes.clone(),
        custom_fields: entry.custom_fields.clone(),
        is_favorite: false,
        created_at: now.to_string(),
        updated_at: now.to_string(),
        tags: None,
        tag_ids: None,
    })
}

pub fn update(
    conn: &Connection,
    id: &str,
    entry: &UpdateEntry,
    encrypted_data: Option<&str>,
    now: &str,
) -> SqliteResult<()> {
    if let Some(title) = &entry.title {
        conn.execute(
            "UPDATE entries SET title = ?1, updated_at = ?2 WHERE id = ?3",
            params![title, now, id],
        )?;
    }
    if let Some(website) = &entry.website {
        conn.execute(
            "UPDATE entries SET website = ?1, updated_at = ?2 WHERE id = ?3",
            params![website, now, id],
        )?;
    }
    if let Some(cid) = entry.category_id {
        conn.execute(
            "UPDATE entries SET category_id = ?1, updated_at = ?2 WHERE id = ?3",
            params![cid, now, id],
        )?;
    }
    if let Some(data) = encrypted_data {
        conn.execute(
            "UPDATE entries SET encrypted_data = ?1, updated_at = ?2 WHERE id = ?3",
            params![data, now, id],
        )?;
    }
    Ok(())
}

pub fn delete(conn: &Connection, id: &str) -> SqliteResult<()> {
    conn.execute("DELETE FROM entries WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn toggle_favorite(conn: &Connection, id: &str) -> SqliteResult<bool> {
    conn.execute(
        "UPDATE entries SET is_favorite = CASE WHEN is_favorite = 0 THEN 1 ELSE 0 END, updated_at = datetime('now') WHERE id = ?1",
        params![id],
    )?;
    let fav: i64 = conn.query_row(
        "SELECT is_favorite FROM entries WHERE id = ?1",
        params![id],
        |row| row.get(0),
    )?;
    Ok(fav != 0)
}
