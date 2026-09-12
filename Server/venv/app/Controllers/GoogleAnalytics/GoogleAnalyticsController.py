from app import app
from flask import jsonify, request
import os
import time
import requests
from datetime import date, timedelta
from concurrent.futures import ThreadPoolExecutor

try:
    import jwt as pyjwt
except ImportError:
    import PyJWT as pyjwt

API_URL = os.getenv('API_URL')

def _ga_private_key(env_var):
    return os.getenv(env_var, '').replace('\\n', '\n')

SITES = {
    'chinimandi': {
        'client_email': os.getenv('GA_CHINIMANDI_CLIENT_EMAIL'),
        'property_id': os.getenv('GA_CHINIMANDI_PROPERTY_ID'),
        'private_key': _ga_private_key('GA_CHINIMANDI_PRIVATE_KEY'),
    },
    'bioenergy': {
        'client_email': os.getenv('GA_BIOENERGY_CLIENT_EMAIL'),
        'property_id': os.getenv('GA_BIOENERGY_PROPERTY_ID'),
        'private_key': _ga_private_key('GA_BIOENERGY_PRIVATE_KEY'),
    },
    'agriinsite': {
        'client_email': os.getenv('GA_AGRIINSITE_CLIENT_EMAIL'),
        'property_id': os.getenv('GA_AGRIINSITE_PROPERTY_ID'),
        'private_key': _ga_private_key('GA_AGRIINSITE_PRIVATE_KEY'),
    },
}

# ─── WordPress Newsroom API URLs ─────────────────────────────────────────────

NEWSROOM_URLS = {
    'chinimandi': os.getenv('NEWSROOM_CHINIMANDI_URL'),
    'bioenergy':  os.getenv('NEWSROOM_BIOENERGY_URL'),
}


def fetch_newsroom(site_key, range_str, start=None, end=None):
    base = NEWSROOM_URLS.get(site_key)
    if not base:
        return None
    if range_str == 'custom' and start and end:
        url = f'{base}?range=custom&start={start}&end={end}'
    elif range_str == 'month':
        today_d  = date.today()
        start_d  = (today_d - timedelta(days=30)).strftime('%Y-%m-%d')
        end_d    = today_d.strftime('%Y-%m-%d')
        url = f'{base}?range=custom&start={start_d}&end={end_d}'
    else:
        url = f'{base}?range={range_str}'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
    }
    r = requests.get(url, headers=headers, timeout=10)
    r.raise_for_status()
    return r.json()

# ─── GA4 Auth Helpers ────────────────────────────────────────────────────────

def get_access_token(cfg):
    now = int(time.time())
    payload = {
        'iss': cfg['client_email'],
        'scope': 'https://www.googleapis.com/auth/analytics.readonly',
        'aud': 'https://oauth2.googleapis.com/token',
        'iat': now,
        'exp': now + 3600,
    }
    signed = pyjwt.encode(payload, cfg['private_key'], algorithm='RS256')
    r = requests.post(
        'https://oauth2.googleapis.com/token',
        data={'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion': signed},
        timeout=10,
    )
    r.raise_for_status()
    token = r.json().get('access_token')
    if not token:
        raise ValueError(f"No access_token in response: {r.json()}")
    return token


def run_report(property_id, access_token, date_ranges, dimensions, metrics, limit=10):
    url = f'https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runReport'
    body = {
        'dateRanges': date_ranges,
        'dimensions': [{'name': d} for d in dimensions],
        'metrics': [{'name': m} for m in metrics],
    }
    if dimensions:
        body['orderBys'] = [{'metric': {'metricName': metrics[0]}, 'desc': True}]
        body['limit'] = limit
    r = requests.post(
        url, json=body,
        headers={'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


def parse_rows(data):
    if not data or 'rows' not in data:
        return []
    dim_h = [h['name'] for h in data.get('dimensionHeaders', [])]
    met_h = [h['name'] for h in data.get('metricHeaders', [])]
    rows = []
    for row in data['rows']:
        r = {}
        for i, d in enumerate(dim_h):
            r[d] = row['dimensionValues'][i]['value']
        for i, m in enumerate(met_h):
            try:
                r[m] = round(float(row['metricValues'][i]['value']), 4)
            except Exception:
                r[m] = 0
        rows.append(r)
    return rows


def build_date_range(range_str, start=None, end=None):
    mapping = {
        'today':     ('today', 'today'),
        'yesterday': ('yesterday', 'yesterday'),
        'week':      ('7daysAgo', 'today'),
        'month':     ('30daysAgo', 'today'),
        'year':      ('365daysAgo', 'today'),
    }
    if range_str == 'custom' and start and end:
        return [{'startDate': start, 'endDate': end}]
    s, e = mapping.get(range_str, ('7daysAgo', 'today'))
    return [{'startDate': s, 'endDate': e}]


# ─── Flask Route ─────────────────────────────────────────────────────────────

@app.route(API_URL + '/ga4-analytics', methods=['GET'])
def ga4_analytics():
    range_str   = request.args.get('range', 'week')
    start_date  = request.args.get('start')
    end_date    = request.args.get('end')
    site_filter = request.args.get('site')          # optional: 'chinimandi' or 'bioenergy'
    date_ranges = build_date_range(range_str, start_date, end_date)

    result = {}
    sites_to_run = {k: v for k, v in SITES.items() if not site_filter or k == site_filter}

    for site_key, cfg in sites_to_run.items():
        try:
            token = get_access_token(cfg)
            pid   = cfg['property_id']

            # --- Aggregate KPIs (no dimensions) ---
            kpi_raw  = run_report(pid, token, date_ranges, [],
                ['activeUsers', 'sessions', 'screenPageViews',
                 'newUsers', 'bounceRate', 'averageSessionDuration'])
            kpi_rows = parse_rows(kpi_raw)
            kpi      = kpi_rows[0] if kpi_rows else {}

            # --- 30-day daily trend (always last 30 days) ---
            trend_raw = run_report(pid, token,
                [{'startDate': '30daysAgo', 'endDate': 'today'}],
                ['date'], ['activeUsers', 'sessions', 'screenPageViews'], limit=31)
            trend = sorted(parse_rows(trend_raw), key=lambda x: x.get('date', ''))

            # --- Device category breakdown ---
            devices = parse_rows(run_report(pid, token, date_ranges,
                ['deviceCategory'], ['activeUsers', 'sessions'], limit=5))

            # --- Top countries ---
            countries = parse_rows(run_report(pid, token, date_ranges,
                ['country'], ['activeUsers', 'sessions'], limit=8))

            # --- Traffic channels ---
            channels = parse_rows(run_report(pid, token, date_ranges,
                ['sessionDefaultChannelGroup'], ['activeUsers', 'sessions'], limit=8))

            # --- Top pages ---
            pages = parse_rows(run_report(pid, token, date_ranges,
                ['pageTitle'], ['screenPageViews', 'activeUsers'], limit=15))

            result[site_key] = {
                'kpi': kpi,
                'trend': trend,
                'devices': devices,
                'countries': countries,
                'channels': channels,
                'pages': pages,
            }

        except Exception as e:
            result[site_key] = {
                'error': str(e),
                'kpi': {}, 'trend': [],
                'devices': [], 'countries': [],
                'channels': [], 'pages': [],
            }

        # ─── Newsroom WordPress API ──────────────────────────────────────
        try:
            newsroom = fetch_newsroom(site_key, range_str, start_date, end_date)
            result[site_key]['newsroom'] = newsroom or {}
        except Exception as ne:
            result[site_key]['newsroom'] = {'error': str(ne)}

    return jsonify(result)


# ─── eBuySugar Dashboard Route ───────────────────────────────────────────────

EBUYSUGAR_URL = os.getenv('EBUYSUGAR_DASHBOARD_URL')

@app.route(API_URL + '/ebuysugar-dashboard', methods=['GET'])
def ebuysugar_dashboard():
    filter_type = request.args.get('filter', 'today')
    start_date  = request.args.get('start')
    end_date    = request.args.get('end')

    if filter_type == 'custom' and start_date and end_date:
        url = f'{EBUYSUGAR_URL}?filter=custom&start_date={start_date}&end_date={end_date}'
    else:
        url = f'{EBUYSUGAR_URL}?filter={filter_type}'

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
    }
    try:
        r = requests.get(url, headers=headers, timeout=15)
        r.raise_for_status()
        return jsonify(r.json())
    except Exception as e:
        return jsonify({'status': '0', 'error': str(e), 'info': []}), 500


# ─── eTrack (JK HRMS) Dashboard Route ────────────────────────────────────────

ETRACK_BASE_URL = os.getenv('ETRACK_BASE_URL')

ETRACK_COMPANIES = [
    {'id': 9,  'name': 'JK India eAgriTech Ltd'},
    {'id': 11, 'name': 'JK Wealth Pvt Ltd'},
    {'id': 13, 'name': 'XYZ Company'},
    {'id': 14, 'name': 'Agrahyah Technologies Pvt Ltd'},
    {'id': 15, 'name': 'JK Villa'},
    {'id': 16, 'name': 'RNS Facilities Services'},
    {'id': 17, 'name': 'LATA DIXIT TECH PVT LTD'},
]


def fetch_etrack(endpoint, company_id, filter_date):
    url = f'{ETRACK_BASE_URL}/{endpoint}?filterDate={filter_date}&companyId={company_id}'
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    return r.json()


@app.route(API_URL + '/etrack-dashboard', methods=['GET'])
def etrack_dashboard():
    company_id = request.args.get('companyId', '16')
    filter_date = request.args.get('filterDate') or date.today().strftime('%Y-%m-%d')

    result = {'companies': ETRACK_COMPANIES, 'companyId': int(company_id), 'filterDate': filter_date}

    with ThreadPoolExecutor(max_workers=4) as pool:
        counts_future   = pool.submit(fetch_etrack, 'GetAdminDashboardCounts', company_id, filter_date)
        total_future    = pool.submit(fetch_etrack, 'GetTotalEmployeeList', company_id, filter_date)
        present_future  = pool.submit(fetch_etrack, 'GetPresentEmployeeList', company_id, filter_date)
        absent_future   = pool.submit(fetch_etrack, 'GetAbsentEmployeeList', company_id, filter_date)

    try:
        counts_data = counts_future.result()
        result['counts'] = counts_data.get('Data', {})
    except Exception as e:
        result['counts'] = {}
        result['countsError'] = str(e)

    try:
        total_data = total_future.result()
        result['totalEmployees'] = total_data.get('Data', [])
    except Exception as e:
        result['totalEmployees'] = []
        result['totalEmployeesError'] = str(e)

    try:
        present_data = present_future.result()
        result['presentEmployees'] = present_data.get('Data', [])
    except Exception as e:
        result['presentEmployees'] = []
        result['presentEmployeesError'] = str(e)

    try:
        absent_data = absent_future.result()
        result['absentEmployees'] = absent_data.get('Data', [])
    except Exception as e:
        result['absentEmployees'] = []
        result['absentEmployeesError'] = str(e)

    return jsonify(result)
