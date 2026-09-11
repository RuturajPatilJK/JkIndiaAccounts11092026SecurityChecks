import os
import requests
from flask import jsonify, request
from app import app

API_URL = os.getenv('API_URL')

WHITEBOOKS_API_URL = os.getenv('WHITEBOOKS_API_URL')
MASTERGST_API_URL = os.getenv('MASTERGST_API_URL')
WHITEBOOKS_CLIENT_ID = os.getenv('WHITEBOOKS_CLIENT_ID')
WHITEBOOKS_CLIENT_SECRET = os.getenv('WHITEBOOKS_CLIENT_SECRET')
WHITEBOOKS_GSTIN = os.getenv('WHITEBOOKS_GSTIN')
WHITEBOOKS_EMAIL = os.getenv('WHITEBOOKS_EMAIL')
WHITEBOOKS_USERNAME = os.getenv('WHITEBOOKS_USERNAME')
WHITEBOOKS_PASSWORD = os.getenv('WHITEBOOKS_PASSWORD')

# The GSP only requires this header to be present and non-empty - the actual
# value isn't otherwise validated (confirmed against this exact account).
_IP_ADDRESS_HEADER_VALUE = "172.0.0.1"


def _base_headers():
    return {
        'ip_address': _IP_ADDRESS_HEADER_VALUE,
        'client_id': WHITEBOOKS_CLIENT_ID,
        'client_secret': WHITEBOOKS_CLIENT_SECRET,
        'gstin': WHITEBOOKS_GSTIN,
    }


def _forward(response):
    """Mirrors whatever Whitebooks returned - status code included - back to
    the frontend, same as calling Whitebooks directly used to look like."""
    try:
        body = response.json()
    except ValueError:
        body = {'error': 'Non-JSON response from Whitebooks', 'raw': response.text}
    return jsonify(body), response.status_code


@app.route(API_URL + '/whitebooks-authenticate', methods=['GET', 'POST'])
def whitebooks_authenticate():
    try:
        resp = requests.get(
            f'{WHITEBOOKS_API_URL}/authenticate',
            params={
                'email': WHITEBOOKS_EMAIL,
                'username': WHITEBOOKS_USERNAME,
                'password': WHITEBOOKS_PASSWORD,
            },
            headers=_base_headers(),
            timeout=20,
        )
        return _forward(resp)
    except requests.RequestException as e:
        return jsonify({'error': 'Whitebooks authenticate call failed', 'message': str(e)}), 502


@app.route(API_URL + '/whitebooks-get-ewaybill', methods=['GET'])
def whitebooks_get_ewaybill():
    ewb_no = request.args.get('ewbNo')
    token = request.args.get('token')
    if not ewb_no:
        return jsonify({'error': 'Missing ewbNo parameter'}), 400

    headers = _base_headers()
    if token:
        headers['Authorization'] = f'Bearer {token}'

    try:
        resp = requests.get(
            f'{WHITEBOOKS_API_URL}/ewayapi/getewaybill',
            params={'email': WHITEBOOKS_EMAIL, 'ewbNo': ewb_no},
            headers=headers,
            timeout=20,
        )
        return _forward(resp)
    except requests.RequestException as e:
        return jsonify({'error': 'Whitebooks getewaybill call failed', 'message': str(e)}), 502


@app.route(API_URL + '/whitebooks-get-ewaybills-of-other-party', methods=['GET'])
def whitebooks_get_ewaybills_of_other_party():
    date = request.args.get('date')
    token = request.args.get('token')
    if not date:
        return jsonify({'error': 'Missing date parameter'}), 400

    headers = _base_headers()
    if token:
        headers['Authorization'] = f'Bearer {token}'

    try:
        resp = requests.get(
            f'{WHITEBOOKS_API_URL}/ewayapi/getewaybillsofotherparty',
            params={'email': WHITEBOOKS_EMAIL, 'date': date},
            headers=headers,
            timeout=20,
        )
        return _forward(resp)
    except requests.RequestException as e:
        return jsonify({'error': 'Whitebooks getewaybillsofotherparty call failed', 'message': str(e)}), 502


@app.route(API_URL + '/whitebooks-get-ewaybills-by-date', methods=['GET'])
def whitebooks_get_ewaybills_by_date():
    date = request.args.get('date')
    token = request.args.get('token')
    if not date:
        return jsonify({'error': 'Missing date parameter'}), 400

    headers = _base_headers()
    if token:
        headers['Authorization'] = f'Bearer {token}'

    try:
        resp = requests.get(
            f'{WHITEBOOKS_API_URL}/ewayapi/getewaybillsbydate',
            params={'email': WHITEBOOKS_EMAIL, 'date': date},
            headers=headers,
            timeout=20,
        )
        return _forward(resp)
    except requests.RequestException as e:
        return jsonify({'error': 'Whitebooks getewaybillsbydate call failed', 'message': str(e)}), 502


# MissingData.jsx calls the mastergst.com domain specifically for these two
# (same GSP account/credentials, different base URL from the whitebooks.in
# routes above) - kept separate to preserve exactly which domain each existing
# call site used.
@app.route(API_URL + '/mastergst-get-ewaybill', methods=['GET'])
def mastergst_get_ewaybill():
    ewb_no = request.args.get('ewbNo')
    token = request.args.get('token')
    if not ewb_no:
        return jsonify({'error': 'Missing ewbNo parameter'}), 400

    headers = _base_headers()
    if token:
        headers['Authorization'] = f'Bearer {token}'

    try:
        resp = requests.get(
            f'{MASTERGST_API_URL}/ewayapi/getewaybill',
            params={'email': WHITEBOOKS_EMAIL, 'ewbNo': ewb_no},
            headers=headers,
            timeout=20,
        )
        return _forward(resp)
    except requests.RequestException as e:
        return jsonify({'error': 'Mastergst getewaybill call failed', 'message': str(e)}), 502


@app.route(API_URL + '/mastergst-get-ewaybills-by-date', methods=['GET'])
def mastergst_get_ewaybills_by_date():
    date = request.args.get('date')
    token = request.args.get('token')
    if not date:
        return jsonify({'error': 'Missing date parameter'}), 400

    headers = _base_headers()
    if token:
        headers['Authorization'] = f'Bearer {token}'

    try:
        resp = requests.get(
            f'{MASTERGST_API_URL}/ewayapi/getewaybillsbydate',
            params={'email': WHITEBOOKS_EMAIL, 'date': date},
            headers=headers,
            timeout=20,
        )
        return _forward(resp)
    except requests.RequestException as e:
        return jsonify({'error': 'Mastergst getewaybillsbydate call failed', 'message': str(e)}), 502
