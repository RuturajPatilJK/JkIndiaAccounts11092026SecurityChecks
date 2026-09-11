import React, { useEffect, useState, useRef } from 'react';

const apiKey = process.env.REACT_APP_API;
const whatsAPPID = process.env.REACT_APP_WHATSAPPID;
const whatsAppToken = process.env.REACT_APP_WHATSAPPTOKEN;

const PdfPreview = ({ pdfData, apiData, label, ewayBillNo }) => {
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [isWhatsAppLoading, setIsWhatsAppLoading] = useState(false);
  const pdfWindowRef = useRef(null);
  const pdfNameRef = useRef('');

  //update the e-way bill status
  const updateEWBStatus = (ewbNo, query_label) => {
    return fetch(`${apiKey}/update-ewb-status?ewbNo=${ewbNo}&query_label=${query_label}`, {
      method: 'POST',
    })
      .then((response) => response.json())
      .then((data) => {
        return data;
      })
      .catch((error) => {
        console.error('Error updating e-way bill status:', error);
        throw error;
      });
  };



  useEffect(() => {
    if (!pdfWindowRef.current || pdfWindowRef.current.closed) {
      const pdfWindow = window.open('', '_blank');

      if (!pdfWindow) {
        alert('Popup blocked! Please allow popups for this website.');
        return;
      }

      let subject = '';
      let body = '';
      let pdfname = '';

      if (label === 'SaleBill') {
        subject = `Bill No: ${apiData?.doc_no} Lorry No: ${apiData?.LORRYNO} Mill Name: ${apiData?.millname} Get Pass: ${apiData?.billtoname}`;
        body = "Sale Bill";
        pdfname = `SaleBill_${apiData?.doc_no} - ${apiData?.LORRYNO}`;
        pdfNameRef.current = pdfname;
        setPdfName(pdfname);
      }
      if (label === 'EwayBill') {
        subject = `EWayBill NO: ${apiData.EWay_Bill_No} Bill No: ${apiData?.doc_no} Lorry No: ${apiData?.LORRYNO} Mill Name: ${apiData?.millname} Get Pass: ${apiData?.Buyer_Name}`;
        body = "Eway Bill";
        pdfname = `EWayBill_${apiData?.doc_no} - ${apiData?.LORRYNO}`;
        pdfNameRef.current = pdfname;
        setPdfName(pdfname);
      }
console.log(pdfname)
      pdfWindow.document.write(`
<html>
                    <head>
                        <title>PDF Preview</title>
                        <style>
                            .top-row { display: flex; gap: 5px; margin: 5px; flex-wrap: wrap; }
                            .top-row input, .top-row button { padding: 1px; font-size: 12px; width: 160px; }
                            .top-row button { padding: 4px 8px; font-size: 10px; cursor: pointer; position: relative; width: 80px; }
                            .top-row button[disabled] { cursor: not-allowed; }
                            .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 16px; height: 16px; animation: spin 2s linear infinite; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: none; }
                            .top-row button.loading .spinner { display: block; }
                            .embed-container { margin-top: 10px; }
                            .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 999; display: none; }
                            .overlay.show { display: block; }
                            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                            .message { text-align: center; margin-top: 10px; font-size: 14px; }
                            .message.error { color: red; }
                        </style>
                    </head>
                    <body>
                        <div class="overlay"></div>
                        <div class="top-row">
                            <button id="emailButton">All Email<div class="spinner"></div></button>
                            <input type="email" placeholder="Enter email address" id="emailInput" />
                            <button id="billToEmailButton">Sale Email<div class="spinner"></div></button>
                            <input type="email" placeholder="Enter email address" id="billToMailInput" />
                            <button id="tranToEmailButton">Tran Email<div class="spinner"></div></button>
                            <input type="email" placeholder="Enter email address" id="tranMailInput" />
                            <button id="refEmailButton">Ref Email<div class="spinner"></div></button>
                            <input type="email" placeholder="Enter email address" id="refMailInput" />
                        </div>
                        <div class="top-row">
                            <button id="salebilltobutton">Sale Bill To<div class="spinner"></div></button>
                            <input type="tel" placeholder="Sale Bill To" id="salebilltoInput" />
                            <button id="transportbutton">Transport<div class="spinner"></div></button>
                            <input type="tel" placeholder="Transport" id="transportInput" />
                            <button id="driverbutton">Driver<div class="spinner"></div></button>
                            <input type="tel" placeholder="Driver Number" id="driverInput" />
                            <button id="refrebybutton">Refer by<div class="spinner"></div></button>
                            <input type="tel" placeholder="Enter Ref by number" id="referbyInput" />
                            <button id="shippedtobutton">Shipped To<div class="spinner"></div></button>
                            <input type="tel" placeholder="Shippped To" id="shippedToInput" />
                            <button id="whatsappButton">All WhatsApp<div class="spinner"></div></button>
                            <input type="tel" placeholder="Enter WhatsApp number" id="whatsappInput" />
                        </div>
                        <div class="embed-container">
                            <embed src="${pdfData}" width="100%" height="100%" />
                        </div>
                        <div class="message"></div>
                    </body>
                </html>
      `);
      pdfWindow.document.close();

      pdfWindow.onload = () => {
        const emailButton = pdfWindow.document.getElementById('emailButton');
        const emailInput = pdfWindow.document.getElementById('emailInput');
        const billToEmailButton = pdfWindow.document.getElementById('billToEmailButton');
        const billToMailInput = pdfWindow.document.getElementById('billToMailInput');
        const tranToEmailButton = pdfWindow.document.getElementById('tranToEmailButton');
        const tranMailInput = pdfWindow.document.getElementById('tranMailInput');
        const refEmailButton = pdfWindow.document.getElementById('refEmailButton');
        const refMailInput = pdfWindow.document.getElementById('refMailInput');
        const whatsappButton = pdfWindow.document.getElementById('whatsappButton');
        const whatsappInput = pdfWindow.document.getElementById('whatsappInput');
        const refrebybutton = pdfWindow.document.getElementById('refrebybutton');
        const referbyInput = pdfWindow.document.getElementById('referbyInput');
        const transportbutton = pdfWindow.document.getElementById('transportbutton');
        const transportInput = pdfWindow.document.getElementById('transportInput');
        const driverbutton = pdfWindow.document.getElementById('driverbutton');
        const driverInput = pdfWindow.document.getElementById('driverInput');
        const shippedtobutton = pdfWindow.document.getElementById('shippedtobutton');
        const shippedToInput = pdfWindow.document.getElementById('shippedToInput');
        const salebilltobutton = pdfWindow.document.getElementById('salebilltobutton');
        const salebilltoInput = pdfWindow.document.getElementById('salebilltoInput');
        const overlay = pdfWindow.document.querySelector('.overlay');
        const messageDiv = pdfWindow.document.querySelector('.message');

        if (apiData && apiData.Buyer_Email_Id) {
          emailInput.value = apiData.Buyer_Email_Id.trim();
          messageDiv.textContent = `${apiData.doc_no} - ${apiData.LORRYNO}`;
        }

        const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        emailInput.value = [
          apiData.billtoemail,
          apiData.shiptoemail,
          apiData.CarporateBillToEmailID,
          apiData.RefMail,
          apiData.TransportEmail
        ].filter(email => email && email.trim()).join(', ');
        
        



        emailButton.addEventListener('click', () => {
          const emails = emailInput.value.trim();
          
          // Validate emails
          if (!emails) {
              setEmailError('Email addresses are required.');
              return;
          } else {
              // Split the emails by comma and trim whitespace
              const emailArray = emails.split(',').map(email => email.trim());
              const invalidEmails = emailArray.filter(email => !validateEmail(email));
      
              if (invalidEmails.length > 0) {
                  setEmailError('Please enter valid email addresses.');
                  return;
              } else {
                  setEmailError('');
              }
          }
      
          // Disable buttons and show overlay
          overlay.classList.add('show');
          emailButton.disabled = true;
          whatsappButton.disabled = true;
          refrebybutton.disabled = true;
          transportbutton.disabled = true;
          driverbutton.disabled = true;
          shippedtobutton.disabled = true;
          salebilltobutton.disabled = true;
          billToEmailButton.disabled = true;
          tranToEmailButton.disabled = true;
          refEmailButton.disabled = true;
          emailButton.classList.add('loading');
          setLoading(true);
      
          // Fetch the PDF blob
          fetch(pdfData)
              .then((res) => res.blob())
              .then((pdfBlob) => {
                  const formData = new FormData();
                  formData.append('pdf', pdfBlob, `${pdfNameRef.current}.pdf`);
                  formData.append('email', emails);  // Send all emails as a comma-separated string
                  formData.append('message', subject);
                  formData.append('messagebody', body);
                  formData.append('ewbNo', ewayBillNo);
                  formData.append('query_label', label);
      
                  // Sending email request
                  fetch(`${apiKey}/send-pdf-email-onlineportal`, {
                      method: 'POST',
                      body: formData,
                  })
                  .then((response) => {
                      if (!response.ok) {
                          throw new Error('Failed to send email');
                      }
                      return response.json();
                  })
                  .then((data) => {
                      // Success handling
                      if (pdfWindow) {
                          pdfWindow.alert('Emails sent successfully!');
                      } else {
                          alert('Emails sent successfully!');
                      }
                  })
                  .catch((error) => {
                      // Error handling
                      alert('Error sending emails.');
                      console.error('Error sending emails:', error);
                  })
                  .finally(() => {
                      // Reset buttons and state after processing
                      setLoading(false);
                      emailButton.classList.remove('loading');
                      emailButton.disabled = false;
                      whatsappButton.disabled = false;
                      transportbutton.disabled = false;
                      driverbutton.disabled = false;
                      refrebybutton.disabled = false;
                      shippedtobutton.disabled = false;
                      salebilltobutton.disabled = false;
                      billToEmailButton.disabled = false;
          tranToEmailButton.disabled = false;
          refEmailButton.disabled = false;
                      overlay.classList.remove('show');
                  });
              })
              .catch((error) => {
                  // Fetch error handling
                  console.error('Failed to fetch PDF blob:', error);
                  alert('Error fetching PDF.');
                  messageDiv.textContent = 'Error fetching PDF.';
                  messageDiv.classList.remove('success');
                  messageDiv.classList.add('error');
                  emailButton.classList.remove('loading');
                  emailButton.disabled = false;
                  whatsappButton.disabled = false;
                  refrebybutton.disabled = false;
                  transportbutton.disabled = false;
                  driverbutton.disabled = false;
                  shippedtobutton.disabled = false;
                  salebilltobutton.disabled = false;
                  billToEmailButton.disabled = false;
          tranToEmailButton.disabled = false;
          refEmailButton.disabled = false;
                  overlay.classList.remove('show');
              });
      });
      
      billToMailInput.value = [apiData.CarporateSaleNo ? apiData.CarporateBillToEmailID : apiData.billtoemail || ''].filter(email => email && email.trim()).join(', ');
      billToEmailButton.addEventListener('click', () => {
        console.log("Email button clicked");
        const emails = billToMailInput.value.trim();
        // Validate emails
        if (!emails) {
            setEmailError('Email addresses are required.');
            return;
        } else {
            // Split the emails by comma and trim whitespace
            const emailArray = emails.split(',').map(email => email.trim());
            const invalidEmails = emailArray.filter(email => !validateEmail(email));
    
            if (invalidEmails.length > 0) {
                setEmailError('Please enter valid email addresses.');
                return;
            } else {
                setEmailError('');
            }
        }
    
        // Disable buttons and show overlay
        overlay.classList.add('show');
        emailButton.disabled = true;
        whatsappButton.disabled = true;
        refrebybutton.disabled = true;
        transportbutton.disabled = true;
        driverbutton.disabled = true;
        shippedtobutton.disabled = true;
        salebilltobutton.disabled = true;
        billToEmailButton.disabled = true;
          tranToEmailButton.disabled = true;
          refEmailButton.disabled = true;
          billToEmailButton.classList.add('loading');
        setLoading(true);
    
        // Fetch the PDF blob
        fetch(pdfData)
            .then((res) => res.blob())
            .then((pdfBlob) => {
                const formData = new FormData();
                formData.append('pdf', pdfBlob, `${pdfNameRef.current}.pdf`);
                formData.append('email', emails);  // Send all emails as a comma-separated string
                formData.append('message', subject);
                formData.append('messagebody', body);
                formData.append('ewbNo', ewayBillNo);
                formData.append('query_label', label);
    
                // Sending email request
                fetch(`${apiKey}/send-pdf-email-onlineportal`, {
                    method: 'POST',
                    body: formData,
                })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Failed to send email');
                    }
                    return response.json();
                })
                .then((data) => {
                    // Success handling
                    if (pdfWindow) {
                        pdfWindow.alert('Emails sent successfully!');
                    } else {
                        alert('Emails sent successfully!');
                    }
                })
                .catch((error) => {
                    // Error handling
                    alert('Error sending emails.');
                    console.error('Error sending emails:', error);
                })
                .finally(() => {
                    // Reset buttons and state after processing
                    setLoading(false);
                    billToEmailButton.classList.remove('loading');
                    emailButton.disabled = false;
                    whatsappButton.disabled = false;
                    transportbutton.disabled = false;
                    driverbutton.disabled = false;
                    refrebybutton.disabled = false;
                    shippedtobutton.disabled = false;
                    salebilltobutton.disabled = false;
                    billToEmailButton.disabled = false;
          tranToEmailButton.disabled = false;
          refEmailButton.disabled = false;
                    overlay.classList.remove('show');
                });
            })
            .catch((error) => {
                // Fetch error handling
                console.error('Failed to fetch PDF blob:', error);
                alert('Error fetching PDF.');
                messageDiv.textContent = 'Error fetching PDF.';
                messageDiv.classList.remove('success');
                messageDiv.classList.add('error');
                billToEmailButton.classList.remove('loading');
                emailButton.disabled = false;
                whatsappButton.disabled = false;
                refrebybutton.disabled = false;
                transportbutton.disabled = false;
                driverbutton.disabled = false;
                shippedtobutton.disabled = false;
                salebilltobutton.disabled = false;
                billToEmailButton.disabled = false;
          tranToEmailButton.disabled = false;
          refEmailButton.disabled = false;
                overlay.classList.remove('show');
            });
    });

    tranMailInput.value = [apiData.TransportEmail || ''].filter(email => email && email.trim()).join(', ');
    tranToEmailButton.addEventListener('click', () => {
      const emails = tranMailInput.value.trim();
      
      // Validate emails
      if (!emails) {
          setEmailError('Email addresses are required.');
          return;
      } else {
          // Split the emails by comma and trim whitespace
          const emailArray = emails.split(',').map(email => email.trim());
          const invalidEmails = emailArray.filter(email => !validateEmail(email));
  
          if (invalidEmails.length > 0) {
              setEmailError('Please enter valid email addresses.');
              return;
          } else {
              setEmailError('');
          }
      }
  
      // Disable buttons and show overlay
      overlay.classList.add('show');
      emailButton.disabled = true;
      whatsappButton.disabled = true;
      refrebybutton.disabled = true;
      transportbutton.disabled = true;
      driverbutton.disabled = true;
      shippedtobutton.disabled = true;
      salebilltobutton.disabled = true;
      billToEmailButton.disabled = true;
          tranToEmailButton.disabled = true;
          refEmailButton.disabled = true;
      tranToEmailButton.classList.add('loading');
      setLoading(true);
  
      // Fetch the PDF blob
      fetch(pdfData)
          .then((res) => res.blob())
          .then((pdfBlob) => {
              const formData = new FormData();
              formData.append('pdf', pdfBlob, `${pdfNameRef.current}.pdf`);
              formData.append('email', emails);  // Send all emails as a comma-separated string
              formData.append('message', subject);
              formData.append('messagebody', body);
              formData.append('ewbNo', ewayBillNo);
              formData.append('query_label', label);
  
              // Sending email request
              fetch(`${apiKey}/send-pdf-email-onlineportal`, {
                  method: 'POST',
                  body: formData,
              })
              .then((response) => {
                  if (!response.ok) {
                      throw new Error('Failed to send email');
                  }
                  return response.json();
              })
              .then((data) => {
                  // Success handling
                  if (pdfWindow) {
                      pdfWindow.alert('Emails sent successfully!');
                  } else {
                      alert('Emails sent successfully!');
                  }
              })
              .catch((error) => {
                  // Error handling
                  alert('Error sending emails.');
                  console.error('Error sending emails:', error);
              })
              .finally(() => {
                  // Reset buttons and state after processing
                  setLoading(false);
                  tranToEmailButton.classList.remove('loading');
                  emailButton.disabled = false;
                  whatsappButton.disabled = false;
                  transportbutton.disabled = false;
                  driverbutton.disabled = false;
                  refrebybutton.disabled = false;
                  shippedtobutton.disabled = false;
                  salebilltobutton.disabled = false;
                  billToEmailButton.disabled = false;
          tranToEmailButton.disabled = false;
          refEmailButton.disabled = false;
                  overlay.classList.remove('show');
              });
          })
          .catch((error) => {
              // Fetch error handling
              console.error('Failed to fetch PDF blob:', error);
              alert('Error fetching PDF.');
              messageDiv.textContent = 'Error fetching PDF.';
              messageDiv.classList.remove('success');
              messageDiv.classList.add('error');
              tranToEmailButton.classList.remove('loading');
              emailButton.disabled = false;
              whatsappButton.disabled = false;
              refrebybutton.disabled = false;
              transportbutton.disabled = false;
              driverbutton.disabled = false;
              shippedtobutton.disabled = false;
              salebilltobutton.disabled = false;
              billToEmailButton.disabled = false;
          tranToEmailButton.disabled = false;
          refEmailButton.disabled = false;
              overlay.classList.remove('show');
          });
  });
  
  refMailInput.value = [apiData.RefMail ||''].filter(email => email && email.trim()).join(', ');
  refEmailButton.addEventListener('click', () => {
    const emails = refMailInput.value.trim();
    
    // Validate emails
    if (!emails) {
        setEmailError('Email addresses are required.');
        return;
    } else {
        // Split the emails by comma and trim whitespace
        const emailArray = emails.split(',').map(email => email.trim());
        const invalidEmails = emailArray.filter(email => !validateEmail(email));

        if (invalidEmails.length > 0) {
            setEmailError('Please enter valid email addresses.');
            return;
        } else {
            setEmailError('');
        }
    }

    // Disable buttons and show overlay
    overlay.classList.add('show');
    emailButton.disabled = true;
    whatsappButton.disabled = true;
    refrebybutton.disabled = true;
    transportbutton.disabled = true;
    driverbutton.disabled = true;
    shippedtobutton.disabled = true;
    salebilltobutton.disabled = true;
    refEmailButton.classList.add('loading');
    setLoading(true);

    // Fetch the PDF blob
    fetch(pdfData)
        .then((res) => res.blob())
        .then((pdfBlob) => {
            const formData = new FormData();
            formData.append('pdf', pdfBlob, `${pdfNameRef.current}.pdf`);
            formData.append('email', emails);  // Send all emails as a comma-separated string
            formData.append('message', subject);
            formData.append('messagebody', body);
            formData.append('ewbNo', ewayBillNo);
            formData.append('query_label', label);

            // Sending email request
            fetch(`${apiKey}/send-pdf-email-onlineportal`, {
                method: 'POST',
                body: formData,
            })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to send email');
                }
                return response.json();
            })
            .then((data) => {
                // Success handling
                if (pdfWindow) {
                    pdfWindow.alert('Emails sent successfully!');
                } else {
                    alert('Emails sent successfully!');
                }
            })
            .catch((error) => {
                // Error handling
                alert('Error sending emails.');
                console.error('Error sending emails:', error);
            })
            .finally(() => {
                // Reset buttons and state after processing
                setLoading(false);
                refEmailButton.classList.remove('loading');
                emailButton.disabled = false;
                whatsappButton.disabled = false;
                transportbutton.disabled = false;
                driverbutton.disabled = false;
                refrebybutton.disabled = false;
                shippedtobutton.disabled = false;
                salebilltobutton.disabled = false;
                billToEmailButton.disabled = false;
          tranToEmailButton.disabled = false;
          refEmailButton.disabled = false;
                overlay.classList.remove('show');
            });
        })
        .catch((error) => {
            // Fetch error handling
            console.error('Failed to fetch PDF blob:', error);
            alert('Error fetching PDF.');
            messageDiv.textContent = 'Error fetching PDF.';
            messageDiv.classList.remove('success');
            messageDiv.classList.add('error');
            refEmailButton.classList.remove('loading');
            emailButton.disabled = false;
            whatsappButton.disabled = false;
            refrebybutton.disabled = false;
            transportbutton.disabled = false;
            driverbutton.disabled = false;
            shippedtobutton.disabled = false;
            salebilltobutton.disabled = false;
            billToEmailButton.disabled = false;
          tranToEmailButton.disabled = false;
          refEmailButton.disabled = false;
            overlay.classList.remove('show');
        });
});

    
        //Send All WhatsApp messages to all numbers
        whatsappInput.value = [
          apiData.CarporateBillToWpNo,
          apiData.BillToWpNo,
          apiData.TransportWpNo,
          apiData.driver_no,
          apiData.ShipToWpNo,
          apiData.RefWpNo
        ].filter(num => num)
          .join(',');

        whatsappButton.addEventListener('click', () => {
          const whatsappNumbers = whatsappInput.value
            .split(',')
            .map(num => num.trim())
            .filter((num, index, self) => num && self.indexOf(num) === index);

          if (whatsappNumbers.length === 0) {
            alert('Please enter at least one WhatsApp number.');
            return;
          }

          setIsWhatsAppLoading(true);
          whatsappButton.disabled = true;
          whatsappButton.classList.add('loading');
          setLoading(true);

          const wpMessage = `HI, ${label} FROM ${apiData.Company_Name_E || apiData.fromName} DATE: ${apiData.doc_dateConverted || apiData.Doc_Date || ''} TAX INVOICE NO: SB-${apiData.doc_no} DO NO: ${apiData.DO_No || ''} BUYER: ${apiData.billtoname || apiData.Buyer_Name} CITY: ${apiData.billtopin || apiData.Buyer_City} TO: ${apiData.billtoname || apiData.Buyer_Name} CITY: ${apiData.billtopin || apiData.Buyer_City} MILL NAME: ${apiData.millname || ''} DRIVER NO: ${apiData.driver_no || ''} TRUCK NO: ${apiData.LORRYNO} SESSON: ${apiData.season || ''} GRADE: ${apiData.grade || ''} SALE RATE: ${apiData.salerate || apiData.rate} COMMSSION: ${apiData.bank_commission || ''} EWAY BILL NO: ${apiData.EWay_Bill_No} VALID TILL: ${apiData.EwayBillValidDate || apiData.validUpTo} EINVOICE NO: ${apiData.einvoiceno} ACK NO: ${apiData.ackno || ''} FOR DETAIL PLEASE OPEN ATTACHED PDF FILE ANY PROBLEM CALL ON ${apiData.PHONE || apiData.fromPhone || ''}`;

          fetch(pdfData)
            .then((res) => res.blob())
            .then((pdfBlob) => {
              const formData = new FormData();
              formData.append('file', pdfBlob, `${pdfNameRef.current}.pdf`);

              fetch(`${apiKey}/upload-to-github-onlineportal`, {
                method: 'POST',
                body: formData,
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.status === 'success' && data.file_url) {
                    // Send WhatsApp message for unique numbers only
                    whatsappNumbers.forEach(number => {
                      const whatsappLink = `https://apps510.wawatext.com/api/send?number=91${number}&type=media&message=${wpMessage}&media_url=${data.file_url}&filename=${pdfNameRef.current}.pdf&instance_id=${whatsAPPID}&access_token=${whatsAppToken}`;

                      fetch(whatsappLink)
                        .then(response => {
                          pdfWindow.alert(`Message sent to ${number} successfully!`);
                        })
                        .catch(error => {
                          console.error(`Error sending message to ${number}:`, error);
                        });
                    });

                    // Update eway bill status
                    updateEWBStatus(ewayBillNo, label)
                      .then(() => {
                        console.log('E-way bill status successfully updated');
                      })
                      .catch((error) => {
                        console.error('Error during e-way bill status update:', error);
                      });
                  } else {
                    alert('Error uploading PDF to GitHub');
                  }
                })
                .catch((error) => {
                  alert('Error uploading PDF.');
                  console.error('Error uploading PDF:', error);
                })
                .finally(() => {
                  setIsWhatsAppLoading(false);
                  whatsappButton.classList.remove('loading');
                  whatsappButton.disabled = false;
                });
            })
            .catch((error) => {
              console.error('Failed to fetch PDF blob:', error);
              alert('Error fetching PDF.');
              setIsWhatsAppLoading(false);
              whatsappButton.classList.remove('loading');
              whatsappButton.disabled = false;
              overlay.classList.remove('show');
            });
        });

        // send Refreby whatsapp Number
        referbyInput.value = [
          apiData.RefWpNo
        ].filter(num => num)
          .join(',');

        refrebybutton.addEventListener('click', () => {
          const whatsappNumbers = referbyInput.value
            .split(',')
            .map(num => num.trim())
            .filter((num, index, self) => num && self.indexOf(num) === index);

          if (whatsappNumbers.length === 0) {
            alert('Please enter at least one WhatsApp number.');
            return;
          }

          setIsWhatsAppLoading(true);
          refrebybutton.disabled = true;
          refrebybutton.classList.add('loading');

          const wpMessage = `HI, ${label} FROM ${apiData.Company_Name_E || apiData.fromName} DATE: ${apiData.doc_dateConverted || apiData.Doc_Date || ''} TAX INVOICE NO: SB-${apiData.doc_no} DO NO: ${apiData.DO_No || ''} BUYER: ${apiData.billtoname || apiData.Buyer_Name} CITY: ${apiData.billtopin || apiData.Buyer_City} TO: ${apiData.billtoname || apiData.Buyer_Name} CITY: ${apiData.billtopin || apiData.Buyer_City} MILL NAME: ${apiData.millname || ''} DRIVER NO: ${apiData.driver_no || ''} TRUCK NO: ${apiData.LORRYNO} SESSON: ${apiData.season || ''} GRADE: ${apiData.grade || ''} SALE RATE: ${apiData.salerate || apiData.rate} COMMSSION: ${apiData.bank_commission || ''} EWAY BILL NO: ${apiData.EWay_Bill_No} VALID TILL: ${apiData.EwayBillValidDate || apiData.validUpTo} EINVOICE NO: ${apiData.einvoiceno} ACK NO: ${apiData.ackno || ''} FOR DETAIL PLEASE OPEN ATTACHED PDF FILE ANY PROBLEM CALL ON ${apiData.PHONE || apiData.fromPhone || ''}`;

          fetch(pdfData)
            .then((res) => res.blob())
            .then((pdfBlob) => {
              const formData = new FormData();
              formData.append('file', pdfBlob, `${pdfNameRef.current}.pdf`);

              fetch(`${apiKey}/upload-to-github-onlineportal`, {
                method: 'POST',
                body: formData,
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.status === 'success' && data.file_url) {
                    // Send WhatsApp message for unique numbers only
                    whatsappNumbers.forEach(number => {
                      const whatsappLink = `https://apps510.wawatext.com/api/send?number=91${number}&type=media&message=${wpMessage}&media_url=${data.file_url}&filename=${pdfNameRef.current}.pdf&instance_id=${whatsAPPID}&access_token=${whatsAppToken}`;

                      fetch(whatsappLink, { mode: 'no-cors' })
                        .then(response => {
                          pdfWindow.alert(`Message sent to ${number} successfully!`);
                        })
                        .catch(error => {
                          console.error(`Error sending message to ${number}:`, error);
                        });
                    });

                    // Update eway bill status
                    updateEWBStatus(ewayBillNo, label)
                      .then(() => {
                        console.log('E-way bill status successfully updated');
                      })
                      .catch((error) => {
                        console.error('Error during e-way bill status update:', error);
                      });
                  } else {
                    alert('Error uploading PDF to GitHub');
                  }
                })
                .catch((error) => {
                  alert('Error uploading PDF.');
                  console.error('Error uploading PDF:', error);
                })
                .finally(() => {
                  setIsWhatsAppLoading(false);
                  refrebybutton.classList.remove('loading');
                  refrebybutton.disabled = false;
                });
            })
            .catch((error) => {
              console.error('Failed to fetch PDF blob:', error);
              alert('Error fetching PDF.');
              setIsWhatsAppLoading(false);
              refrebybutton.classList.remove('loading');
              refrebybutton.disabled = false;
              overlay.classList.remove('show');
            });
        });

        // Send transportInput whatsapp Number
        transportInput.value = [
          apiData.TransportWpNo,
        ].filter(num => num)
          .join(',');

        transportbutton.addEventListener('click', () => {
          const whatsappNumbers = transportInput.value
            .split(',')
            .map(num => num.trim())
            .filter((num, index, self) => num && self.indexOf(num) === index);

          if (whatsappNumbers.length === 0) {
            alert('Please enter at least one WhatsApp number.');
            return;
          }

          setIsWhatsAppLoading(true);
          transportbutton.disabled = true;
          transportbutton.classList.add('loading');

          const wpMessage = `HI, ${label} FROM ${apiData.Company_Name_E || apiData.fromName} DATE: ${apiData.doc_dateConverted || apiData.Doc_Date || ''} TAX INVOICE NO: SB-${apiData.doc_no} DO NO: ${apiData.DO_No || ''} BUYER: ${apiData.billtoname || apiData.Buyer_Name} CITY: ${apiData.billtopin || apiData.Buyer_City} TO: ${apiData.billtoname || apiData.Buyer_Name} CITY: ${apiData.billtopin || apiData.Buyer_City} MILL NAME: ${apiData.millname || ''} DRIVER NO: ${apiData.driver_no || ''} TRUCK NO: ${apiData.LORRYNO} SESSON: ${apiData.season || ''} GRADE: ${apiData.grade || ''} SALE RATE: ${apiData.salerate || apiData.rate} COMMSSION: ${apiData.bank_commission || ''} EWAY BILL NO: ${apiData.EWay_Bill_No} VALID TILL: ${apiData.EwayBillValidDate || apiData.validUpTo} EINVOICE NO: ${apiData.einvoiceno} ACK NO: ${apiData.ackno || ''} FOR DETAIL PLEASE OPEN ATTACHED PDF FILE ANY PROBLEM CALL ON ${apiData.PHONE || apiData.fromPhone || ''}`;

          fetch(pdfData)
            .then((res) => res.blob())
            .then((pdfBlob) => {
              const formData = new FormData();
              formData.append('file', pdfBlob, `${pdfNameRef.current}.pdf`);

              fetch(`${apiKey}/upload-to-github-onlineportal`, {
                method: 'POST',
                body: formData,
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.status === 'success' && data.file_url) {
                    // Send WhatsApp message for unique numbers only
                    whatsappNumbers.forEach(number => {
                      const whatsappLink = `https://apps510.wawatext.com/api/send?number=91${number}&type=media&message=${wpMessage}&media_url=${data.file_url}&filename=${pdfNameRef.current}.pdf&instance_id=${whatsAPPID}&access_token=${whatsAppToken}`;

                      fetch(whatsappLink, { mode: 'no-cors' })
                        .then(response => {
                          pdfWindow.alert(`Message sent to ${number} successfully!`);
                        })
                        .catch(error => {
                          console.error(`Error sending message to ${number}:`, error);
                        });
                    });

                    // Update eway bill status
                    updateEWBStatus(ewayBillNo, label)
                      .then(() => {
                        console.log('E-way bill status successfully updated');
                      })
                      .catch((error) => {
                        console.error('Error during e-way bill status update:', error);
                      });
                  } else {
                    alert('Error uploading PDF to GitHub');
                  }
                })
                .catch((error) => {
                  alert('Error uploading PDF.');
                  console.error('Error uploading PDF:', error);
                })
                .finally(() => {
                  setIsWhatsAppLoading(false);
                  transportbutton.classList.remove('loading');
                  transportbutton.disabled = false;
                });
            })
            .catch((error) => {
              console.error('Failed to fetch PDF blob:', error);
              alert('Error fetching PDF.');
              setIsWhatsAppLoading(false);
              transportbutton.classList.remove('loading');
              transportbutton.disabled = false;
              overlay.classList.remove('show');
            });
        });

        //Send DriverInput whatsapp Number
        driverInput.value = [
          apiData.driver_no,
        ].filter(num => num)
          .join(',');

        driverbutton.addEventListener('click', () => {
          const whatsappNumbers = driverInput.value
            .split(',')
            .map(num => num.trim())
            .filter((num, index, self) => num && self.indexOf(num) === index);

          if (whatsappNumbers.length === 0) {
            alert('Please enter at least one WhatsApp number.');
            return;
          }

          setIsWhatsAppLoading(true);
          driverbutton.disabled = true;
          driverbutton.classList.add('loading');

          const wpMessage = `HI, ${label} FROM ${apiData.Company_Name_E || apiData.fromName} DATE: ${apiData.doc_dateConverted || apiData.Doc_Date || ''} TAX INVOICE NO: SB-${apiData.doc_no} DO NO: ${apiData.DO_No || ''} BUYER: ${apiData.billtoname || apiData.Buyer_Name} CITY: ${apiData.billtopin || apiData.Buyer_City} TO: ${apiData.billtoname || apiData.Buyer_Name} CITY: ${apiData.billtopin || apiData.Buyer_City} MILL NAME: ${apiData.millname || ''} DRIVER NO: ${apiData.driver_no || ''} TRUCK NO: ${apiData.LORRYNO} SESSON: ${apiData.season || ''} GRADE: ${apiData.grade || ''} SALE RATE: ${apiData.salerate || apiData.rate} COMMSSION: ${apiData.bank_commission || ''} EWAY BILL NO: ${apiData.EWay_Bill_No} VALID TILL: ${apiData.EwayBillValidDate || apiData.validUpTo} EINVOICE NO: ${apiData.einvoiceno} ACK NO: ${apiData.ackno || ''} FOR DETAIL PLEASE OPEN ATTACHED PDF FILE ANY PROBLEM CALL ON ${apiData.PHONE || apiData.fromPhone || ''}`;

          fetch(pdfData)
            .then((res) => res.blob())
            .then((pdfBlob) => {
              const formData = new FormData();
              formData.append('file', pdfBlob, `${pdfNameRef.current}.pdf`);

              fetch(`${apiKey}/upload-to-github-onlineportal`, {
                method: 'POST',
                body: formData,
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.status === 'success' && data.file_url) {
                    whatsappNumbers.forEach(number => {
                      const whatsappLink = `https://apps510.wawatext.com/api/send?number=91${number}&type=media&message=${wpMessage}&media_url=${data.file_url}&filename=${pdfNameRef.current}.pdf&instance_id=${whatsAPPID}&access_token=${whatsAppToken}`;

                      fetch(whatsappLink, { mode: 'no-cors' })
                        .then(response => {
                          pdfWindow.alert( `Message sent to ${number} successfully!`);
                        })
                        .catch(error => {
                          console.error(`Error sending message to ${number}:`, error);
                        });
                    });

                    updateEWBStatus(ewayBillNo, label)
                      .then(() => {
                        console.log('E-way bill status successfully updated');
                      })
                      .catch((error) => {
                        console.error('Error during e-way bill status update:', error);
                      });
                  } else {
                    alert('Error uploading PDF to GitHub');
                  }
                })
                .catch((error) => {
                  alert('Error uploading PDF.');
                  console.error('Error uploading PDF:', error);
                })
                .finally(() => {
                  setIsWhatsAppLoading(false);
                  driverbutton.classList.remove('loading');
                  driverbutton.disabled = false;
                });
            })
            .catch((error) => {
              console.error('Failed to fetch PDF blob:', error);
              alert('Error fetching PDF.');
              setIsWhatsAppLoading(false);
              driverbutton.classList.remove('loading');
              driverbutton.disabled = false;
              overlay.classList.remove('show');
            });
        });

        //Send Shipped To whatsapp Number
        shippedToInput.value = [
          apiData.ShipToWpNo,
        ].filter(num => num)
          .join(',');

        shippedtobutton.addEventListener('click', () => {
          const whatsappNumbers = shippedToInput.value
            .split(',')
            .map(num => num.trim())
            .filter((num, index, self) => num && self.indexOf(num) === index);

          if (whatsappNumbers.length === 0) {
            alert('Please enter at least one WhatsApp number.');
            return;
          }

          setIsWhatsAppLoading(true);
          shippedtobutton.disabled = true;
          shippedtobutton.classList.add('loading');

          const wpMessage = `HI, ${label} FROM ${apiData.Company_Name_E || apiData.fromName} DATE: ${apiData.doc_dateConverted || apiData.Doc_Date || ''} TAX INVOICE NO: SB-${apiData.doc_no} DO NO: ${apiData.DO_No || ''} BUYER: ${apiData.billtoname || apiData.Buyer_Name} CITY: ${apiData.billtopin || apiData.Buyer_City} TO: ${apiData.billtoname || apiData.Buyer_Name} CITY: ${apiData.billtopin || apiData.Buyer_City} MILL NAME: ${apiData.millname || ''} DRIVER NO: ${apiData.driver_no || ''} TRUCK NO: ${apiData.LORRYNO} SESSON: ${apiData.season || ''} GRADE: ${apiData.grade || ''} SALE RATE: ${apiData.salerate || apiData.rate} COMMSSION: ${apiData.bank_commission || ''} EWAY BILL NO: ${apiData.EWay_Bill_No} VALID TILL: ${apiData.EwayBillValidDate || apiData.validUpTo} EINVOICE NO: ${apiData.einvoiceno} ACK NO: ${apiData.ackno || ''} FOR DETAIL PLEASE OPEN ATTACHED PDF FILE ANY PROBLEM CALL ON ${apiData.PHONE || apiData.fromPhone || ''}`;

          fetch(pdfData)
            .then((res) => res.blob())
            .then((pdfBlob) => {
              const formData = new FormData();
              formData.append('file', pdfBlob, `${pdfNameRef.current}.pdf`);

              fetch(`${apiKey}/upload-to-github-onlineportal`, {
                method: 'POST',
                body: formData,
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.status === 'success' && data.file_url) {
                    whatsappNumbers.forEach(number => {
                      const whatsappLink = `https://apps510.wawatext.com/api/send?number=91${number}&type=media&message=${wpMessage}&media_url=${data.file_url}&filename=${pdfNameRef.current}.pdf&instance_id=${whatsAPPID}&access_token=${whatsAppToken}`;

                      fetch(whatsappLink, { mode: 'no-cors' })
                        .then(response => {
                          pdfWindow.alert( `Message sent to ${number} successfully!`);
                        })
                        .catch(error => {
                          console.error(`Error sending message to ${number}:`, error);
                        });
                    });

                    updateEWBStatus(ewayBillNo, label)
                      .then(() => {
                        console.log('E-way bill status successfully updated');
                      })
                      .catch((error) => {
                        console.error('Error during e-way bill status update:', error);
                      });
                  } else {
                    alert('Error uploading PDF to GitHub');
                  }
                })
                .catch((error) => {
                  alert('Error uploading PDF.');
                  console.error('Error uploading PDF:', error);
                })
                .finally(() => {
                  setIsWhatsAppLoading(false);
                  shippedtobutton.classList.remove('loading');
                  shippedtobutton.disabled = false;
                });
            })
            .catch((error) => {
              console.error('Failed to fetch PDF blob:', error);
              alert('Error fetching PDF.');
              setIsWhatsAppLoading(false);
              shippedtobutton.classList.remove('loading');
              shippedtobutton.disabled = false;
              overlay.classList.remove('show');
            });
        });

        //Sale Bill To whatsapp Number
        salebilltoInput.value = [
          apiData.BillToWpNo,
        ].filter(num => num)
          .join(',');

        salebilltobutton.addEventListener('click', () => {
          const whatsappNumbers = salebilltoInput.value
            .split(',')
            .map(num => num.trim())
            .filter((num, index, self) => num && self.indexOf(num) === index);

          if (whatsappNumbers.length === 0) {
            alert('Please enter at least one WhatsApp number.');
            return;
          }

          setIsWhatsAppLoading(true);
          salebilltobutton.disabled = true;
          salebilltobutton.classList.add('loading');

          const wpMessage = `HI, ${label} FROM ${apiData.Company_Name_E || apiData.fromName} DATE: ${apiData.doc_dateConverted || apiData.Doc_Date || ''} TAX INVOICE NO: SB-${apiData.doc_no} DO NO: ${apiData.DO_No || ''} BUYER: ${apiData.billtoname || apiData.Buyer_Name} CITY: ${apiData.billtopin || apiData.Buyer_City} TO: ${apiData.billtoname || apiData.Buyer_Name} CITY: ${apiData.billtopin || apiData.Buyer_City} MILL NAME: ${apiData.millname || ''} DRIVER NO: ${apiData.driver_no || ''} TRUCK NO: ${apiData.LORRYNO} SESSON: ${apiData.season || ''} GRADE: ${apiData.grade || ''} SALE RATE: ${apiData.salerate || apiData.rate} COMMSSION: ${apiData.bank_commission || ''} EWAY BILL NO: ${apiData.EWay_Bill_No} VALID TILL: ${apiData.EwayBillValidDate || apiData.validUpTo} EINVOICE NO: ${apiData.einvoiceno} ACK NO: ${apiData.ackno || ''} FOR DETAIL PLEASE OPEN ATTACHED PDF FILE ANY PROBLEM CALL ON ${apiData.PHONE || apiData.fromPhone || ''}`;

          fetch(pdfData)
            .then((res) => res.blob())
            .then((pdfBlob) => {
              const formData = new FormData();
              formData.append('file', pdfBlob, `${pdfNameRef.current}.pdf`);

              fetch(`${apiKey}/upload-to-github-onlineportal`, {
                method: 'POST',
                body: formData,
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.status === 'success' && data.file_url) {
                    whatsappNumbers.forEach(number => {
                      const whatsappLink = `https://apps510.wawatext.com/api/send?number=91${number}&type=media&message=${wpMessage}&media_url=${data.file_url}&filename=${pdfNameRef.current}.pdf&instance_id=${whatsAPPID}&access_token=${whatsAppToken}`;

                      fetch(whatsappLink, { mode: 'no-cors' })
                        .then(response => {
                          pdfWindow.alert(`Message sent to ${number} successfully!`);
                        })
                        .catch(error => {
                          console.error(`Error sending message to ${number}:`, error);
                        });
                    });

                    updateEWBStatus(ewayBillNo, label)
                      .then(() => {
                        console.log('E-way bill status successfully updated');
                      })
                      .catch((error) => {
                        console.error('Error during e-way bill status update:', error);
                      });
                  } else {
                    alert('Error uploading PDF to GitHub');
                  }
                })
                .catch((error) => {
                  alert('Error uploading PDF.');
                  console.error('Error uploading PDF:', error);
                })
                .finally(() => {
                  setIsWhatsAppLoading(false);
                  salebilltobutton.classList.remove('loading');
                  salebilltobutton.disabled = false;
                });
            })
            .catch((error) => {
              console.error('Failed to fetch PDF blob:', error);
              alert('Error fetching PDF.');
              setIsWhatsAppLoading(false);
              salebilltobutton.classList.remove('loading');
              salebilltobutton.disabled = false;
              overlay.classList.remove('show');
            });
        });

      };
    }
  }, [pdfData]);

  return null;
};

export default PdfPreview;
