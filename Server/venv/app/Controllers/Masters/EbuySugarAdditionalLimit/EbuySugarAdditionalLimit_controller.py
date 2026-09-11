from flask import jsonify, request
from app import app, db,socketio, text
from app.models.Masters.EbuySugarAdditionalLimit.EbuySugarAdditionalLimit import EBuySugarBalanceLimit
import os
from datetime import datetime

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

# # Get all Balance Limit Entries API
@app.route(API_URL + "/getall-balance-limits", methods=["GET"])
def get_balance_limits():
    try:
        company_code = request.args.get('company_code')
        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400
        
        entries = EBuySugarBalanceLimit.query.filter_by(Company_Code=company_code).order_by(EBuySugarBalanceLimit.gledgereBuyId.desc()).all()
        
        entries_data = []
        for entry in entries:
            entry_data = {column.key: getattr(entry, column.key) for column in entry.__table__.columns}
            if entry_data.get('Doc_Date'):
                entry_data['Doc_Date'] = entry_data['Doc_Date'].strftime('%Y-%m-%dT%H:%M:%S')
            if entry_data.get('Limit') is not None:
                entry_data['Limit'] = float(entry_data['Limit'])
            entries_data.append(entry_data)

        return jsonify({
            "success": True,
            "data": entries_data,
            "count": len(entries_data)
        })
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500



@app.route(API_URL + "/save-customer-limit", methods=["POST"])
def save_customer_limit():
    try:
        company_code = request.args.get('company_code')
        if company_code is None:
            return jsonify({'error': 'Missing company_code parameter'}), 400
        try:
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid company_code parameter'}), 400

        data = request.json
        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        # ── Required fields ──────────────────────────────────────────────
        required = ['Ac_Code', 'accoid']
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400

        ac_code     = data['Ac_Code']
        accoid      = int(data['accoid'])
        user_id     = data.get('User_Id', '')
        doc_date_str = data.get('Doc_Date', datetime.today().strftime('%Y-%m-%d'))
        username    = data.get('username', '')

        try:
            requested_date = datetime.strptime(doc_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid Doc_Date format. Use YYYY-MM-DD'}), 400

        # Keep the requested calendar date but stamp it with the actual time of
        # this save — Doc_Date is a datetime column and should record when the
        # change really happened, not just midnight.
        now = datetime.now()
        doc_date = datetime.combine(requested_date, now.time())

        # ── Optional fields ──────────────────────────────────────────────
        new_daily_buy_limit  = data.get('daily_buy_limit')   # None if not provided
        new_daily_sell_limit = data.get('daily_sell_limit')  # None if not provided

        additional_buy_amount  = data.get('additional_buy_amount')   # BL entry
        additional_sell_amount = data.get('additional_sell_amount')  # SL entry
        buy_drcr  = data.get('buy_drcr', 'C')   # C = increase, D = decrease
        sell_drcr = data.get('sell_drcr', 'C')
        buy_narration  = data.get('buy_narration', '')
        sell_narration = data.get('sell_narration', '')

        # ── Fetch current limits from account master ──────────────────────
        current = db.session.execute(text("""
            SELECT EbuyDailyLimit, EbuyDailySellLimit
            FROM dbo.nt_1_accountmaster
            WHERE accoid = :accoid
        """), {'accoid': accoid}).fetchone()

        if not current:
            return jsonify({'error': 'Account not found'}), 404

        current_buy_limit  = float(current.EbuyDailyLimit  or 0)
        current_sell_limit = float(current.EbuyDailySellLimit or 0)

        ledger_entries_created = []

        # ════════════════════════════════════════════════════════════════
        # STEP 1 — Update Daily Buy Limit if provided
        # ════════════════════════════════════════════════════════════════
        if new_daily_buy_limit is not None:
            new_buy = float(new_daily_buy_limit)

            db.session.execute(text("""
                UPDATE dbo.nt_1_accountmaster
                SET EbuyDailyLimit = :limit
                WHERE accoid = :accoid
            """), {'limit': new_buy, 'accoid': accoid})

            if new_buy > 0 and new_buy != current_buy_limit:
                if current_buy_limit == 0:
                    # Fresh limit set — add full Credit entry
                    bl_drcr   = 'C'
                    bl_amount = new_buy
                    bl_note   = f'Initial Buy Daily Limit set: {new_buy}'
                else:
                    # Limit changed — add diff entry
                    diff      = new_buy - current_buy_limit
                    bl_drcr   = 'C' if diff > 0 else 'D'
                    bl_amount = abs(diff)
                    bl_note   = f'Buy Daily Limit updated from {current_buy_limit} to {new_buy}'

                new_bl = EBuySugarBalanceLimit(
                    Ac_Code      = ac_code,
                    accoid       = accoid,
                    Doc_Date     = doc_date,
                    Limit        = bl_amount,
                    DRCR         = bl_drcr,
                    Tran_Type    = 'BL',
                    Narration    = bl_note,
                    Company_Code = company_code,
                    User_Id      = user_id,
                )
                db.session.add(new_bl)
                db.session.flush()  # get ID before commit
                ledger_entries_created.append({
                    'type': 'BL', 'drcr': bl_drcr,
                    'amount': bl_amount, 'reason': bl_note,
                    'entry_id': new_bl.gledgereBuyId
                })

        # ════════════════════════════════════════════════════════════════
        # STEP 2 — Update Daily Sell Limit if provided
        # ════════════════════════════════════════════════════════════════
        if new_daily_sell_limit is not None:
            new_sell = float(new_daily_sell_limit)

            db.session.execute(text("""
                UPDATE dbo.nt_1_accountmaster
                SET EbuyDailySellLimit = :limit
                WHERE accoid = :accoid
            """), {'limit': new_sell, 'accoid': accoid})

            if new_sell > 0 and new_sell != current_sell_limit:
                if current_sell_limit == 0:
                    sl_drcr   = 'C'
                    sl_amount = new_sell
                    sl_note   = f'Initial Sell Daily Limit set: {new_sell}'
                else:
                    diff      = new_sell - current_sell_limit
                    sl_drcr   = 'C' if diff > 0 else 'D'
                    sl_amount = abs(diff)
                    sl_note   = f'Sell Daily Limit updated from {current_sell_limit} to {new_sell}'

                new_sl = EBuySugarBalanceLimit(
                    Ac_Code      = ac_code,
                    accoid       = accoid,
                    Doc_Date     = doc_date,
                    Limit        = sl_amount,
                    DRCR         = sl_drcr,
                    Tran_Type    = 'SL',
                    Narration    = sl_note,
                    Company_Code = company_code,
                    User_Id      = user_id,
                )
                db.session.add(new_sl)
                db.session.flush()
                ledger_entries_created.append({
                    'type': 'SL', 'drcr': sl_drcr,
                    'amount': sl_amount, 'reason': sl_note,
                    'entry_id': new_sl.gledgereBuyId
                })

        # ════════════════════════════════════════════════════════════════
        # STEP 3 — Additional Buy Limit entry (BL) if provided
        # ════════════════════════════════════════════════════════════════
        if additional_buy_amount is not None and float(additional_buy_amount) > 0:
            add_buy = float(additional_buy_amount)
            note    = buy_narration or f'{username} {"added" if buy_drcr == "C" else "reduced"} Buy limit {add_buy}'

            new_add_bl = EBuySugarBalanceLimit(
                Ac_Code      = ac_code,
                accoid       = accoid,
                Doc_Date     = doc_date,
                Limit        = add_buy,
                DRCR         = buy_drcr,
                Tran_Type    = 'BL',
                Narration    = note,
                Company_Code = company_code,
                User_Id      = user_id,
            )
            db.session.add(new_add_bl)
            db.session.flush()
            ledger_entries_created.append({
                'type': 'BL', 'drcr': buy_drcr,
                'amount': add_buy, 'reason': 'Additional buy limit entry',
                'entry_id': new_add_bl.gledgereBuyId
            })

        # ════════════════════════════════════════════════════════════════
        # STEP 4 — Additional Sell Limit entry (SL) if provided
        # ════════════════════════════════════════════════════════════════
        if additional_sell_amount is not None and float(additional_sell_amount) > 0:
            add_sell = float(additional_sell_amount)
            note     = sell_narration or f'{username} {"added" if sell_drcr == "C" else "reduced"} Sell limit {add_sell}'

            new_add_sl = EBuySugarBalanceLimit(
                Ac_Code      = ac_code,
                accoid       = accoid,
                Doc_Date     = doc_date,
                Limit        = add_sell,
                DRCR         = sell_drcr,
                Tran_Type    = 'SL',
                Narration    = note,
                Company_Code = company_code,
                User_Id      = user_id,
            )
            db.session.add(new_add_sl)
            db.session.flush()
            ledger_entries_created.append({
                'type': 'SL', 'drcr': sell_drcr,
                'amount': add_sell, 'reason': 'Additional sell limit entry',
                'entry_id': new_add_sl.gledgereBuyId
            })

        # ── Commit everything in one transaction ─────────────────────────
        db.session.commit()

        socketio.emit('balance_limit_created', {
            'accoid': accoid,
            'ledger_entries': ledger_entries_created
        })

        return jsonify({
            'success': True,
            'message': f'Saved successfully. {len(ledger_entries_created)} ledger entry(s) created.',
            'ledger_entries': ledger_entries_created
        }), 201

    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({'error': str(e)}), 500