use rusqlite::{params, Connection, Result as SqliteResult};
use crate::models::category::Category;

pub fn list_all(conn: &Connection) -> SqliteResult<Vec<Category>> {
    let mut stmt = conn.prepare(
        "SELECT c.id, c.name, c.icon, c.sort_order, COUNT(e.id) as entry_count
         FROM categories c
         LEFT JOIN entries e ON c.id = e.category_id
         GROUP BY c.id
         ORDER BY c.sort_order ASC, c.name ASC",
    )?;

    let rows = stmt.query_map([], |row| {
        Ok(Category {
            id: row.get(0)?,
            name: row.get(1)?,
            icon: row.get(2)?,
            sort_order: row.get(3)?,
            entry_count: row.get(4)?,
        })
    })?;

    let mut categories = Vec::new();
    for row in rows {
        categories.push(row?);
    }
    Ok(categories)
}

pub fn create(conn: &Connection, name: &str, icon: Option<&str>) -> SqliteResult<Category> {
    conn.execute(
        "INSERT INTO categories (name, icon) VALUES (?1, ?2)",
        params![name, icon],
    )?;
    let id = conn.last_insert_rowid();
    Ok(Category {
        id,
        name: name.to_string(),
        icon: icon.map(|s| s.to_string()),
        sort_order: 0,
        entry_count: 0,
    })
}

pub fn delete(conn: &Connection, id: i64) -> SqliteResult<()> {
    conn.execute("DELETE FROM categories WHERE id = ?1", params![id])?;
    Ok(())
}
