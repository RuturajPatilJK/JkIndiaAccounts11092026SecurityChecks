# from flask import request, jsonify
# from app import app, db
# from sqlalchemy import func, case
# from datetime import datetime
# from collections import defaultdict
# from app.models.Reports.GLedeger.GLedgerModels import Gledger
# import os

# API_URL = os.getenv('API_URL')

# @app.route(API_URL + '/interest-statement', methods=['GET'])
# def interest_statement():
#     try:
#         accode = request.args.get('accode')
#         fromdt = request.args.get('fromdt')
#         todt = request.args.get('todt')
#         int_rate = float(request.args.get('intRate'))
#         int_days = int(request.args.get('intDays'))
#         company_code = request.args.get('company_code')

#         from_date = datetime.strptime(fromdt, "%Y-%m-%d").date()
#         to_date = datetime.strptime(todt, "%Y-%m-%d").date()

#         # Opening Balance
#         op_bal_query = db.session.query(
#             func.sum(case(
#                 (Gledger.DRCR == 'D', Gledger.AMOUNT),
#                 else_=-Gledger.AMOUNT
#             )).label('OpBal')
#         ).filter(
#             Gledger.DOC_DATE < from_date,
#             Gledger.AC_CODE == accode,
#             Gledger.COMPANY_CODE == company_code
#         ).group_by(Gledger.AC_CODE)

#         op_bal = float(op_bal_query.scalar() or 0.0)

#         transactions = db.session.query(
#             Gledger.TRAN_TYPE,
#             Gledger.DOC_DATE,
#             Gledger.AMOUNT,
#             Gledger.DRCR
#         ).filter(
#             Gledger.AC_CODE == accode,
#             Gledger.DOC_DATE.between(from_date, to_date),
#             Gledger.COMPANY_CODE == company_code
#         ).order_by(Gledger.DOC_DATE, Gledger.TRAN_TYPE).all()

#         # Group transactions by date
#         from collections import defaultdict
#         grouped_txns = defaultdict(list)
#         for txn in transactions:
#             txn_date = txn.DOC_DATE
#             if isinstance(txn_date, str):
#                 txn_date = datetime.strptime(txn_date, "%Y-%m-%d").date()
#             grouped_txns[txn_date].append(txn)

#         statement = []
#         balance = op_bal
#         prev_balance = balance
#         prev_date = from_date

#         total_debit = max(op_bal, 0)
#         total_credit = -min(op_bal, 0)
#         net_days = 0
#         net_interest = 0.0

#         # Opening row
#         statement.append({
#             'Tran_Type': 'OP',
#             'Date': from_date.strftime('%d/%m/%Y'),
#             'Debit_Amount': round(op_bal, 2) if op_bal > 0 else 0.0,
#             'Credit_Amount': round(-op_bal, 2) if op_bal < 0 else 0.0,
#             'Balance': abs(round(op_bal, 2)),
#             'Bal_DC': 'Dr' if op_bal >= 0 else 'Cr',
#             'Days': 0,
#             'Interest': 0.0,
#             'Int_DC': ''
#         })

#         for txn_date in sorted(grouped_txns.keys()):
        
#             used_days = (txn_date - prev_date).days
#             if txn_date == to_date:
#                 used_days += 1  

#             interest = 0.0
#             if used_days > 0:
#                 interest = round(((abs(prev_balance) * int_rate / 100) / int_days) * used_days, 2)
#                 net_interest += interest if prev_balance >= 0 else -interest
#                 net_days += used_days

            
#             for txn in grouped_txns[txn_date]:
#                 debit = float(txn.AMOUNT) if txn.DRCR == 'D' else 0.0
#                 credit = float(txn.AMOUNT) if txn.DRCR == 'C' else 0.0

#                 total_debit += debit
#                 total_credit += credit

#                 balance += debit - credit

#                 statement.append({
#                     'Tran_Type': txn.TRAN_TYPE,
#                     'Date': txn_date.strftime('%d/%m/%Y'),
#                     'Debit_Amount': debit,
#                     'Credit_Amount': credit,
#                     'Balance': abs(round(balance, 2)),
#                     'Bal_DC': 'Dr' if balance >= 0 else 'Cr',
#                     'Days': used_days,
#                     'Interest': abs(interest),
#                     'Int_DC': 'Dr' if prev_balance >= 0 else 'Cr'
#                 })

#                 # reset for next txn
#                 used_days = 0
#                 interest = 0.0
#                 prev_balance = balance

#             prev_date = txn_date

#         # Final interest till to_date (only if to_date is not already in transactions)
#         if to_date not in grouped_txns:
#             last_days = (to_date - prev_date).days + 1
#             final_interest = 0.0
#             if last_days > 0:
#                 final_interest = round(((abs(prev_balance) * int_rate / 100) / int_days) * last_days, 2)
#                 net_interest += final_interest if prev_balance >= 0 else -final_interest
#                 net_days += last_days

#                 statement.append({
#                     'Tran_Type': '',
#                     'Date': to_date.strftime('%d/%m/%Y'),
#                     'Debit_Amount': 0.0,
#                     'Credit_Amount': 0.0,
#                     'Balance': abs(round(balance, 2)),
#                     'Bal_DC': 'Dr' if balance >= 0 else 'Cr',
#                     'Days': last_days,
#                     'Interest': abs(final_interest),
#                     'Int_DC': 'Dr' if prev_balance >= 0 else 'Cr'
#                 })

#         totals = {
#             'Total_Debit': round(total_debit, 2),
#             'Total_Credit': round(total_credit, 2),
#             'Net_Days': net_days,
#             'Net_Interest': abs(round(net_interest, 2)),
#             'Net_Balance': abs(round(balance, 2)),
#             'Net_Balance_DC': 'Dr' if balance >= 0 else 'Cr',
#             'Net_Interest_DC': 'Dr' if net_interest >= 0 else 'Cr'
#         }

#         return jsonify({'data': statement, 'totals': totals})

#     except Exception as e:
#         return jsonify({'error': str(e)}), 500










# from flask import request, jsonify
# from app import app, db
# from sqlalchemy import func, case
# from datetime import datetime, timedelta
# from app.models.Reports.GLedeger.GLedgerModels import Gledger
# import os

# API_URL = os.getenv('API_URL')


# @app.route(API_URL + '/interest-statement', methods=['GET'])
# def interest_statement():
#     try:
#         accode       = request.args.get('accode')
#         fromdt       = request.args.get('fromdt')
#         todt         = request.args.get('todt')
#         int_rate     = float(request.args.get('intRate'))
#         int_days     = int(request.args.get('intDays'))
#         company_code = request.args.get('company_code')

#         from_date = datetime.strptime(fromdt, "%Y-%m-%d").date()
#         to_date   = datetime.strptime(todt,   "%Y-%m-%d").date()

    
#         op_bal = float(
#             db.session.query(
#                 func.sum(
#                     case(
#                         (Gledger.DRCR == 'D',  Gledger.AMOUNT),
#                         else_=-Gledger.AMOUNT
#                     )
#                 ).label('OpBal')
#             ).filter(
#                 Gledger.DOC_DATE    <  from_date,
#                 Gledger.AC_CODE     == accode,
#                 Gledger.COMPANY_CODE == company_code
#             ).scalar() or 0.0
#         )


#         transactions = db.session.query(
#             Gledger.TRAN_TYPE,
#             Gledger.DOC_DATE,
#             Gledger.AMOUNT,
#             Gledger.DRCR
#         ).filter(
#             Gledger.AC_CODE      == accode,
#             Gledger.DOC_DATE.between(from_date, to_date),
#             Gledger.COMPANY_CODE == company_code
#         ).order_by(Gledger.DOC_DATE, Gledger.TRAN_TYPE).all()


#         statement   = []
#         balance     = op_bal        
#         days_date   = from_date    
#         net_interest = 0.0
#         net_days     = 0

#         total_debit  = max(op_bal, 0.0)
#         total_credit = max(-op_bal, 0.0)


#         statement.append({
#             'Tran_Type':     'OP',
#             'Date':          from_date.strftime('%d/%m/%Y'),
#             'Debit_Amount':  round(op_bal,  2) if op_bal > 0 else 0.0,
#             'Credit_Amount': round(-op_bal, 2) if op_bal < 0 else 0.0,
#             'Balance':       abs(round(op_bal, 2)),
#             'Bal_DC':        'Dr' if op_bal >= 0 else 'Cr',
#             'Days':          0,
#             'Interest':      0.0,
#             'Int_DC':        ''
#         })

   
#         for txn in transactions:
#             txn_date = txn.DOC_DATE
#             if isinstance(txn_date, str):
#                 txn_date = datetime.strptime(txn_date, "%Y-%m-%d").date()

      
#             days = (txn_date - days_date).days

       
#             interest = round(
#                 (days * (balance * int_rate) / int_days) / 100, 2
#             )


#             net_interest += interest        
#             net_days     += days

#             debit  = float(txn.AMOUNT) if txn.DRCR == 'D' else 0.0
#             credit = float(txn.AMOUNT) if txn.DRCR == 'C' else 0.0

#             total_debit  += debit
#             total_credit += credit

#             # VB6: BALANCE updated AFTER recording interest
#             balance += debit - credit

#             statement.append({
#                 'Tran_Type':     txn.TRAN_TYPE,
#                 'Date':          txn_date.strftime('%d/%m/%Y'),
#                 'Debit_Amount':  debit,
#                 'Credit_Amount': credit,
#                 'Balance':       abs(round(balance, 2)),
#                 'Bal_DC':        'Dr' if balance >= 0 else 'Cr',
#                 'Days':          days,
#                 'Interest':      abs(interest),
#                 'Int_DC':        'Dr' if interest >= 0 else 'Cr'
#             })

        
#             days_date = txn_date

#         final_days = (to_date - days_date).days + 1  

#         final_interest = round(
#             (final_days * (balance * int_rate) / int_days) / 100, 2
#         )
#         net_interest += final_interest
#         net_days     += final_days

#         statement.append({
#             'Tran_Type':     '',
#             'Date':          to_date.strftime('%d/%m/%Y'),
#             'Debit_Amount':  0.0,
#             'Credit_Amount': 0.0,
#             'Balance':       abs(round(balance, 2)),
#             'Bal_DC':        'Dr' if balance >= 0 else 'Cr',
#             'Days':          final_days,
#             'Interest':      abs(final_interest),
#             'Int_DC':        'Dr' if final_interest >= 0 else 'Cr'
#         })

  
#         totals = {
#             'Total_Debit':    round(total_debit,  2),
#             'Total_Credit':   round(total_credit, 2),
#             'Net_Days':       net_days,
#             'Net_Interest':   abs(round(net_interest, 2)),
#             'Net_Interest_DC':'Dr' if net_interest >= 0 else 'Cr',
#             'Net_Balance':    abs(round(balance, 2)),
#             'Net_Balance_DC': 'Dr' if balance >= 0 else 'Cr',
#         }

#         return jsonify({'data': statement, 'totals': totals})

#     except Exception as e:
#         return jsonify({'error': str(e)}), 500






# from flask import request, jsonify
# from app import app, db
# from sqlalchemy import func, case
# from datetime import datetime
# from app.models.Reports.GLedeger.GLedgerModels import Gledger
# import os

# API_URL = os.getenv('API_URL')


# @app.route(API_URL + '/interest-statement', methods=['GET'])
# def interest_statement():
#     try:
#         accode       = request.args.get('accode')
#         fromdt       = request.args.get('fromdt')
#         todt         = request.args.get('todt')
#         int_rate     = float(request.args.get('intRate'))
#         int_days     = int(request.args.get('intDays'))
#         company_code = request.args.get('company_code')

#         from_date = datetime.strptime(fromdt, "%Y-%m-%d").date()
#         to_date   = datetime.strptime(todt,   "%Y-%m-%d").date()

#         op_bal = float(
#             db.session.query(
#                 func.sum(
#                     case(
#                         (Gledger.DRCR == 'D',  Gledger.AMOUNT),
#                         else_=-Gledger.AMOUNT
#                     )
#                 ).label('OpBal')
#             ).filter(
#                 Gledger.DOC_DATE     <  from_date,
#                 Gledger.AC_CODE      == accode,
#                 Gledger.COMPANY_CODE == company_code
#             ).scalar() or 0.0
#         )

#         transactions = db.session.query(
#             Gledger.TRAN_TYPE,
#             Gledger.DOC_DATE,
#             Gledger.AMOUNT,
#             Gledger.DRCR
#         ).filter(
#             Gledger.AC_CODE      == accode,
#             Gledger.DOC_DATE.between(from_date, to_date),
#             Gledger.COMPANY_CODE == company_code
#         ).order_by(Gledger.DOC_DATE, Gledger.TRAN_TYPE).all()

#         statement    = []
#         balance      = op_bal
#         days_date    = from_date
#         net_interest = 0.0
#         net_days     = 0

#         total_debit  = max(op_bal, 0.0)
#         total_credit = max(-op_bal, 0.0)

#         bal_for_final = op_bal

#         statement.append({
#             'Tran_Type':     'OP',
#             'Date':          from_date.strftime('%d/%m/%Y'),
#             'Debit_Amount':  round(op_bal,  2) if op_bal > 0 else 0.0,
#             'Credit_Amount': round(-op_bal, 2) if op_bal < 0 else 0.0,
#             'Balance':       abs(round(op_bal, 2)),
#             'Bal_DC':        'Dr' if op_bal >= 0 else 'Cr',
#             'Days':          0,
#             'Interest':      0.0,
#             'Int_DC':        ''
#         })

#         for txn in transactions:
#             txn_date = txn.DOC_DATE
#             if isinstance(txn_date, str):
#                 txn_date = datetime.strptime(txn_date, "%Y-%m-%d").date()

#             days = (txn_date - days_date).days

#             interest = round(
#                 (days * (balance * int_rate) / int_days) / 100, 2
#             )

#             net_interest += interest
#             net_days     += days

#             debit  = float(txn.AMOUNT) if txn.DRCR == 'D' else 0.0
#             credit = float(txn.AMOUNT) if txn.DRCR == 'C' else 0.0

#             total_debit  += debit
#             total_credit += credit

#             # VB6: BALANCE updated AFTER recording interest
#             balance += debit - credit

#             # transactions ON to_date do not earn interest for that day
#             if txn_date < to_date:
#                 bal_for_final = balance

#             statement.append({
#                 'Tran_Type':     txn.TRAN_TYPE,
#                 'Date':          txn_date.strftime('%d/%m/%Y'),
#                 'Debit_Amount':  debit,
#                 'Credit_Amount': credit,
#                 'Balance':       abs(round(balance, 2)),
#                 'Bal_DC':        'Dr' if balance >= 0 else 'Cr',
#                 'Days':          days,
#                 'Interest':      abs(interest),
#                 'Int_DC':        'Dr' if interest >= 0 else 'Cr'
#             })

#             days_date = txn_date

#         # final day: interest on balance BEFORE to_date transactions, no double count
#         if days_date == to_date:
#             final_days = 1
#         else:
#             final_days = (to_date - days_date).days + 1

#         final_interest = round(
#             (final_days * (bal_for_final * int_rate) / int_days) / 100, 2
#         )
#         net_interest += final_interest
#         net_days     += final_days

#         statement.append({
#             'Tran_Type':     '',
#             'Date':          to_date.strftime('%d/%m/%Y'),
#             'Debit_Amount':  0.0,
#             'Credit_Amount': 0.0,
#             'Balance':       abs(round(balance, 2)),
#             'Bal_DC':        'Dr' if balance >= 0 else 'Cr',
#             'Days':          final_days,
#             'Interest':      abs(final_interest),
#             'Int_DC':        'Dr' if final_interest >= 0 else 'Cr'
#         })

#         totals = {
#             'Total_Debit':     round(total_debit,  2),
#             'Total_Credit':    round(total_credit, 2),
#             'Net_Days':        net_days,
#             'Net_Interest':    abs(round(net_interest, 2)),
#             'Net_Interest_DC': 'Dr' if net_interest >= 0 else 'Cr',
#             'Net_Balance':     abs(round(balance, 2)),
#             'Net_Balance_DC':  'Dr' if balance >= 0 else 'Cr',
#         }

#         return jsonify({'data': statement, 'totals': totals})

#     except Exception as e:
#         return jsonify({'error': str(e)}), 500












from flask import request, jsonify
from app import app, db
from sqlalchemy import func, case
from datetime import datetime, timedelta
from app.models.Reports.GLedeger.GLedgerModels import Gledger
import os

API_URL = os.getenv('API_URL')


@app.route(API_URL + '/interest-statement', methods=['GET'])
def interest_statement():
    try:
        accode       = request.args.get('accode')
        fromdt       = request.args.get('fromdt')
        todt         = request.args.get('todt')
        int_rate     = float(request.args.get('intRate'))
        int_days     = int(request.args.get('intDays'))
        company_code = request.args.get('company_code')

        from_date = datetime.strptime(fromdt, "%Y-%m-%d").date()
        to_date   = datetime.strptime(todt,   "%Y-%m-%d").date()


        not_interest_posting = ~Gledger.NARRATION.ilike('%INTEREST%')

        op_bal = float(
            db.session.query(
                func.sum(
                    case(
                        (Gledger.DRCR == 'D', Gledger.AMOUNT),
                        else_=-Gledger.AMOUNT
                    )
                ).label('OpBal')
            ).filter(
                Gledger.DOC_DATE     <  from_date,
                Gledger.AC_CODE      == accode,
                Gledger.COMPANY_CODE == company_code
            ).scalar() or 0.0
        )

        transactions = db.session.query(
            Gledger.TRAN_TYPE,
            Gledger.DOC_DATE,
            Gledger.AMOUNT,
            Gledger.DRCR
        ).filter(
            Gledger.AC_CODE      == accode,
            Gledger.DOC_DATE.between(from_date, to_date),
            Gledger.COMPANY_CODE == company_code,
            not_interest_posting
        ).order_by(Gledger.DOC_DATE, Gledger.TRAN_TYPE).all()

        statement    = []
        balance      = op_bal
        net_interest = 0.0
        net_days     = 0

        total_debit  = max(op_bal, 0.0)
        total_credit = max(-op_bal, 0.0)

        statement.append({
            'Tran_Type':     'OP',
            'Date':          from_date.strftime('%d/%m/%Y'),
            'Debit_Amount':  round(op_bal,  2) if op_bal > 0 else 0.0,
            'Credit_Amount': round(-op_bal, 2) if op_bal < 0 else 0.0,
            'Balance':       abs(round(op_bal, 2)),
            'Bal_DC':        'Dr' if op_bal >= 0 else 'Cr',
            'Days':          0,
            'Interest':      0.0,
            'Int_DC':        ''
        })

        n = len(transactions)
        for i, txn in enumerate(transactions):
            txn_date = txn.DOC_DATE
            if isinstance(txn_date, str):
                txn_date = datetime.strptime(txn_date, "%Y-%m-%d").date()

            debit  = float(txn.AMOUNT) if txn.DRCR == 'D' else 0.0
            credit = float(txn.AMOUNT) if txn.DRCR == 'C' else 0.0

            total_debit  += debit
            total_credit += credit

            # balance AFTER this transaction
            balance += debit - credit

            next_date = None
            if i + 1 < n:
                next_date = transactions[i + 1].DOC_DATE
                if isinstance(next_date, str):
                    next_date = datetime.strptime(next_date, "%Y-%m-%d").date()

            if next_date == txn_date:
                # another txn lands same day -> this balance was held 0 days
                days = 0
                interest = 0.0
            else:

                boundary = next_date if next_date else (to_date + timedelta(days=1))
                days = (boundary - txn_date).days
                interest = round((days * (balance * int_rate) / int_days) / 100, 2)

            net_interest += interest
            net_days     += days

            statement.append({
                'Tran_Type':     txn.TRAN_TYPE,
                'Date':          txn_date.strftime('%d/%m/%Y'),
                'Debit_Amount':  debit,
                'Credit_Amount': credit,
                'Balance':       abs(round(balance, 2)),
                'Bal_DC':        'Dr' if balance >= 0 else 'Cr',
                'Days':          days,
                'Interest':      abs(interest),
                'Int_DC':        'Dr' if interest >= 0 else 'Cr'
            })

        totals = {
            'Total_Debit':     round(total_debit,  2),
            'Total_Credit':    round(total_credit, 2),
            'Net_Days':        net_days,
            'Net_Interest':    abs(round(net_interest, 2)),
            'Net_Interest_DC': 'Dr' if net_interest >= 0 else 'Cr',
            'Net_Balance':     abs(round(balance, 2)),
            'Net_Balance_DC':  'Dr' if balance >= 0 else 'Cr',
        }

        return jsonify({'data': statement, 'totals': totals})

    except Exception as e:
        return jsonify({'error': str(e)}), 500