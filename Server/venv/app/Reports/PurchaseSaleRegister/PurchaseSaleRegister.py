from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
from flask import Flask, jsonify, request
from flask_mail import Mail, Message
import os

API_URL = os.getenv('API_URL')

def format_dates(task):
    return {
        "Inv_date": task['Inv_date'].strftime('%d-%m-%y') if task['Inv_date'] else None,
        #  "date": task['date'].strftime('%Y-%m-%d') if task['date'] else None,
    }

@app.route(API_URL+'/SaleTDS_Register', methods=['GET'])
def SaleTDS_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('toDate')
        CompanyCode=request.args.get('companyCode')
        YearCode=request.args.get('YearCode')
        acCode=request.args.get('acCode')

        print(from_date)
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            if(acCode == ''):
                query = db.session.execute(text('''
                    select isnull(Pan,'') as Pan,isnull([Name Of Party],'') as Name_Of_Party ,Taxable_Amt,CGST,SGST,IGST,Bill_Amount,TDS_Amt,Party_Code,Inv_date,InvoiceNo from qryTCSSaleUnion where Inv_date between :from_date and :to_date
                                                and  IsDeleted!=0  and  Company_Code=:CompanyCode and Year_Code= :Year_Code order by Doc_No asc
                '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : YearCode,'CompanyCode' :CompanyCode})
            else:
                 query = db.session.execute(text('''
                    select isnull(Pan,'') as Pan,isnull([Name Of Party],'') as Name_Of_Party ,Taxable_Amt,CGST,SGST,IGST,Bill_Amount,TDS_Amt,Party_Code,Inv_date,InvoiceNo from qryTCSSaleUnion where Inv_date between :from_date and :to_date
                                                and  IsDeleted!=0  and  Company_Code=:CompanyCode and Year_Code= :Year_Code and Party_Code= :acCode order by Doc_No asc
                '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : YearCode,'CompanyCode' :CompanyCode,'acCode' : acCode})
          
            result = query.fetchall()

        response = []
        for row in result:
            row_dict = row._asdict()
            formatted_dates = format_dates(row_dict)
            row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL+'/SaleTCS_Register', methods=['GET'])
def SaleTCS_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('toDate')
        CompanyCode=request.args.get('companyCode')
        YearCode=request.args.get('YearCode')
        acCode=request.args.get('acCode')

        print(from_date)
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            if(acCode == ''):
                query = db.session.execute(text('''
                    select isnull(Pan,'') as Pan,isnull([Name Of Party],'') as Name_Of_Party  ,Taxable_Amt,CGST,SGST,IGST,Bill_Amount,TCS,Party_Code,Inv_date,InvoiceNo from qryTCSSaleUnion where Inv_date between :from_date and :to_date
                                                and TCS !=0 and IsDeleted!=0  and  Company_Code=:CompanyCode and Year_Code= :Year_Code
                '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : YearCode,'CompanyCode' :CompanyCode})
            else:
                 query = db.session.execute(text('''
                    select isnull(Pan,'') as Pan,isnull([Name Of Party],'') as Name_Of_Party  ,Taxable_Amt,CGST,SGST,IGST,Bill_Amount,TCS,Party_Code,Inv_date,InvoiceNo from qryTCSSaleUnion where Inv_date between :from_date and :to_date
                                                and TCS !=0 and IsDeleted!=0  and  Company_Code=:CompanyCode and Year_Code= :Year_Code and Party_Code= :acCode
                '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : YearCode,'CompanyCode' :CompanyCode,'acCode' : acCode})
          
            result = query.fetchall()

        response = []
        for row in result:
            row_dict = row._asdict()
            formatted_dates = format_dates(row_dict)
            row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL+'/PurchaseTCS_Register', methods=['GET'])
def PurchaseTCS_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('toDate')
        CompanyCode=request.args.get('companyCode')
        YearCode=request.args.get('YearCode')
        acCode=request.args.get('acCode')

        print(from_date)
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            if(acCode == ''):
                query = db.session.execute(text('''
                   select isnull(Pan,'') as Pan,isnull([Name Of Party],'') as Name_Of_Party ,TCS ,Taxable_Amt,CGST,SGST,IGST,Bill_Amount,TCS,Party_Code,convert(varchar(10),date,103) as date,PSNo,Bill_No,dono from qryTCSPurchaseUnion where date between :from_date and :to_date
                                                and TCS !=0 and  Company_Code=:CompanyCode and Year_Code= :Year_Code
                '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : YearCode,'CompanyCode' :CompanyCode})
            else:
                 query = db.session.execute(text('''
                    select isnull(Pan,'') as Pan,isnull([Name Of Party],'') as Name_Of_Party ,TCS ,Taxable_Amt,CGST,SGST,IGST,Bill_Amount,TCS,Party_Code,convert(varchar(10),date,103) as date,PSNo,Bill_No,dono from qryTCSPurchaseUnion where date between :from_date and :to_date
                                                and TCS !=0  and  Company_Code=:CompanyCode and Year_Code= :Year_Code and Party_Code= :acCode
                '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : YearCode,'CompanyCode' :CompanyCode,'acCode' : acCode})
          
            result = query.fetchall()

        response = []
        for row in result:
            row_dict = row._asdict()
            # formatted_dates = format_dates(row_dict)
            # row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
@app.route(API_URL+'/PurchaseTDS_Register', methods=['GET'])
def PurchaseTDS_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('toDate')
        CompanyCode=request.args.get('companyCode')
        YearCode=request.args.get('YearCode')
        acCode=request.args.get('acCode')

        print(from_date)
        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            if(acCode == ''):
                query = db.session.execute(text('''
                    select isnull(Pan,'') as Pan,isnull([Name Of Party],'') as Name_Of_Party ,TDS_Amt,Taxable_Amt,CGST,SGST,IGST,Bill_Amount,TCS,Party_Code,convert(varchar(10),date,103) as date,PSNo,Bill_No,dono from qryTCSPurchaseUnion where date between :from_date and :to_date
                                                and  Company_Code=:CompanyCode and Year_Code= :Year_Code order by Doc_No asc
                '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : YearCode,'CompanyCode' :CompanyCode})
            else:
                 query = db.session.execute(text('''
                    select isnull(Pan,'') as Pan,isnull([Name Of Party],'') as Name_Of_Party ,TDS_Amt ,Taxable_Amt,CGST,SGST,IGST,Bill_Amount,TCS,Party_Code,convert(varchar(10),date,103) as date,PSNo,Bill_No,dono from qryTCSPurchaseUnion where date between :from_date and :to_date
                                                and  Company_Code=:CompanyCode and Year_Code= :Year_Code and Party_Code= :acCode order by Doc_No asc
                '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : YearCode,'CompanyCode' :CompanyCode,'acCode' : acCode})
          
            result = query.fetchall()

        response = []
        for row in result:
            row_dict = row._asdict()
            # formatted_dates = format_dates(row_dict)
            # row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500    

@app.route(API_URL + '/Purchase_Register', methods=['GET'])
def Purchase_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode = request.args.get('Year_code')
        acCode = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
            SELECT * FROM qrypurchasehead 
            WHERE doc_date BETWEEN :from_date AND :to_date
            AND Company_Code = :CompanyCode 
            AND Year_Code = :YearCode
        '''
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        if acCode:  # Only add Ac_Code if it's provided
            query_str += " AND Ac_Code = :acCode"
            params['acCode'] = acCode

        with db.session.begin():
            result = db.session.execute(text(query_str), params).fetchall()

        response = [dict(row._asdict()) for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    

@app.route(API_URL + '/Purchase_Register_Tally', methods=['GET'])
def Purchase_Register_Tally():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode = request.args.get('Year_code')
        acCode = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
           WITH base AS (
    SELECT
        doc_no, doc_date, Bill_Amount, NETQNTL, Company_Code, Year_Code, Bill_No,
        CGSTAmount, SGSTAmount, IGSTAmount, EWay_Bill_No,
        suppliername, suppliergstno, gstrate, Purcid, CompanyPan, subTotal,
        grp_pan = COALESCE(NULLIF(LTRIM(RTRIM(CompanyPan)), ''), CONCAT('NO_PAN|', doc_no))
    FROM dbo.qrypurchasehead
   WHERE doc_date BETWEEN :from_date AND :to_date
            AND Company_Code = :CompanyCode 
            AND Year_Code = :YearCode
),
x AS (
    SELECT
        *,
        first_doc_no        = FIRST_VALUE(doc_no)        OVER (PARTITION BY grp_pan ORDER BY doc_date, doc_no),
        first_doc_date      = FIRST_VALUE(doc_date)      OVER (PARTITION BY grp_pan ORDER BY doc_date, doc_no),
        first_bill_no       = FIRST_VALUE(Bill_No)       OVER (PARTITION BY grp_pan ORDER BY doc_date, doc_no),
        first_eway_bill_no  = FIRST_VALUE(EWay_Bill_No)  OVER (PARTITION BY grp_pan ORDER BY doc_date, doc_no),
        first_suppliername  = FIRST_VALUE(suppliername)  OVER (PARTITION BY grp_pan ORDER BY doc_date, doc_no),
        first_suppliergstno = FIRST_VALUE(suppliergstno) OVER (PARTITION BY grp_pan ORDER BY doc_date, doc_no),
        first_gstrate       = FIRST_VALUE(gstrate)       OVER (PARTITION BY grp_pan ORDER BY doc_date, doc_no),
        first_purcid        = FIRST_VALUE(Purcid)        OVER (PARTITION BY grp_pan ORDER BY doc_date, doc_no),
        first_companypan    = FIRST_VALUE(CompanyPan)    OVER (PARTITION BY grp_pan ORDER BY doc_date, doc_no),
        first_company_code  = FIRST_VALUE(Company_Code)  OVER (PARTITION BY grp_pan ORDER BY doc_date, doc_no),
        first_year_code     = FIRST_VALUE(Year_Code)     OVER (PARTITION BY grp_pan ORDER BY doc_date, doc_no)
    FROM base
)
SELECT
    doc_no       = MAX(first_doc_no),
    doc_date     = MAX(first_doc_date),
    Company_Code = MAX(first_company_code),
    Year_Code    = MAX(first_year_code),
    Bill_No      = MAX(first_bill_no),
    EWay_Bill_No = MAX(first_eway_bill_no),
    suppliername = MAX(first_suppliername),
    suppliergstno= MAX(first_suppliergstno),
    gstrate      = MAX(first_gstrate),
    Purcid       = MAX(first_purcid),
    CompanyPan   = MAX(first_companypan),

    NETQNTL     = SUM(NETQNTL),
    subTotal    = SUM(subTotal),
    CGSTAmount  = SUM(CGSTAmount),
    SGSTAmount  = SUM(SGSTAmount),
    IGSTAmount  = SUM(IGSTAmount),
    Bill_Amount = SUM(Bill_Amount),

    EntryCount = COUNT(*)
FROM x
GROUP BY grp_pan
ORDER BY suppliername;


        '''
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        if acCode:  # Only add Ac_Code if it's provided
            query_str += " AND Ac_Code = :acCode"
            params['acCode'] = acCode

        with db.session.begin():
            result = db.session.execute(text(query_str), params).fetchall()

        response = [dict(row._asdict()) for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL + '/Sale_Register', methods=['GET'])
def Sale_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode = request.args.get('Year_code')
        acCode = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
            SELECT * FROM qrysalehead 
            WHERE doc_date BETWEEN :from_date AND :to_date
            AND Company_Code = :CompanyCode 
            AND Year_Code = :YearCode AND IsDeleted != 0
        '''
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        if acCode:  
            query_str += " AND Ac_Code = :acCode"
            params['acCode'] = acCode

        query_str += " ORDER BY doc_date,doc_no" 

        with db.session.begin():
            result = db.session.execute(text(query_str), params).fetchall()

        response = [dict(row._asdict()) if hasattr(row, '_asdict') else dict(row) for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    

@app.route(API_URL + '/PurchaseReturn_Register', methods=['GET'])
def PurchaseReturn_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode = request.args.get('Year_code')
        acCode = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
            SELECT * FROM qrysugarpurchasereturnhead 
            WHERE doc_date BETWEEN :from_date AND :to_date
            AND Company_Code = :CompanyCode 
            AND Year_Code = :YearCode
        '''
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        if acCode:  
            query_str += " AND Ac_Code = :acCode"
            params['acCode'] = acCode

        query_str += " ORDER BY doc_date,doc_no" 

        with db.session.begin():
            result = db.session.execute(text(query_str), params).fetchall()

        response = [dict(row._asdict()) if hasattr(row, '_asdict') else dict(row) for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL + '/SaleReturnSale_Register', methods=['GET'])
def SaleReturnSale_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode = request.args.get('Year_code')
        acCode = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
            SELECT * FROM qrysugarsalereturnhead 
            WHERE doc_date BETWEEN :from_date AND :to_date
            AND Company_Code = :CompanyCode 
            AND Year_Code = :YearCode
        '''
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        if acCode: 
            query_str += " AND Ac_Code = :acCode"
            params['acCode'] = acCode

        query_str += " ORDER BY doc_date,doc_no" 

        with db.session.begin():
            result = db.session.execute(text(query_str), params).fetchall()

        response = [dict(row._asdict()) if hasattr(row, '_asdict') else dict(row) for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL + '/MillSaleReport_Register', methods=['GET'])
def MillSaleReport_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode = request.args.get('Year_code')
        acCode = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
            SELECT * FROM qrysaleheaddetail 
            WHERE doc_date BETWEEN :from_date AND :to_date
            AND Company_Code = :CompanyCode and IsDeleted !='0'
            AND Year_Code = :YearCode
        '''
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        if acCode: 
            query_str += " AND mill_code = :acCode"
            params['acCode'] = acCode

        query_str += " ORDER BY doc_date" 

        with db.session.begin():
            result = db.session.execute(text(query_str), params).fetchall()

        response = [dict(row._asdict()) if hasattr(row, '_asdict') else dict(row) for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

# @app.route(API_URL + '/MonthSaleWise_Register', methods=['GET'])
# def MonthSaleWise_Register():
#     try:
#         from_date = request.args.get('from_date')
#         to_date = request.args.get('to_date')
#         CompanyCode = request.args.get('Company_Code')
#         YearCode = request.args.get('Year_code')
#         acCode = request.args.get('acCode')

#         if not from_date or not to_date:
#             return jsonify({'error': 'from_date and to_date are required'}), 400

#         query_str = '''
#            select YEAR(dbo.nt_1_sugarsale.doc_date) AS yr, MONTH(dbo.nt_1_sugarsale.doc_date) AS mn, 
#            dbo.nt_1_sugarsale.Company_Code, dbo.nt_1_sugarsale.Year_Code, 
#            ISNULL(SUM(dbo.nt_1_sugarsaledetails.Quantal), 0) AS qntl, 
#            ISNULL(SUM(dbo.nt_1_sugarsaledetails.item_Amount), 0) AS itmamount 
#            FROM dbo.nt_1_sugarsale INNER JOIN  dbo.nt_1_sugarsaledetails ON 
#            dbo.nt_1_sugarsale.saleid = dbo.nt_1_sugarsaledetails.saleid 
#            where dbo.nt_1_sugarsale.doc_date  between :from_date and :to_date and  
#            nt_1_sugarsale.Company_Code= :CompanyCode and nt_1_sugarsale.Year_Code= :YearCode  
#            GROUP BY dbo.nt_1_sugarsale.Company_Code, dbo.nt_1_sugarsale.Year_Code, 
#            YEAR(dbo.nt_1_sugarsale.doc_date), MONTH(dbo.nt_1_sugarsale.doc_date)
#         '''
#         params = {
#             'from_date': from_date,
#             'to_date': to_date,
#             'CompanyCode': CompanyCode,
#             'YearCode': YearCode
#         }

#         # if acCode:  # Only add Ac_Code if it's provided
#         #     query_str += " AND mill_code = :acCode"
#         #     params['acCode'] = acCode

#         #query_str += " ORDER BY doc_date"  # Ensure ORDER BY is added at the end

#         with db.session.begin():
#             result = db.session.execute(text(query_str), params).fetchall()

#         response = [dict(row._asdict()) if hasattr(row, '_asdict') else dict(row) for row in result]

#         return jsonify(response)

#     except SQLAlchemyError as error:
#         print("Error fetching data:", error)
#         db.session.rollback()
#         return jsonify({'error': 'Internal server error'}), 500

# @app.route(API_URL + '/PurchaseMonthWise_Register', methods=['GET'])
# def PurchaseMonthWise_Register():
#     try:
#         from_date = request.args.get('from_date')
#         to_date = request.args.get('to_date')
#         CompanyCode = request.args.get('Company_Code')
#         YearCode = request.args.get('Year_code')
#         acCode = request.args.get('acCode')

#         if not from_date or not to_date:
#             return jsonify({'error': 'from_date and to_date are required'}), 400

#         query_str = '''
#            SELECT dbo.nt_1_sugarpurchase.Company_Code, dbo.nt_1_sugarpurchase.Year_Code,
#              YEAR(dbo.nt_1_sugarpurchase.doc_date) AS yr, MONTH(dbo.nt_1_sugarpurchase.doc_date) AS mn,
#              ISNULL(SUM(dbo.nt_1_sugarpurchasedetails.Quantal), 0) AS qntl, 
#              ISNULL(SUM(dbo.nt_1_sugarpurchasedetails.item_Amount), 0) AS itemamt 
#              FROM dbo.nt_1_sugarpurchase INNER JOIN dbo.nt_1_sugarpurchasedetails ON  
#              dbo.nt_1_sugarpurchase.purchaseid = dbo.nt_1_sugarpurchasedetails.purchaseid  
#              where dbo.nt_1_sugarpurchase.doc_date  between :from_date and :to_date 
#              and  dbo.nt_1_sugarpurchase.Company_Code= :CompanyCode and dbo.nt_1_sugarpurchase.Year_Code= :YearCode  
#              GROUP BY dbo.nt_1_sugarpurchase.Company_Code, dbo.nt_1_sugarpurchase.Year_Code, 
#              YEAR(dbo.nt_1_sugarpurchase.doc_date), MONTH(dbo.nt_1_sugarpurchase.doc_date)
#         '''
#         params = {
#             'from_date': from_date,
#             'to_date': to_date,
#             'CompanyCode': CompanyCode,
#             'YearCode': YearCode
#         }

#         # if acCode:  # Only add Ac_Code if it's provided
#         #     query_str += " AND mill_code = :acCode"
#         #     params['acCode'] = acCode

#         #query_str += " ORDER BY doc_date"  # Ensure ORDER BY is added at the end

#         with db.session.begin():
#             result = db.session.execute(text(query_str), params).fetchall()

#         response = [dict(row._asdict()) if hasattr(row, '_asdict') else dict(row) for row in result]

#         return jsonify(response)

#     except SQLAlchemyError as error:
#         print("Error fetching data:", error)
#         db.session.rollback()
#         return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL + '/MonthSaleWise_Register', methods=['GET'])
def MonthSaleWise_Register():
    try:
        from_date   = request.args.get('from_date')
        to_date     = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode    = request.args.get('Year_code')
        acCode      = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
        WITH all_tran AS (
          SELECT 
            CAST(YEAR(s.doc_date) AS INT) AS yr, 
            CAST(MONTH(s.doc_date) AS INT) AS mn, 
            s.Company_Code,
            s.Year_Code,
            s.NETQNTL       AS qntl,
           s.TaxableAmount AS amt, 'SB' AS tran_type
          FROM            dbo.nt_1_sugarsale AS s
          WHERE s.doc_date BETWEEN :from_date AND :to_date AND s.IsDeleted != 0
            AND s.Company_Code = :CompanyCode
            AND s.Year_Code    = :YearCode

          UNION ALL

          SELECT
            CAST(YEAR(dh.doc_date) AS INT) AS yr,
            CAST(MONTH(dh.doc_date) AS INT) AS mn,
            dh.Company_Code,
            dh.Year_Code,
            dd.Quantal      AS qntl,
            dd.value        AS amt,
            dh.tran_type    AS tran_type
          FROM debitnotehead dh
          JOIN debitnotedetail dd 
            ON dh.dcid = dd.dcid
          WHERE dh.tran_type IN ('DN','CN')
            AND dh.doc_date BETWEEN :from_date AND :to_date
            AND dh.Company_Code = :CompanyCode
            AND dh.Year_Code    = :YearCode
            
        )
        SELECT
          yr,
          mn,
          Company_Code,
          Year_Code,
          SUM(CASE WHEN tran_type = 'SB' THEN qntl ELSE 0 END) AS SB_qntl,
          SUM(CASE WHEN tran_type = 'DN' THEN qntl ELSE 0 END) AS DN_qntl,
          SUM(CASE WHEN tran_type = 'CN' THEN qntl ELSE 0 END) AS CN_qntl,
          SUM(CASE WHEN tran_type = 'SB' THEN qntl ELSE 0 END)
          + SUM(CASE WHEN tran_type = 'DN' THEN qntl ELSE 0 END)
          - SUM(CASE WHEN tran_type = 'CN' THEN qntl ELSE 0 END) AS net_qntl,
          SUM(CASE WHEN tran_type = 'SB' THEN amt ELSE 0 END) AS SB_amt,
          SUM(CASE WHEN tran_type = 'DN' THEN amt ELSE 0 END) AS DN_amt,
          SUM(CASE WHEN tran_type = 'CN' THEN amt ELSE 0 END) AS CN_amt,
          SUM(CASE WHEN tran_type = 'SB' THEN amt ELSE 0 END)
          + SUM(CASE WHEN tran_type = 'DN' THEN amt ELSE 0 END)
          - SUM(CASE WHEN tran_type = 'CN' THEN amt ELSE 0 END) AS net_amt
        FROM all_tran
        GROUP BY yr, mn, Company_Code, Year_Code
        ORDER BY yr, mn
        '''

        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        with db.session.begin():
            rows = db.session.execute(text(query_str), params).mappings().all()

        response = [dict(row) for row in rows]
        return jsonify(response)

    except SQLAlchemyError as error:
        app.logger.error("Error fetching MonthSaleWise_Register: %s", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL + '/PurchaseMonthWise_Register', methods=['GET'])
def PurchaseMonthWise_Register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode = request.args.get('Year_code')
        acCode = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
        WITH all_tran AS (
            SELECT 
                CAST(YEAR(p.doc_date) AS INT) AS yr,
                CAST(MONTH(p.doc_date) AS INT) AS mn,
                p.Company_Code,
                p.Year_Code,
                d.Quantal AS qntl,
                d.item_Amount AS amt,
                'PS' AS tran_type
            FROM dbo.nt_1_sugarpurchase p
            JOIN dbo.nt_1_sugarpurchasedetails d ON p.purchaseid = d.purchaseid
            WHERE p.doc_date BETWEEN :from_date AND :to_date
              AND p.Company_Code = :CompanyCode
              AND p.Year_Code = :YearCode

            UNION ALL

            SELECT 
                CAST(YEAR(dh.doc_date) AS INT) AS yr,
                CAST(MONTH(dh.doc_date) AS INT) AS mn,
                dh.Company_Code,
                dh.Year_Code,
                dd.Quantal AS qntl,
                dd.value AS amt,
                dh.tran_type
            FROM dbo.debitnotehead dh
            JOIN dbo.debitnotedetail dd ON dh.dcid = dd.dcid
            WHERE dh.tran_type IN ('DS', 'CS')
              AND dh.doc_date BETWEEN :from_date AND :to_date
              AND dh.Company_Code = :CompanyCode
              AND dh.Year_Code = :YearCode
              AND dd.Quantal <> 0
        )
        SELECT
            yr,
            mn,
            Company_Code,
            Year_Code,
            SUM(CASE WHEN tran_type = 'PS' THEN qntl ELSE 0 END) AS PS_qntl,
            SUM(CASE WHEN tran_type = 'DS' THEN qntl ELSE 0 END) AS DS_qntl,
            SUM(CASE WHEN tran_type = 'CS' THEN qntl ELSE 0 END) AS CS_qntl,
            SUM(CASE WHEN tran_type = 'PS' THEN qntl ELSE 0 END)
            + SUM(CASE WHEN tran_type = 'DS' THEN qntl ELSE 0 END)
            - SUM(CASE WHEN tran_type = 'CS' THEN qntl ELSE 0 END) AS net_qntl,
            SUM(CASE WHEN tran_type = 'PS' THEN amt ELSE 0 END) AS PS_amt,
            SUM(CASE WHEN tran_type = 'DS' THEN amt ELSE 0 END) AS DS_amt,
            SUM(CASE WHEN tran_type = 'CS' THEN amt ELSE 0 END) AS CS_amt,
            SUM(CASE WHEN tran_type = 'PS' THEN amt ELSE 0 END)
            + SUM(CASE WHEN tran_type = 'DS' THEN amt ELSE 0 END)
            - SUM(CASE WHEN tran_type = 'CS' THEN amt ELSE 0 END) AS net_amt
        FROM all_tran
        GROUP BY yr, mn, Company_Code, Year_Code
        ORDER BY yr, mn
        '''

        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        with db.session.begin():
            rows = db.session.execute(text(query_str), params).mappings().all()

        response = [dict(row) for row in rows]
        return jsonify(response)

    except SQLAlchemyError as error:
        app.logger.error("Error fetching PurchaseMonthWise_Register: %s", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL + '/RCM_register', methods=['GET'])
def RCM_register():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        CompanyCode = request.args.get('Company_Code')
        YearCode = request.args.get('Year_code')
        acCode = request.args.get('acCode')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        query_str = '''
            SELECT * FROM qryRCM 
            WHERE doc_date BETWEEN :from_date AND :to_date
            AND Company_Code = :CompanyCode 
            AND Year_Code = :YearCode
        '''
        params = {
            'from_date': from_date,
            'to_date': to_date,
            'CompanyCode': CompanyCode,
            'YearCode': YearCode
        }

        # if acCode:  # Only add Ac_Code if it's provided
        #     query_str += " AND mill_code = :acCode"
        #     params['acCode'] = acCode

        #query_str += " ORDER BY doc_date"  # Ensure ORDER BY is added at the end

        with db.session.begin():
            result = db.session.execute(text(query_str), params).fetchall()

        response = [dict(row._asdict()) if hasattr(row, '_asdict') else dict(row) for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
