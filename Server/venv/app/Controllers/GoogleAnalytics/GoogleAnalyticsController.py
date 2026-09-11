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

# ─── Service Account Keys ────────────────────────────────────────────────────

CHINIMANDI_KEY = """-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCyFRp07kJU7TPj
uY8wibc+KM5I2XyInbIH7zNf3sPtNMsGHgHEPAHc5wUpC/oEJKKxqHft++EMpQO9
jfM31qyT4d2nTGd/Gp2xi+GA4kGlVSDhX02PCUzhQ7gt3AcUoZ+nNC+KWNub0xNG
NxJPMzoiUb783HNm1EvEhLPH7Wr6jNfSWRoEZ+hmQEowjwUmmvyfBKtzY8jGanxi
IWj4e6dEsbX7Z3S7MQ9qH8ojvF3dvM4w1HZmPaDkW5YRCRP5xf29PfRa0oERCN41
JpcND7eC3YaKgTGnpfsXDWLbrzO4Iu3AeTfIZ8ZsYSMvJFgOfaQqnuMBQ21vhR1X
OSghfiEJAgMBAAECggEACMl5SXlDLSEaLRuoGNdGwyqsyRPwLOaJFRKkuI+Ln935
wZbD9AyY8+8zRjv4zXEIVRdQuZ2y1FalGVqSfHgbgl2D/CANQEyOKOdTzHH9lryd
V3mGIG9vS3M1uI+Rit9RuyScTumFBoqS+iU4Ak/vB6f8ckonaJTDm1IH8+6/V1b8
LWsp5xi9TXTHjM4sYDL5ycni/xhd+BwcSLm9HHKZw9hXOOCnWw5LRtqH8iAJ2jh0
vOIN44pSXC1684W9GWennau3NU92NVaLhJ+cT+1Oz3HynXdbSrshwDT3FAyRgQxF
Ml+urKjildUS/Lbvb/YwuNCEjkmsvMcnlt8tDbvh7QKBgQDeieQoVuBdZgmv74SK
cItk8dQ4Jg4subk4WquJ6npC15/4S5vVPqg9SWKNlNd9Dd2EYXzlxMbrzHGxFPW3
oSMwgue57eGXeyppGjt7b/jNPsfOzdlRouGw+EU/elP6uCT8OWpLTwmCnQK2oOX+
Qv+PvDkNiqSZRubrv96f2w6CZQKBgQDM2/lDRsMQM0m9ft72u7ujkecuLDHhmRDJ
alsHCcDbHlnf8qj9Vv+U5t1u2u7vFK6LtTHIHjD9m9C1tAAnUGcHyMSiK1bgJBvI
PCNCwf2fdGoaWAT49+2iimO7/VbnaUKANg/t5EuzeZS0uzcnjZNIEPbLmlhernR7
9vbKTlFn1QKBgQDKXYJI3Jey1zM/9gMFEUrxRKfDV3fUXB9+i5UqGTuMxSAHXlob
FJtRAAbK0OsUISOrWiuFled+Ta+lZHX9wl6JosCuZw+Z/LqYUO5+VVhe7BQujypr
/j5V+66dBtSPThzz8BIk4X64c6cgBDiherODNZp8IfOEHuGmyBfeLgmHsQKBgQDA
a+aoELFsaCBdg+v+KbxIGeXh8tUvqEyiQ+oYpEqoBsw4lH+y5qLOxEM9uxsvKmgB
BkMqS2GM9WyHH/n884KzRxubj8XcZ05JOGOOcxS9T+XRtNeG26o0QHUJwR594tr5
/s3bj9KjVBIf6LIXzt2GlZibCfDzjj4PqpuIzyObuQKBgQCb6saUHD15kjCBjA15
fTAu/z/zhckiOEtde5sl8KaxB/ZqLeaXL/By/fD7H9VvnUUsa/PwS5ZCEcUg0aJS
FmRxFv2IsvdKn8gLFblCjXmJ0g3BteineOpWIZYZAe5L2ahgiBchN/7jG2K/lAaj
E1rqQI/FoSvfwoMK/Pnr4MuJUw==
-----END PRIVATE KEY-----"""

AGRIINSITE_KEY = """-----BEGIN PRIVATE KEY-----
MIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQCgqH74tXWUZ2xL
fkTPiAsdQgpFN9Lxx05M/MTSSD538KRYTl/stcj1jMFpbD4hc7f9lHplBYdJw60Q
rOyrplIuJXQxKdU6FBeSMD5EtDlwROHaZqZcExSryBU4GcWZAw5KUSD1UjLFaUKS
tf8Vi428SAJILfcLzAuBFYr92TOXqDA0T7gVHoWUuB4ZpfBfN7lTpOohGEfZxV43
TxOj7ancs3otH9n4S5GvRgvF7d5wTGviMO5a6MPLzocUyQ6m2Lx4nWlXMBdLGxTO
PwfwCxzMT7Q2akfit/qLGDJSybidR1O/G36FsiK3rLWgHzVv9Ry44ptgTaSiVKdN
+6parbE9AgMBAAECgf8sP/T1daqIfn2TZkiNm9OEXeSaEH0uhijrOlCYnVAeRVQ+
EY8+ofx0WyA/0cujK8dA2G7Hrqa8iAkTxydoqV/gcXX2jbRHO71YS1R4Kcs/o65J
0sqLvb3qJy22gSuipWT+hsKGRZ2YBBS+xNALIH8Oije5F9Gn4ycAczTAjQCZrQN0
IIYTOrOqCwgg1Uzh/BwvRnL0eoRMSDNnJG9x5F/vHbOXMeML0jHis8yKYc0kvrwW
6wjtWy1dTXqM4r9S2VjrqQJtDdA9jj+kMmScZt7FEK4yflZW2x7ODxeqoKDqquHN
anj2aG/JVEQ6RQahgzkhhk832lEAvkQDjikf/kMCgYEA0JUpyCsn2dPTJSyNA26N
v2Kvmyj+7GQdQqNrkKrQ70HLLeAYICa+ASRzb8OcYny88cgmUh5yNr9asd6m9TcK
jmlPlw8u1feplhuFeHrsxlyFBiX3LlYrlNuaPfKBYf3jZtfOOtLFDzMIhw0+HHii
NDcCbxZ/aUUJO8gPMILVmVsCgYEAxS5Ibrii3PpocqIz7T/GwTT9oFmgzxDYj1dD
pcWzD3GtKznn/ZMOq7SE2zrLh2UJCcz9N5awJTQXhx7AumqTWgPqi3ujZPQ2vdTZ
GKf4YcJ1NVvO1XxtLQCH31DOL8tE4NUe8RWQN2liHGPXpaJkDJrg5ZrAA1wGJUuB
2cWPy0cCgYBTRKkYavoOwLyTI5Tr4M+frtLx+0zBrDnuJ3VCnJ6qVTa6irK26yCB
Lj8TSCD/RFLdpwx9TgBEkOGxDnTSgfWp4qrOYFZPPv6pmTUQYupxSfAlAzUJf4cI
dx69SjmSmBuXK+H9o7Tdm371Azlffl0qwScsl+unZ9MG1ZgSwrho7wKBgAJREuTK
Io+6GXQPV9DXyPwIJVq28t678e9tNQxDkGEEEubJHWKrUabOzijNPgrvMvX8hJUc
niExxXz+7YDDM8wA88aDw12ySNpeH9bcUlzDriDcXUfA2H+I3A/RoTqKhtqlZmGq
wTEFefOfcK8vg0FqqG3KLatcb24Mvw/R9GiNAoGBAKen0vQe1rcyGq7AJScbLHaq
9dzXNP5xiQ7bsLVpCtrlDo8/jtBYJ6GA8g7DRVhCAKhl2JycunqhYQCrCsA4t/1k
8X1CGnxtGMvya3eu1F58rhVoI/s/dqH73NMzgeXAa/0DsVRcsuYjVu02pElij7fo
bLlFtVZyDrCSHra7M4a0
-----END PRIVATE KEY-----"""

BIOENERGY_KEY = """-----BEGIN PRIVATE KEY-----
MIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQDT9TEZIDMnQkqQ
4I2bCn00b70B52KIymtfGMkTu1xwMeDf3utfJQD6s+BIvcB39ZTZEwdr1P8lDeqm
kWIar3wuD3O2LD8LRmEqLD3N8g2iDBWihS9e+NRiBPPn3wrShbqmk3f/WyUnU5QO
pbTCj+BqOso5a8K/MgXQhAUI+HEpGAvaIp2dXq9eB3gHqn/8E2bAUoK20PzgbsGi
oYpfP1hUnFE6fGe7HJfBvfZptRUO9QSqIRWR8/dn6SuLvieId5nKx9k+2T/vI46Q
c+yVbQrJaDKglBEx4UcjepHmo/qkGVIRTr4Pis9B92K7KBtw97XFKsyf3EyJlQxJ
g35HYA4BAgMBAAECgf8XjsTqOf31exS2jX6voLbRwSmMsJ7u/TB53VNb8hMQFTsd
JrWaWY6GTr+61fwyWQU2KztD7OR+xdEyui3hMWfn5qfBs6E+K5BZE5m67hA91oIB
EjR1pcpVKp/BQbT+OQbJxNIte3/hoxRtnFU+2qbip64aO7PldDXZOxMkMBjDrEij
njckTFsDNv3V/6bpBktCdTBgj0wcjecDIMZaHD07bY4OymFryoplsDaQw19QjtgR
0yGeuj9KdqqOI1IpfTZeIItYBxKLrevDP4CtGf8bXIMJAsOgfK+5b5tDkdUyu0XY
nO5R5aN4vpwmVx9gpojYO+RwlsiuyUggRqsPGsECgYEA991BdiN/WIEsDYehZkyk
6LbMO8ZsJwBEB+uAzSSelT2fJPsXO7ng+eehC8gpoF013pYwh6IiXE5VYpCD4XV1
sGyGRJs2cyWx0QCwoMlrHa31yhQvPq4jTwdjTGKbeR0g5zzJkWe/mowCQD2/jWGz
OUSQ3uJGia6Rsh41jqBWY8ECgYEA2uo468fpxEAtnp8NSS2hy3i1jbsf7Tetw2EZ
YHvoV2plkrhHyGV4IW3F4yVXuAkc5Rr/McpJu4ylLnQP8q47aiojccE2vhHT4upS
1UPUgseIZULyXbebGO5s3IemWkj1BeVu3ACko2fcgF2FmFSB3kAMVr0MyhxQkezt
qSiXOkECgYAY72BDg0SvYadN4SQih3lbk/At30NIFSXC6jU17gYqG13kOYJX1tZE
LcIszkEpyda+grt1GaF9ScAbP1CVINzrF6/WPQsYQGWIEhqywjCNds+wOaGbG6ef
rq2VpKHhaEXEHYBlqVtEL+uWDOA1V+vQyg4M7hSMi0xK7/ERXR3zwQKBgQDIROxr
70iRrDDP4yvxXVid30Egdyb/CifiDMt9c/2bMw/XSNUKpKFg257kbX4xM80GX0tF
Do2jkUhwFeedGP3r4r7oS108Ruzzs3Cx/8rDFa1XDgbR661tAnn+ye5KvGHD0iA4
DjKP9u1HVcdpEy5311oyY+L2Zy7iQMEvNp4awQKBgGBofRBGwNcXdK+w86YOJRlF
aMyPpIDzbwT8cXNjrB590VefY74ol5NMfKlNYlUrQE/Onh1AfR9ER5cbD2mM8KuX
WW55zN5PenT41x8dRgY9GqP5rjGSIjGnm75xKq1UFFuVJ220ksMSYXF4UWZuMmrV
/Fnzc0fbQUpbCkPGObpJ
-----END PRIVATE KEY-----"""

SITES = {
    'chinimandi': {
        'client_email': 'analytics-reader@newsroom-insights.iam.gserviceaccount.com',
        'property_id': '382590087',
        'private_key': CHINIMANDI_KEY,
    },
    'bioenergy': {
        'client_email': 'bioenergytimes-analytics@newsroom-insights.iam.gserviceaccount.com',
        'property_id': '430109102',
        'private_key': BIOENERGY_KEY,
    },
    'agriinsite': {
        'client_email': 'agriinsite-analytics@newsroom-insights.iam.gserviceaccount.com',
        'property_id': '434291573',
        'private_key': AGRIINSITE_KEY,
    },
}

# ─── WordPress Newsroom API URLs ─────────────────────────────────────────────

NEWSROOM_URLS = {
    'chinimandi': 'https://www.chinimandi.com/wp-json/newsroom-insights/v1/counts',
    'bioenergy':  'https://bioenergytimes.com/wp-json/newsroom-insights/v1/counts',
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

EBUYSUGAR_URL = 'https://ebuysugar.com/login/Masteradmin/API/Dashboard/index'

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

ETRACK_BASE_URL = 'https://jkhrms.vaniasolutions.com:9093/api/JKDashboard'

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
