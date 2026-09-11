from app import db

class MonthTable(db.Model):
    __tablename__ = 'month_table'
    id = db.Column(db.Integer, primary_key = True, nullable= False)
    Doc_date = db.Column(db.Date, nullable= False)
    Month = db.Column(db.Integer, nullable= False)
    Year = db.Column(db.Numeric(18,2), nullable= True)
    dayqntl = db.Column( db.Numeric(18,2), nullable= True)
    average = db.Column(db.Numeric(18,2), nullable= True)
    monthlysale = db.Column(db.Numeric(18,2), nullable= True)
    target = db.Column(db.Numeric(18,2), nullable= True)
