import sqlite3
import os
import base64
import hashlib
from typing import Optional, List
from cryptography.fernet import Fernet
from models import (
    Source,
    ConflictEvent,
    ReconciliationLogEntry,
    ConfidenceHistoryEntry,
    DecaySettings,
)

# Wrapper classes to make SQLite and PostgreSQL connections and cursors behave identically.
class DBRow:
    def __init__(self, data):
        self._data = data
        if isinstance(data, dict):
            self._is_dict = True
            self._keys = list(data.keys())
            self._values = list(data.values())
        elif hasattr(data, "keys"): # sqlite3.Row
            self._is_dict = True
            self._keys = list(data.keys())
            self._values = [data[k] for k in self._keys]
        else:
            self._is_dict = False
            self._values = list(data)

    def __getitem__(self, key):
        if isinstance(key, int):
            return self._values[key]
        elif self._is_dict:
            if key in self._keys:
                return self._data[key]
            # Try case-insensitive lookup
            for k in self._keys:
                if k.lower() == key.lower():
                    return self._data[k]
            raise KeyError(key)
        else:
            raise KeyError(key)

    def keys(self):
        if self._is_dict:
            return self._keys
        return []

def replace_placeholders(sql):
    result = []
    in_single_quote = False
    in_double_quote = False
    escape = False
    for char in sql:
        if escape:
            result.append(char)
            escape = False
            continue
        if char == '\\':
            result.append(char)
            escape = True
            continue
        if char == "'" and not in_double_quote:
            in_single_quote = not in_single_quote
            result.append(char)
        elif char == '"' and not in_single_quote:
            in_double_quote = not in_double_quote
            result.append(char)
        elif char == '?' and not in_single_quote and not in_double_quote:
            result.append('%s')
        else:
            result.append(char)
    return "".join(result)

class DBCursorWrapper:
    def __init__(self, cursor, is_postgres):
        self.cursor = cursor
        self.is_postgres = is_postgres

    def execute(self, sql, parameters=None):
        if self.is_postgres:
            # Replace SQLite placeholders ? with %s safely
            sql = replace_placeholders(sql)
        if parameters is not None:
            self.cursor.execute(sql, parameters)
        else:
            self.cursor.execute(sql)
        return self

    def fetchone(self):
        row = self.cursor.fetchone()
        if row is None:
            return None
        return DBRow(row)

    def fetchall(self):
        rows = self.cursor.fetchall()
        return [DBRow(r) for r in rows]

class DBConnectionWrapper:
    def __init__(self, conn, is_postgres):
        self.conn = conn
        self.is_postgres = is_postgres

    def cursor(self):
        if self.is_postgres:
            from psycopg2.extras import RealDictCursor
            return DBCursorWrapper(self.conn.cursor(cursor_factory=RealDictCursor), is_postgres=True)
        else:
            return DBCursorWrapper(self.conn.cursor(), is_postgres=False)

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()

DB_PATH = os.path.join(os.path.dirname(__file__), "synapse_meta.db")

def get_db_connection():
    postgres_url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")
    is_vercel = os.environ.get("VERCEL") == "1"
    
    if is_vercel and not postgres_url:
        raise RuntimeError(
            "DATABASE_URL or POSTGRES_URL environment variable is missing, "
            "but the application is running in a Vercel serverless environment. "
            "PostgreSQL is required in production."
        )
        
    if postgres_url:
        import psycopg2
        conn = psycopg2.connect(postgres_url)
        return DBConnectionWrapper(conn, is_postgres=True)
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return DBConnectionWrapper(conn, is_postgres=False)


def db_init():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Sources table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        url TEXT,
        file_path TEXT,
        content TEXT DEFAULT '',
        ingested_at TEXT NOT NULL,
        last_synced_at TEXT,
        status TEXT NOT NULL
    )
    """)
    # Ensure content column exists on previously-created tables
    try:
        cursor.execute("ALTER TABLE sources ADD COLUMN content TEXT DEFAULT ''")
    except Exception:
        pass
    
    # 2. Conflicts table (reconciliation_log/Inbox queue)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conflicts (
        id TEXT PRIMARY KEY,
        old_node_summary TEXT NOT NULL,
        old_node_date TEXT NOT NULL,
        old_node_source TEXT NOT NULL,
        new_node_summary TEXT NOT NULL,
        new_node_date TEXT NOT NULL,
        new_node_source TEXT NOT NULL,
        topic TEXT NOT NULL,
        relationship TEXT NOT NULL,
        llm_confidence REAL NOT NULL,
        status TEXT NOT NULL,
        resolution_note TEXT,
        created_at TEXT NOT NULL
    )
    """)
    
    # 3. Typed reconciliation log (audit trail/history of changes)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reconciliation_log (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        topic TEXT NOT NULL,
        old_summary TEXT,
        new_summary TEXT,
        source TEXT,
        created_at TEXT NOT NULL
    )
    """)
    
    # 4. Confidence history tracking
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS confidence_history (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        value_summary TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        reason TEXT NOT NULL,
        date TEXT NOT NULL
    )
    """)
    
    # Indexes for commonly queried columns
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sources_label ON sources(label)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sources_status ON sources(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_conflicts_topic ON conflicts(topic)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_conflicts_status ON conflicts(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_conflicts_old_source ON conflicts(old_node_source)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_conflicts_new_source ON conflicts(new_node_source)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reconciliation_log_topic ON reconciliation_log(topic)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_confidence_history_topic ON confidence_history(topic)")

    # 5. Decay settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS decay_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        decay_start_days INTEGER NOT NULL,
        forget_threshold_days INTEGER NOT NULL
    )
    """)
    
    # 6. User AI Config table (BYOK)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_ai_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        provider TEXT NOT NULL,
        api_key_encrypted TEXT NOT NULL,
        model TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)
    
    # Insert default decay settings if not present
    cursor.execute("SELECT COUNT(*) FROM decay_settings")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO decay_settings (id, decay_start_days, forget_threshold_days) VALUES (1, 60, 180)")
        
    # db_metadata for internal app tracking
    cursor.execute("CREATE TABLE IF NOT EXISTS db_metadata (key TEXT PRIMARY KEY, value TEXT)")

    # Clean up any demo seed data from previous runs
    cursor.execute("DELETE FROM db_metadata WHERE key='seeded'")
    cursor.execute("DELETE FROM sources WHERE id IN ('1', '2', '3')")
    cursor.execute("DELETE FROM conflicts WHERE id IN ('1', '2', '3')")
    cursor.execute("DELETE FROM reconciliation_log WHERE id IN ('log1', 'log2', 'log3', 'log4', 'log5', 'log6', 'log7')")
    cursor.execute("DELETE FROM confidence_history WHERE id IN ('ch1', 'ch2', 'ch3', 'ch4')")

    conn.commit()
    conn.close()

# Encryption helpers for BYOK
def get_encryption_key() -> bytes:
    key_str = os.environ.get("SYNAPSE_ENCRYPTION_KEY")
    if not key_str:
        access_key = os.environ.get("SYNAPSE_ACCESS_KEY", "default-fallback-encryption-key-12345")
        hasher = hashlib.sha256(access_key.encode())
        return base64.urlsafe_b64encode(hasher.digest())
    try:
        return key_str.encode()
    except Exception:
        hasher = hashlib.sha256(key_str.encode())
        return base64.urlsafe_b64encode(hasher.digest())

def encrypt_key(plain_key: str) -> str:
    f = Fernet(get_encryption_key())
    return f.encrypt(plain_key.encode()).decode()

def decrypt_key(encrypted_key: str) -> str:
    f = Fernet(get_encryption_key())
    return f.decrypt(encrypted_key.encode()).decode()

# User AI Config operations
def db_save_user_ai_config(provider: str, api_key: str, model: str):
    encrypted = encrypt_key(api_key)
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO user_ai_config (id, provider, api_key_encrypted, model, updated_at)
    VALUES (1, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        provider = excluded.provider,
        api_key_encrypted = excluded.api_key_encrypted,
        model = excluded.model,
        updated_at = excluded.updated_at
    """, (provider, encrypted, model, now))
    conn.commit()
    conn.close()

def db_get_user_ai_config() -> Optional[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT provider, api_key_encrypted, model FROM user_ai_config WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    try:
        decrypted = decrypt_key(row["api_key_encrypted"])
    except Exception:
        decrypted = ""
    return {
        "provider": row["provider"],
        "api_key": decrypted,
        "model": row["model"]
    }

def db_delete_user_ai_config():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_ai_config WHERE id = 1")
    conn.commit()
    conn.close()

# Sources CRUD
def db_save_source(s: Source):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO sources (id, type, label, url, file_path, ingested_at, last_synced_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        last_synced_at=excluded.last_synced_at,
        file_path=excluded.file_path
    """, (s.id, s.type, s.label, s.url, s.filePath, s.ingestedAt, s.lastSyncedAt, s.status))
    conn.commit()
    conn.close()

def db_get_sources() -> List[Source]:
    conn = get_db_connection()
    cursor = conn.cursor()

    # Auto-fix: sources stuck in "processing" for > 120 seconds → "ready"
    try:
        from datetime import datetime, timezone, timedelta
        cutoff = (datetime.now(timezone.utc) - timedelta(seconds=120)).isoformat()
        cursor.execute("UPDATE sources SET status='ready' WHERE status='processing' AND ingested_at < ?", (cutoff,))
    except Exception:
        pass

    cursor.execute("SELECT * FROM sources ORDER BY ingested_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        Source(
            id=r["id"],
            type=r["type"],
            label=r["label"],
            url=r["url"],
            filePath=r["file_path"],
            ingestedAt=r["ingested_at"],
            lastSyncedAt=r["last_synced_at"],
            status=r["status"]
        )
        for r in rows
    ]

def db_update_source_content(source_id: str, content: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE sources SET content = ? WHERE id = ?", (content, source_id))
    conn.commit()
    conn.close()

def db_get_source_content(source_label: str) -> Optional[str]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT content FROM sources WHERE label = ?", (source_label,))
    row = cursor.fetchone()
    conn.close()
    return row["content"] if row else None

def db_delete_source(source_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Get the source label first
    cursor.execute("SELECT label FROM sources WHERE id=?", (source_id,))
    row = cursor.fetchone()
    if row:
        label = row["label"]
        
        # 2. Find conflicts linked to this source to get their topics
        cursor.execute("SELECT DISTINCT topic FROM conflicts WHERE old_node_source=? OR new_node_source=?", (label, label))
        topics = [r["topic"] for r in cursor.fetchall()]
        
        # 3. Delete conflicts
        cursor.execute("DELETE FROM conflicts WHERE old_node_source=? OR new_node_source=?", (label, label))
        
        # 4. Delete reconciliation_log entries
        cursor.execute("DELETE FROM reconciliation_log WHERE source=?", (label,))
        
        # 5. Delete confidence_history for these topics
        if topics:
            placeholders = ",".join("?" for _ in topics)
            cursor.execute(f"DELETE FROM confidence_history WHERE topic IN ({placeholders})", topics)
            
    # 6. Delete the source itself
    cursor.execute("DELETE FROM sources WHERE id=?", (source_id,))
    
    # If no sources left, completely clear conflicts, log, and history tables
    cursor.execute("SELECT COUNT(*) FROM sources")
    if cursor.fetchone()[0] == 0:
        cursor.execute("DELETE FROM conflicts")
        cursor.execute("DELETE FROM reconciliation_log")
        cursor.execute("DELETE FROM confidence_history")
        cursor.execute("DELETE FROM db_metadata WHERE key='seeded'")
        
    conn.commit()
    conn.close()

# Conflicts CRUD
def db_save_conflict(c: ConflictEvent):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO conflicts (
        id, old_node_summary, old_node_date, old_node_source,
        new_node_summary, new_node_date, new_node_source,
        topic, relationship, llm_confidence, status, resolution_note, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        resolution_note=excluded.resolution_note
    """, (
        c.id, c.oldNodeSummary, c.oldNodeDate, c.oldNodeSource,
        c.newNodeSummary, c.newNodeDate, c.newNodeSource,
        c.topic, c.relationship, c.llmConfidence, c.status, c.resolutionNote, c.createdAt
    ))
    conn.commit()
    conn.close()

def db_get_conflicts(include_resolved: bool = True) -> List[ConflictEvent]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if include_resolved:
        cursor.execute("SELECT * FROM conflicts ORDER BY created_at DESC")
    else:
        cursor.execute("SELECT * FROM conflicts WHERE status='pending' ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        ConflictEvent(
            id=r["id"],
            oldNodeSummary=r["old_node_summary"],
            oldNodeDate=r["old_node_date"],
            oldNodeSource=r["old_node_source"],
            newNodeSummary=r["new_node_summary"],
            newNodeDate=r["new_node_date"],
            newNodeSource=r["new_node_source"],
            topic=r["topic"],
            relationship=r["relationship"],
            llmConfidence=r["llm_confidence"],
            status=r["status"],
            resolutionNote=r["resolution_note"],
            createdAt=r["created_at"]
        )
        for r in rows
    ]

# Reconciliation Log CRUD
def db_save_reconciliation_log_entry(e: ReconciliationLogEntry):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO reconciliation_log (id, event_type, topic, old_summary, new_summary, source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (e.id, e.eventType, e.topic, e.oldSummary, e.newSummary, e.source, e.createdAt))
    conn.commit()
    conn.close()

def db_get_reconciliation_log(topic: Optional[str] = None) -> List[ReconciliationLogEntry]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if topic:
        cursor.execute("SELECT * FROM reconciliation_log WHERE topic=? ORDER BY created_at DESC", (topic,))
    else:
        cursor.execute("SELECT * FROM reconciliation_log ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        ReconciliationLogEntry(
            id=r["id"],
            eventType=r["event_type"],
            topic=r["topic"],
            oldSummary=r["old_summary"],
            newSummary=r["new_summary"],
            source=r["source"],
            createdAt=r["created_at"]
        )
        for r in rows
    ]

# Confidence History CRUD
def db_save_confidence_history_entry(e: ConfidenceHistoryEntry):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO confidence_history (id, topic, value_summary, confidence_score, reason, date)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (e.id, e.topic, e.valueSummary, e.confidenceScore, e.reason, e.date))
    conn.commit()
    conn.close()

def db_get_confidence_history(topic: Optional[str] = None) -> List[ConfidenceHistoryEntry]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if topic:
        cursor.execute("SELECT * FROM confidence_history WHERE topic=? ORDER BY date ASC", (topic,))
    else:
        cursor.execute("SELECT * FROM confidence_history ORDER BY date ASC")
    rows = cursor.fetchall()
    conn.close()
    return [
        ConfidenceHistoryEntry(
            id=r["id"],
            topic=r["topic"],
            valueSummary=r["value_summary"],
            confidenceScore=r["confidence_score"],
            reason=r["reason"],
            date=r["date"]
        )
        for r in rows
    ]

def db_get_distinct_topics() -> List[str]:
    """Get all distinct topics tracked anywhere in Synapse metadata."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT topic FROM confidence_history
    UNION
    SELECT topic FROM reconciliation_log
    UNION
    SELECT topic FROM conflicts
    ORDER BY topic
    """)
    rows = cursor.fetchall()
    conn.close()
    return [r["topic"] for r in rows]

def db_get_timeline_topics() -> List[str]:
    """Get topics that have actual confidence timeline data."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT topic FROM confidence_history ORDER BY topic")
    rows = cursor.fetchall()
    conn.close()
    return [r["topic"] for r in rows]

# Decay Settings CRUD
def db_get_decay_settings() -> DecaySettings:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT decay_start_days, forget_threshold_days FROM decay_settings WHERE id=1")
    row = cursor.fetchone()
    conn.close()
    return DecaySettings(
        decayStartDays=row["decay_start_days"],
        forgetThresholdDays=row["forget_threshold_days"]
    )

def db_update_decay_settings(s: DecaySettings):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE decay_settings
    SET decay_start_days=?, forget_threshold_days=?
    WHERE id=1
    """, (s.decayStartDays, s.forgetThresholdDays))
    conn.commit()
    conn.close()

def db_reseed():
    """Unconditionally clear database tables and re-run seed scripts."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM db_metadata WHERE key='seeded'")
    cursor.execute("DELETE FROM sources")
    cursor.execute("DELETE FROM conflicts")
    cursor.execute("DELETE FROM reconciliation_log")
    cursor.execute("DELETE FROM confidence_history")
    conn.commit()
    conn.close()
    db_init()
