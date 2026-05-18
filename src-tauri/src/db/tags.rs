use rusqlite::{params, Connection, Result as SqliteResult};
use crate::models::tag::Tag;

pub fn list_all(conn: &Connection) -> SqliteResult<Vec<Tag>> {
    let mut stmt = conn.prepare(
        "SELECT t.id, t.name, COUNT(et.entry_id) as entry_count
         FROM tags t
         LEFT JOIN entry_tags et ON t.id = et.tag_id
         GROUP BY t.id
         ORDER BY t.name ASC",
    )?;

    let rows = stmt.query_map([], |row| {
        Ok(Tag {
            id: row.get(0)?,
            name: row.get(1)?,
            entry_count: row.get(2)?,
        })
    })?;

    let mut tags = Vec::new();
    for row in rows {
        tags.push(row?);
    }
    Ok(tags)
}

pub fn create(conn: &Connection, name: &str) -> SqliteResult<Tag> {
    conn.execute("INSERT INTO tags (name) VALUES (?1)", params![name])?;
    let id = conn.last_insert_rowid();
    Ok(Tag {
        id,
        name: name.to_string(),
        entry_count: 0,
    })
}

pub fn delete(conn: &Connection, id: i64) -> SqliteResult<()> {
    conn.execute("DELETE FROM tags WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn set_entry_tags(conn: &Connection, entry_id: &str, tag_ids: &[i64]) -> SqliteResult<()> {
    conn.execute("DELETE FROM entry_tags WHERE entry_id = ?1", params![entry_id])?;

    let mut stmt = conn.prepare("INSERT INTO entry_tags (entry_id, tag_id) VALUES (?1, ?2)")?;
    for tag_id in tag_ids {
        stmt.execute(params![entry_id, tag_id])?;
    }
    Ok(())
}

pub fn get_tag_ids_for_entry(conn: &Connection, entry_id: &str) -> SqliteResult<Vec<i64>> {
    let mut stmt = conn.prepare(
        "SELECT tag_id FROM entry_tags WHERE entry_id = ?1",
    )?;
    let rows = stmt.query_map(params![entry_id], |row| row.get(0))?;
    let mut ids = Vec::new();
    for row in rows { ids.push(row?); }
    Ok(ids)
}

pub fn get_tags_for_entry(conn: &Connection, entry_id: &str) -> SqliteResult<Vec<String>> {
    let mut stmt = conn.prepare(
        "SELECT t.name FROM tags t
         JOIN entry_tags et ON t.id = et.tag_id
         WHERE et.entry_id = ?1
         ORDER BY t.name",
    )?;

    let rows = stmt.query_map(params![entry_id], |row| row.get(0))?;
    let mut tags = Vec::new();
    for row in rows {
        tags.push(row?);
    }
    Ok(tags)
}
