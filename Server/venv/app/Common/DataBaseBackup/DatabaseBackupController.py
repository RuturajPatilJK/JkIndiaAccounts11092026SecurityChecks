import os
import subprocess
from datetime import datetime
from flask import Flask, jsonify
from app import app, db

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
BACKUP_DIR = os.getenv("DATBASE_BACKUPPATH")
API_URL = os.getenv('API_URL')

@app.route(API_URL + '/backup', methods=['POST'])
def backup():
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = f"AccountSoftware-{timestamp}.bak"
        backup_path = os.path.join(BACKUP_DIR, backup_file)

        sqlcmd_command = [
            "sqlcmd",
            "-S", DB_HOST,
            "-U", DB_USER,
            "-P", DB_PASSWORD,
            "-Q", f"BACKUP DATABASE [{DB_NAME}] TO DISK = N'{backup_path}'"
        ]

        result = subprocess.run(sqlcmd_command, capture_output=True, text=True)

        if result.returncode == 0:
            return jsonify({
                "success": True,
                "message": "Database backup successful",
                "backupFileName": backup_path.replace("\\", "/") 
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Database backup failed",
                "error": result.stderr.strip() 
            }), 500

    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Database backup failed",
            "error": str(e)
        }), 500
