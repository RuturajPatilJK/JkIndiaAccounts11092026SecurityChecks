from sqlalchemy import text
from app import app, db

def get_match_status(ac_code, company_code, year_code):
    try:
        sql_query = text("""
            SELECT CASE WHEN c.GSTStateCode = a.GSTStateCode THEN 'TRUE' ELSE 'FALSE' END AS match_status
            FROM dbo.nt_1_companyparameters AS c
            INNER JOIN dbo.nt_1_accountmaster AS a ON c.Company_Code = a.company_code
            WHERE a.Ac_Code = :ac_code AND a.company_code = :company_code AND c.Year_Code = :year_code
        """)

        result = db.session.execute(sql_query, {
            'ac_code': ac_code,
            'company_code': company_code,
            'year_code': year_code
        })

        match_status = result.scalar()

        return match_status

    except Exception as e:
        return str(e)