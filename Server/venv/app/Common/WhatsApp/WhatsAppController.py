



import os
import re
import json
import uuid
import requests
from flask import request, jsonify, make_response, send_from_directory
from app import app, FRONTEND_ORIGINS

# ─── Config ───────────────────────────────────────────────────────────────────
API_URL        = os.getenv("API_URL", "/api/sugarian")
API_URL_SERVER = os.getenv("API_URL_SERVER")
D360_API_KEY   = os.getenv("D360_API_KEY")
D360_BASE_URL  = "https://waba-v2.360dialog.io"
D360_API_URL   = os.getenv("D360_API_URL")


def _whatsapp_media_dir():
    base = os.getenv('UPLOAD_FOLDER', 'Uploads')
    path = os.path.join(base, 'whatsappmedia')
    os.makedirs(path, exist_ok=True)
    return path

# ─── CORS helper ──────────────────────────────────────────────────────────────
# This route builds its own response (not going through flask-cors), so it
# needs its own CORS headers. Reuses the same FRONTEND_ORIGINS allowlist the
# rest of the app already uses (app/__init__.py), instead of the separate,
# never-configured ALLOWED_ORIGIN env var that defaulted to '*' - a wildcard
# origin is rejected by browsers for credentialed (cookie) requests.
def _corsify(resp):
    origin = request.headers.get("Origin")
    if origin in FRONTEND_ORIGINS:
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Access-Control-Allow-Credentials"] = "true"
    resp.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-CSRF-TOKEN"
    resp.headers["Access-Control-Max-Age"]        = "86400"
    return resp



@app.route(API_URL + "/upload-to-whatsapp-media", methods=["OPTIONS", "POST"])
def upload_to_whatsapp_media():
    if request.method == "OPTIONS":
        return _corsify(make_response("", 200))

    file = request.files.get("file")
    if not file:
        return _corsify(make_response(jsonify(error="No file provided"), 400))

    filename = file.filename or "document.pdf"
    if not filename.lower().endswith(".pdf"):
        filename += ".pdf"

    # This proxy has no true "upload for a reusable media_id" endpoint - it
    # only accepts a full send-message request, which in turn wants a
    # document.link (a publicly fetchable URL), not raw/base64 file bytes.
    # So instead of uploading to the proxy here, save the PDF to our own
    # public storage and hand back a URL this server can serve to Meta's
    # fetchers - /send-whatsapp then references that link directly.
    stored_name = f"{uuid.uuid4().hex}.pdf"
    with open(os.path.join(_whatsapp_media_dir(), stored_name), "wb") as f:
        f.write(file.read())

    public_url = f"{API_URL_SERVER}/whatsapp-media/{stored_name}"
    app.logger.info(f"Saved '{filename}' for WhatsApp send at {public_url}")

    return _corsify(make_response(jsonify(url=public_url, filename=filename), 200))


@app.route(API_URL + "/whatsapp-media/<path:stored_name>", methods=["GET"])
def serve_whatsapp_media(stored_name):
    # Public by design (see PUBLIC_ENDPOINTS in app/__init__.py) - Meta's
    # servers fetch this directly, with no session of their own to present.
    return send_from_directory(os.path.abspath(_whatsapp_media_dir()), stored_name)



@app.route(API_URL + "/send-whatsapp", methods=["OPTIONS", "POST"])
def send_whatsapp():
    if request.method == "OPTIONS":
        return _corsify(make_response("", 200))

    try:
        payload = request.get_json(force=True)
    except Exception:
        return _corsify(make_response(jsonify(error="Invalid JSON body"), 400))

    # Basic field validation
    missing = [f for f in ("messaging_product", "to", "type", "template") if f not in payload]
    if missing:
        return _corsify(make_response(jsonify(error=f"Missing fields: {missing}"), 400))

    app.logger.info(f"Sending WhatsApp to {payload.get('to')} — template: {payload.get('template', {}).get('name')}")

    try:
        resp = requests.post(
            D360_API_URL,
            headers={
                "API-KEY":       f"Bearer {D360_API_KEY}",
                "MM_lite":       "yes",
                "Content-Type":  "application/json",
            },
            data=json.dumps(payload),
            timeout=20,
        )
    except requests.RequestException as exc:
        app.logger.error(f"WhatsApp send network error: {exc}")
        return _corsify(make_response(jsonify(error=f"Network error: {exc}"), 502))

    app.logger.info(f"WhatsApp send → {resp.status_code}: {resp.text}")

    try:
        body = resp.json()
    except ValueError:
        body = {"raw": resp.text}

    return _corsify(make_response(jsonify(body), resp.status_code))



# import requests
# from flask import Flask, request, jsonify
# import base64
# import os
# from app import db, app

# API_URL = os.getenv('API_URL')
# GITHUB_API_URL = os.getenv('GITHUB_API_URL')
# GITHUB_USERNAME = os.getenv('GITHUB_USERNAME')
# GITHUB_REPO = os.getenv('GITHUB_REPO')
# GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
# BRANCH = os.getenv('BRANCH')

# @app.route(API_URL + '/upload-to-github', methods=['POST'])
# def upload_to_github():
#     file = request.files.get('file') 
#     if not file:
#         return jsonify({"status": "error", "message": "No file provided"}), 400

#     file_content = file.read()
#     file_name = file.filename

#     encoded_content = base64.b64encode(file_content).decode('utf-8')

#     url = f"{GITHUB_API_URL}/repos/{GITHUB_USERNAME}/{GITHUB_REPO}/contents/{file_name}"

#     data = {
#         "message": f"Upload {file_name}",
#         "content": encoded_content,
#         "branch": BRANCH 
#     }

#     try:
#         check_url = f"{GITHUB_API_URL}/repos/{GITHUB_USERNAME}/{GITHUB_REPO}/contents/{file_name}?ref={BRANCH}"
#         check_response = requests.get(
#             check_url,
#             headers={"Authorization": f"token {GITHUB_TOKEN}"}
#         )

#         if check_response.status_code == 200:
#             existing_file = check_response.json()
#             sha = existing_file['sha']
#             data["sha"] = sha
#             data["message"] = f"Update {file_name}"

#         response = requests.put(
#             url,
#             json=data,
#             headers={"Authorization": f"token {GITHUB_TOKEN}"}
#         )

#         if response.status_code == 201 or response.status_code == 200:
#             file_url = response.json().get('content', {}).get('download_url')
#             return jsonify({
#                 "status": "success",
#                 "message": f"File {file_name} uploaded successfully!",
#                 "file_url": file_url 
#             }), 201
#         else:
#             try:
#                 error_message = response.json().get('message', 'Unknown error')
#             except ValueError:
#                 error_message = response.text

#             return jsonify({"status": "error", "message": error_message}), response.status_code

#     except requests.exceptions.RequestException as e:
#         return jsonify({"status": "error", "message": f"An error occurred: {str(e)}"}), 500


# import os
# import re
# import io
# import json
# import base64
# import mimetypes
# import requests
# from flask import request, jsonify, make_response
# from google.oauth2.service_account import Credentials
# from googleapiclient.discovery import build
# from googleapiclient.http import MediaIoBaseUpload
# from app import app
# import pathlib





# API_URL = os.getenv('API_URL', '/api/sugarian')
# D360_API_KEY = os.getenv("D360_API_KEY", "K4NcuShiz7MLAj3aWOxGgREfAK")
# D360_URL = "https://waba-v2.360dialog.io/messages"
# ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "*")
# GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# # --- CORS helper ---
# def _corsify(resp):
#     resp.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN
#     resp.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
#     resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
#     resp.headers["Access-Control-Max-Age"] = "86400"
#     return resp

# # --- Send WhatsApp ---
# @app.route(API_URL + "/send-whatsapp", methods=["OPTIONS", "POST"])
# def send_whatsapp():
#     if request.method == "OPTIONS":
#         return _corsify(make_response("", 200))

#     try:
#         payload = request.get_json(force=True)
#         for field in ("type", "messaging_product", "to", "template"):
#             if field not in payload:
#                 return _corsify(make_response(jsonify(error=f"Missing field: {field}"), 400))
#     except Exception:
#         return _corsify(make_response(jsonify(error="Invalid JSON body"), 400))

#     try:
#         r = requests.post(
#             D360_URL,
#             headers={
#                 "D360-API-KEY": D360_API_KEY,
#                 "Content-Type": "application/json",
#             },
#             data=json.dumps(payload),
#             timeout=20,
#         )
#         body = r.json()
#     except requests.RequestException as e:
#         return _corsify(make_response(jsonify(error=f"Upstream error: {e}"), 502))
#     except ValueError:
#         body = {"raw": r.text}

#     return _corsify(make_response(jsonify(body), r.status_code))

# # --- Google Drive helpers ---
# def sanitize_name(name: str) -> str:
#     return re.sub(r'[^\w\-.]', '_', name or 'unnamed')

# def _load_service_account_credentials():
#     scopes = ["https://www.googleapis.com/auth/drive"]
#     token_uri = os.getenv("GOOGLE_TOKEN_URI", "https://www.googleapis.com/oauth2/v4/token")
#     sa_json_env = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")

#     if sa_json_env:
#         try:
#             sa_info = json.loads(base64.b64decode(sa_json_env).decode("utf-8"))
#         except Exception:
#             sa_info = json.loads(sa_json_env)
#         sa_info["token_uri"] = token_uri
#         return Credentials.from_service_account_info(sa_info, scopes=scopes)
    
#     BASE_DIR = os.path.dirname(os.path.abspath(__file__))
#     key_path = str(pathlib.Path(__file__).parent.joinpath('event-2025-472511-3a936b423317.json'))
#     # key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
#     if not key_path or not os.path.exists(key_path):
#         raise RuntimeError("Missing service account credentials.")
#     with open(key_path, "r", encoding="utf-8") as f:
#         sa_info = json.load(f)
#     sa_info["token_uri"] = token_uri
#     return Credentials.from_service_account_info(sa_info, scopes=scopes)

# def get_drive_service():
#     creds = _load_service_account_credentials()
#     return build("drive", "v3", credentials=creds, cache_discovery=False)

# def get_or_create_folder(drive, drive_id: str):
#     folder_id = os.getenv("DRIVE_PARENT_FOLDER_ID")
#     if folder_id:
#         return folder_id

#     folder_name = os.getenv("DRIVE_FOLDER_NAME")
#     if not folder_name:
#         return None

#     escaped_name = folder_name.replace("'", "\\'")
#     query = f"mimeType='application/vnd.google-apps.folder' and name='{escaped_name}' and trashed=false"

#     res = drive.files().list(
#         q=query,
#         corpora="drive",
#         driveId=drive_id,
#         includeItemsFromAllDrives=True,
#         supportsAllDrives=True,
#         fields="files(id, name)",
#         spaces="drive",
#         pageSize=1
#     ).execute()
#     files = res.get("files", [])
#     if files:
#         return files[0]["id"]

#     created = drive.files().create(
#         body={
#             "name": folder_name,
#             "mimeType": "application/vnd.google-apps.folder",
#             "driveId": drive_id
#         },
#         supportsAllDrives=True,
#         fields="id"
#     ).execute()
#     return created["id"]

# def make_anyone_reader(drive, file_id: str):
#     try:
#         drive.permissions().create(
#             fileId=file_id,
#             supportsAllDrives=True,
#             body={"type": "anyone", "role": "reader"}
#         ).execute()
#     except Exception as e:
#         app.logger.warning(f"Could not set permission for file {file_id}: {e}")

# # --- Upload to Drive ---
# # @app.route(API_URL + '/upload-to-drive', methods=['POST'])
# # def upload_to_drive():
# #     file = request.files.get('file')
# #     if not file:
# #         return jsonify({"status": "error", "message": "No file provided"}), 400

# #     original_name = file.filename or "unnamed"
# #     safe_name = sanitize_name(original_name)
# #     drive_id = os.getenv("SHARED_DRIVE_ID")
# #     if not drive_id:
# #         return jsonify({"status": "error", "message": "Missing SHARED_DRIVE_ID env var"}), 500

# #     try:
# #         drive = get_drive_service()
# #         parent_folder_id = get_or_create_folder(drive, drive_id)
# #     except Exception as e:
# #         return jsonify({"status": "error", "message": f"Auth or folder error: {e}"}), 500

# #     mime_type, _ = mimetypes.guess_type(safe_name)
# #     mime_type = mime_type or "application/pdf"
# #     file_bytes = file.read()

# #     metadata = {"name": safe_name, "driveId": drive_id}
# #     if parent_folder_id:
# #         metadata["parents"] = [parent_folder_id]

# #     media = MediaIoBaseUpload(io.BytesIO(file_bytes), mimetype=mime_type, resumable=False)

# #     try:
# #         created = drive.files().create(
# #             body=metadata,
# #             media_body=media,
# #             supportsAllDrives=True,
# #             fields="id, name, webContentLink"
# #         ).execute()

# #         file_id = created.get("id")
# #         file_url = created.get("webContentLink")
# #         make_anyone_reader(drive, file_id)

# #         return jsonify({
# #             "status": "success",
# #             "message": f"File uploaded: {safe_name}",
# #             "file_url": file_url
# #         }), 201

# #     except Exception as e:
# #         app.logger.error(f"Drive upload failed: {e}")
# #         return jsonify({"status": "error", "message": f"Upload failed: {e}"}), 500


# @app.route(API_URL + '/upload-to-drive', methods=['POST'])
# def upload_to_drive():
#     file = request.files.get('file')
#     if not file:
#         return jsonify({"status": "error", "message": "No file provided"}), 400

#     original_name = file.filename or "unnamed.pdf"
#     if not original_name.lower().endswith(".pdf"):
#         original_name += ".pdf"
#     safe_name = sanitize_name(original_name)

#     drive_id = os.getenv("SHARED_DRIVE_ID")
#     if not drive_id:
#         return jsonify({"status": "error", "message": "Missing SHARED_DRIVE_ID env var"}), 500

#     try:
#         drive = get_drive_service()
#         parent_folder_id = get_or_create_folder(drive, drive_id)
#     except Exception as e:
#         return jsonify({"status": "error", "message": f"Auth or folder error: {e}"}), 500

#     mime_type = "application/pdf"
#     file_bytes = file.read()

#     metadata = {"name": safe_name, "driveId": drive_id}
#     if parent_folder_id:
#         metadata["parents"] = [parent_folder_id]

#     media = MediaIoBaseUpload(io.BytesIO(file_bytes), mimetype=mime_type, resumable=False)

#     try:
#         created = drive.files().create(
#             body=metadata,
#             media_body=media,
#             supportsAllDrives=True,
#             fields="id, name"
#         ).execute()

#         file_id = created.get("id")
#         file_name = created.get("name")

#         # Try to make it public; if Shared Drive policy blocks it, just warn
#         try:
#             make_anyone_reader(drive, file_id)
#         except Exception as perm_err:
#             app.logger.warning(f"Public share failed (may be restricted by drive policy): {perm_err}")

#         # Build the public API media URL (no login) – requires that sharing is Anyone with link
#         if not GOOGLE_API_KEY:
#             app.logger.warning("GOOGLE_API_KEY not set; cannot build api_media_url.")
#             api_media_url = None
#         else:
#             api_media_url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media&key={GOOGLE_API_KEY}"

#         return jsonify({
#             "status": "success",
#             "message": f"File uploaded: {file_name}",
#             "file_id": file_id,
#             "file_name": file_name,
#             "api_media_url": api_media_url  # <-- Use this for WhatsApp
#         }), 201

#     except Exception as e:
#         app.logger.error(f"Drive upload failed: {e}")