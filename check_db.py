import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "backend", "synapse_meta.db")

def check():
    if not os.path.exists(DB_PATH):
        print(f"Database file not found at {DB_PATH}")
        return
        
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('select * from sources')
    print('SOURCES:', len(c.fetchall()))
    
    c.execute('select * from conflicts')
    print('CONFLICTS:', len(c.fetchall()))
    
    c.execute('select * from reconciliation_log')
    print('LOGS:', len(c.fetchall()))
    
    conn.close()

if __name__ == "__main__":
    check()
