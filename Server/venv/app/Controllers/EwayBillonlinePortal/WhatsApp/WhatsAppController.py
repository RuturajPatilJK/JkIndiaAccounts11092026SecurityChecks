import requests
from flask import Flask, request, jsonify
import base64
import os
from app import db, app

API_URL = os.getenv('API_URL')
GITHUB_API_URL = os.getenv('GITHUB_API_URL')
GITHUB_USERNAME = os.getenv('GITHUB_USERNAME')
GITHUB_REPO = os.getenv('GITHUB_REPO')
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
BRANCH = os.getenv('BRANCH')

@app.route(API_URL + '/upload-to-github-onlineportal', methods=['POST'])
def upload_to_github_onlineportal():
    file = request.files.get('file') 
    if not file:
        return jsonify({"status": "error", "message": "No file provided"}), 400

    file_content = file.read()
    file_name = file.filename

    encoded_content = base64.b64encode(file_content).decode('utf-8')

    url = f"{GITHUB_API_URL}/repos/{GITHUB_USERNAME}/{GITHUB_REPO}/contents/{file_name}"

    data = {
        "message": f"Upload {file_name}",
        "content": encoded_content,
        "branch": BRANCH 
    }

    try:
        check_url = f"{GITHUB_API_URL}/repos/{GITHUB_USERNAME}/{GITHUB_REPO}/contents/{file_name}?ref={BRANCH}"
        check_response = requests.get(
            check_url,
            headers={"Authorization": f"token {GITHUB_TOKEN}"}
        )

        if check_response.status_code == 200:
            existing_file = check_response.json()
            sha = existing_file['sha']
            data["sha"] = sha
            data["message"] = f"Update {file_name}"

        response = requests.put(
            url,
            json=data,
            headers={"Authorization": f"token {GITHUB_TOKEN}"}
        )

        if response.status_code == 201 or response.status_code == 200:
            file_url = response.json().get('content', {}).get('download_url')
            return jsonify({
                "status": "success",
                "message": f"File {file_name} uploaded successfully!",
                "file_url": file_url 
            }), 201
        else:
            try:
                error_message = response.json().get('message', 'Unknown error')
            except ValueError:
                error_message = response.text

            return jsonify({"status": "error", "message": error_message}), response.status_code

    except requests.exceptions.RequestException as e:
        return jsonify({"status": "error", "message": f"An error occurred: {str(e)}"}), 500
