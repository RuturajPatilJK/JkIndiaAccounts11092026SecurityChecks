from app import db
from datetime import datetime
import pytz

IST = pytz.timezone('Asia/Kolkata')

class TransferPayment(db.Model):
    __tablename__ = 'transfer_payments'
    
    id = db.Column(db.Integer, primary_key=True)
    
    requestUUID = db.Column(db.String(100), unique=True, nullable=False)
    serviceRequestId = db.Column(db.String(50), nullable=False)
    serviceRequestVersion = db.Column(db.String(10), nullable=False)
    channelId = db.Column(db.String(20), nullable=False)
    
    corpCode = db.Column(db.String(50), nullable=False)
    
    txnPaymode = db.Column(db.String(10), nullable=False)
    custUniqRef = db.Column(db.String(100), nullable=False)
    corpAccNum = db.Column(db.String(50), nullable=False)
    valueDate = db.Column(db.Date, nullable=False)
    txnAmount = db.Column(db.Numeric(18, 2), nullable=False)
    beneLEI = db.Column(db.String(50))
    beneName = db.Column(db.String(200), nullable=False)
    beneCode = db.Column(db.String(50))
    beneAccNum = db.Column(db.String(50), nullable=False)
    beneAcType = db.Column(db.String(10))
    beneAddr1 = db.Column(db.String(200))
    beneAddr2 = db.Column(db.String(200))
    beneAddr3 = db.Column(db.String(200))
    beneCity = db.Column(db.String(100))
    beneState = db.Column(db.String(100))
    benePincode = db.Column(db.String(20))
    beneIfscCode = db.Column(db.String(20), nullable=False)
    beneBankName = db.Column(db.String(200), nullable=False)
    baseCode = db.Column(db.String(50), default='')
    chequeNumber = db.Column(db.String(50), default='')
    chequeDate = db.Column(db.String(20), default='')
    payableLocation = db.Column(db.String(100), default='')
    printLocation = db.Column(db.String(100), default='')
    beneEmailAddr1 = db.Column(db.String(200))
    beneMobileNo = db.Column(db.String(20))
    productCode = db.Column(db.String(50), default='')
    txnType = db.Column(db.String(20))
    enrichment1 = db.Column(db.String(200), default='')
    enrichment2 = db.Column(db.String(200), default='')
    enrichment3 = db.Column(db.String(200), default='')
    enrichment4 = db.Column(db.String(200), default='')
    enrichment5 = db.Column(db.String(200), default='')
    senderToReceiverInfo = db.Column(db.Text, default='')
    
    invoiceAmount = db.Column(db.Numeric(18, 2))
    invoiceNumber = db.Column(db.String(100))
    invoiceDate = db.Column(db.String(20))
    cashDiscount = db.Column(db.String(20), default='0.00')
    tax = db.Column(db.String(20), default='0.00')
    netAmount = db.Column(db.String(20), default='0.00')
    invoiceInfo1 = db.Column(db.String(200), default='')
    invoiceInfo2 = db.Column(db.String(200), default='')
    invoiceInfo3 = db.Column(db.String(200), default='')
    invoiceInfo4 = db.Column(db.String(200), default='')
    invoiceInfo5 = db.Column(db.String(200), default='')
    
    checksum = db.Column(db.String(100))
    
    bankReferenceNo = db.Column(db.String(100))
    responseCode = db.Column(db.String(50))
    responseMessage = db.Column(db.Text)
    approvalNumber = db.Column(db.String(100))
    transactionDate = db.Column(db.DateTime)
    utrNumber = db.Column(db.String(100))
    status = db.Column(db.String(50))
    
    encryptedResponse = db.Column(db.Text)
    decryptedResponse = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(IST))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(IST), onupdate=lambda: datetime.now(IST))



class PaymentStatus(db.Model):
    __tablename__ = 'payment_statuses'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    requestUUID = db.Column(db.String(100), unique=True, nullable=False)
    
    channelId = db.Column(db.String(50))
    corpCode = db.Column(db.String(50))
    crn = db.Column(db.Text) 
    checksum = db.Column(db.String(100))
    encryptedRequest = db.Column(db.Text)

    encryptedResponse = db.Column(db.Text)
    decryptedResponse = db.Column(db.Text)
    
    responseMessage = db.Column(db.String(500))
    overallStatus = db.Column(db.String(10))
    
    errorMessage = db.Column(db.String(1000))
    responseChecksum = db.Column(db.String(100))
    
    corpCodeResponse = db.Column(db.String(50))
    statusDescription = db.Column(db.String(500))
    batchNo = db.Column(db.String(100))
    utrNo = db.Column(db.String(100))
    processingDate = db.Column(db.DateTime)
    responseCode = db.Column(db.String(50))
    crnResponse = db.Column(db.String(100))
    transactionStatus = db.Column(db.String(50)) 
    
    allTransactions = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(IST))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(IST), onupdate=lambda: datetime.now(IST))