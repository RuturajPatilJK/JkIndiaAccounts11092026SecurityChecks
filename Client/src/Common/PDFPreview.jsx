// import React, { useEffect, useRef } from 'react';
// import Swal from 'sweetalert2';
// import messageTemplates from "./MessageData/data.json";

// const apiKey = process.env.REACT_APP_API;
// const whatsAPPID = process.env.REACT_APP_WHATSAPPID;
// const whatsAppToken = process.env.REACT_APP_WHATSAPPTOKEN;

// const PdfPreview = ({ pdfData, apiData, label }) => {
//   const pdfWindowRef = useRef(null);
//   const pdfNameRef = useRef("");

//   useEffect(() => {
//     const pdfWindow = window.open("", "_blank");

//     if (!pdfWindow) {
//       alert("Popup blocked! Please allow popups for this website.");
//       return;
//     }

//     const template = messageTemplates[label];
//     if (!template) {
//       alert("No template found for the provided label.");
//       return;
//     }

//     const resolvePlaceholders = (templateStr) =>
//       templateStr.replace(/{(\w+)}/g, (_, key) => {
//         const val = apiData?.[key];
//         return val != null ? String(val).trim() : "NA";
//       });

//     let subject = resolvePlaceholders(template.subject || "");
//     let body = resolvePlaceholders(template.body || "");
//     let pdfname = resolvePlaceholders(template.pdfName || "")
//       .replace(/[<>:"/\\|?*]+/g, "")
//       .substring(0, 100);
//     let whatsappMessage = resolvePlaceholders(template.whatsappMessage || "");
//     pdfNameRef.current = pdfname;

//     pdfWindow.document.write(`



//         <!DOCTYPE html>
//       <html>
//         <head>
//           <title>PDF Preview</title>
//           <link href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css" rel="stylesheet">
//           <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
//           <style>
//             * {
//               box-sizing: border-box;
//               font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//             }
//             .top-bar {
//               display: flex;
//               justify-content: space-between;
//               align-items: center;
//               padding: 10px 20px;
//               background: #f8f9fa;
//               border-bottom: 1px solid #e0e0e0;
//               box-shadow: 0 2px 5px rgba(0,0,0,0.05);
//             }
//             .top-bar h3 {
//               margin: 0;
//               color: #333;
//               font-size: 18px;
//               font-weight: 600;
//             }

//             .btn-group {
//               display: flex;
//               align-items: center;
//               gap: 10px;
//             }

//             .custom-btn {
//               background: #34a853;
//               color: white;
//               border: none;
//               border-radius: 6px;
//               padding: 8px 14px;
//               font-size: 14px;
//               cursor: pointer;
//               display: flex;
//               align-items: center;
//               gap: 8px;
//               transition: all 0.2s ease;
//               box-shadow: 0 2px 5px rgba(0,0,0,0.15);
//             }

//             .custom-btn:hover {
//               background: #2c8e45;
//               transform: translateY(-1px);
//             }

//             .custom-btn:active {
//               transform: translateY(0);
//             }

//             .share-container {
//               position: relative;
//             }

//             .share-btn {
//               background: #4285f4;
//               color: white;
//               border: none;
//               border-radius: 6px;
//               padding: 8px 14px;
//               font-size: 14px;
//               cursor: pointer;
//               display: flex;
//               align-items: center;
//               gap: 8px;
//               transition: all 0.2s ease;
//               box-shadow: 0 2px 5px rgba(66, 133, 244, 0.2);
//             }

//             .share-btn:hover {
//               background: #3367d6;
//               transform: translateY(-1px);
//             }

//             .share-dropdown {
//               position: absolute;
//               top: 100%;
//               right: 0;
//               background: white;
//               border-radius: 8px;
//               box-shadow: 0 4px 12px rgba(0,0,0,0.15);
//               padding: 10px;
//               min-width: 180px;
//               z-index: 100;
//               opacity: 0;
//               visibility: hidden;
//               transform: translateY(10px);
//               transition: all 0.2s ease;
//             }

//             .share-container:hover .share-dropdown {
//               opacity: 1;
//               visibility: visible;
//               transform: translateY(0);
//             }

//             .share-option {
//               display: flex;
//               align-items: center;
//               padding: 8px 12px;
//               border-radius: 6px;
//               cursor: pointer;
//               transition: all 0.2s ease;
//               color: #333;
//             }

//             .share-option:hover {
//               background: #f0f2f5;
//             }

//             .share-option i {
//               margin-right: 10px;
//               font-size: 18px;
//               width: 24px;
//               text-align: center;
//             }

//             .email-option { color: #d44638; }
//             .whatsapp-option { color: #25D366; }

//             .embed-container {
//               height: calc(100vh - 60px);
//               width: 100%;
//             }
//             .embed-container embed {
//               width: 100%;
//               height: 100%;
//             }
//           </style>
//         </head>
//         <body>
//           <div class="top-bar">
//             <h3>${pdfname}</h3>
//             <div class="btn-group">
//               <!-- Print Button -->
//               <button class="custom-btn" onclick="printPDF()">
//                 <i class="fas fa-print"></i> Print
//               </button>

//               <!-- Save Button -->
//               <button class="custom-btn" onclick="savePDF()">
//                 <i class="fas fa-download"></i> Save
//               </button>

//               <!-- Share Button -->
//               <div class="share-container">
//                 <button class="share-btn">
//                   <i class="fas fa-share-alt"></i> Share
//                 </button>
//                 <div class="share-dropdown">
//                   <div class="share-option email-option" id="emailBtn">
//                     <i class="fas fa-envelope"></i> Email
//                   </div>
//                   <div class="share-option whatsapp-option" id="whatsappBtn">
//                     <i class="fab fa-whatsapp"></i> WhatsApp
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div class="embed-container">
//             <embed id="pdfEmbed" src="${pdfData}" type="application/pdf" />
//           </div>

//           <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
//           <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
//           <script>
//             function printPDF() {
//               const pdfURL = document.getElementById('pdfEmbed').getAttribute('src');
//               const iframe = document.createElement('iframe');
//               iframe.style.display = 'none';
//               iframe.src = pdfURL;
//               document.body.appendChild(iframe);
//               iframe.onload = function () {
//                 iframe.contentWindow.focus();
//                 iframe.contentWindow.print();
//               };
//             }

//             function savePDF() {
//               const pdfURL = document.getElementById('pdfEmbed').getAttribute('src');
//               const link = document.createElement('a');
//               link.href = pdfURL;
//               link.download = '${pdfname || "document.pdf"}'; // fallback name
//               document.body.appendChild(link);
//               link.click();
//               document.body.removeChild(link);
//             }
//           </script>
//         </body>
//       </html>

//       `);
//     pdfWindow.document.close();

//     pdfWindow.onload = () => {
//       const emailBtn = pdfWindow.document.getElementById('emailBtn');
//       const whatsappBtn = pdfWindow.document.getElementById('whatsappBtn');

//       emailBtn.addEventListener('click', () => {
//         showShareDialog(pdfWindow, pdfData, {
//           email: getFormattedEmails(),
//           whatsapp: '',
//           subject,
//           body,
//           whatsappMessage,
//           label,
//           pdfName: pdfNameRef.current,
//           mode: 'email'
//         });
//       });

//       whatsappBtn.addEventListener("click", () => {
//         showShareDialog(pdfWindow, pdfData, {
//           email: "",
//           whatsapp: getFormattedWhatsAppNumbers(),
//           subject,
//           body,
//           whatsappMessage,
//           label,
//           pdfName: pdfNameRef.current,
//           mode: "whatsapp",
//           apiData,
//         });
//       });
//     };

//     pdfWindowRef.current = pdfWindow;

//   }, [pdfData, apiData, label]);

//   const getFormattedEmails = () => {
//     return [
//       apiData.TransportEmail,
//       apiData.RefMail,
//       apiData.billtoemail,
//       apiData.shiptoemail,
//       apiData.CarporateBillToEmailID,
//       apiData.doemail,
//       apiData.millemailid,
//       apiData.getpassemailid,
//       // apiData.bankEmail,
//     ]
//       .filter(email => email)
//       .join(',');
//   };

//   const getFormattedWhatsAppNumbers = () => {
//     return [
//       apiData.BillToWpNo,
//       apiData.TransportWpNo,
//       apiData.ShipToWpNo,
//       apiData.CorporateBillToWpNo,
//       apiData.RefWpNo,
//       // apiData.bankWpNo,
//     ]
//       .filter(wp => wp)
//       .join(',');
//   };

//   const showShareDialog = (pdfWindow, pdfData, options) => {
//     pdfWindow.Swal.fire({
//       title: `Share via ${options.mode === "email" ? "Email" : "WhatsApp"}`,
//       html: `
//         <div style="text-align: left;">
//           ${options.mode === "email"
//           ? `
//             <div class="form-group" style="margin-bottom: 15px;">
//               <label for="swal-email" style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">Email Addresses (separate with commas)</label>
//               <input id="swal-email" class="swal2-input" value="${options.email || ""
//           }" type="text" style="width: 80%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
//               <small style="display: block; margin-top: 5px; color: #666;">You can enter multiple emails separated by commas</small>
//             </div>`
//           : ""
//         }
//           ${options.mode === "whatsapp"
//           ? `
//             <div class="form-group" style="margin-bottom: 15px;">
//               <label for="swal-whatsapp" style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">WhatsApp Number</label>
//               <div style="display: flex; align-items: center;">
//                 <span style="background: #f5f5f5; padding: 8px 8px; border: 1px solid #ddd; border-right: none; border-radius: 4px 0 0 4px; margin-top: 8px;">+91</span>
//                 <input id="swal-whatsapp" class="swal2-input" value="${options.whatsapp || ""
//           }" type="tel" style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 0 4px 4px 0; font-size: 14px;">
//               </div>
//             </div>`
//           : ""
//         }
//         </div>
//       `,
//       showCancelButton: true,
//       confirmButtonText: "Send",
//       confirmButtonColor: options.mode === "email" ? "#d44638" : "#25D366",
//       showLoaderOnConfirm: true,
//       focusConfirm: false,
//       preConfirm: () => {
//         const email =
//           options.mode === "email"
//             ? pdfWindow.Swal.getPopup()
//               .querySelector("#swal-email")
//               .value.trim()
//             : "";
//         const whatsapp =
//           options.mode === "whatsapp"
//             ? pdfWindow.Swal.getPopup()
//               .querySelector("#swal-whatsapp")
//               .value.trim()
//             : "";

//         const promises = [];

//         if (email) {
//           const emailList = email
//             .split(",")
//             .map((e) => e.trim())
//             .filter((e) => e !== "");
//           const invalidEmails = emailList.filter(
//             (e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
//           );

//           if (invalidEmails.length > 0) {
//             pdfWindow.Swal.showValidationMessage(
//               `Invalid email format: ${invalidEmails.join(", ")}`
//             );
//             return false;
//           }

//           emailList.forEach((email) => {
//             promises.push(sendEmail(pdfWindow, pdfData, email, options));
//           });
//         }

//         if (whatsapp) {
//           const numbers = whatsapp
//             .split(",")
//             .map((num) => num.trim())
//             .filter((num) => num); // remove empty

//           const invalidNumbers = numbers.filter((num) => !/^\d{10}$/.test(num));

//           if (invalidNumbers.length > 0) {
//             pdfWindow.Swal.showValidationMessage(
//               `Invalid WhatsApp number(s): ${invalidNumbers.join(
//                 ", "
//               )} (must be 10 digits)`
//             );
//             return false;
//           }

//           promises.push(
//             sendWhatsApp(pdfWindow, pdfData, numbers.join(","), options)
//           );
//         }

//         return Promise.all(promises);
//       },
//       allowOutsideClick: () => !pdfWindow.Swal.isLoading(),
//     }).then((result) => {
//       if (result.isConfirmed) {
//         pdfWindow.Swal.fire({
//           title: "Sent!",
//           text: `Document has been shared via ${options.mode === "email" ? "Email" : "WhatsApp"
//             }`,
//           icon: "success",
//           confirmButtonColor: options.mode === "email" ? "#d44638" : "#25D366",
//         });
//       }
//     });
//   };

//   const sendEmail = (pdfWindow, pdfData, email, options) => {
//     return fetch(pdfData)
//       .then((res) => res.blob())
//       .then((pdfBlob) => {
//         const formData = new FormData();
//         formData.append('pdf', pdfBlob, `${options.pdfName}.pdf`);
//         formData.append('email', email);
//         formData.append('message', options.subject);
//         formData.append('messagebody', options.body);
//         formData.append('query_label', options.label);

//         return fetch(`${apiKey}/send-pdf-email`, {
//           method: 'POST',
//           body: formData,
//         });
//       })
//       .then((response) => response.json())
//       .then((data) => {
//         console.log('Email sent:', data.message);
//       })
//       .catch((error) => {
//         console.error('Error sending email:', error);
//         throw new Error('Failed to send email');
//       });
//   };

//   const sendWhatsApp = async (pdfWindow, pdfData, whatsappNumbers, options) => {
//     try {
//       // 1) Get a real PDF blob
//       const resp = await fetch(pdfData);
//       if (!resp.ok) throw new Error(`PDF fetch failed: ${resp.status} ${resp.statusText}`);
//       const srcBlob = await resp.blob();

//       // Force PDF MIME in case the source is ambiguous
//       const pdfFilename = `${(options.pdfName || "document").replace(/\.pdf$/i, "")}.pdf`;
//       const fixedBlob = new Blob([srcBlob], { type: "application/pdf" });

//       // 2) Upload to your backend (Drive)
//       const uploadForm = new FormData();
//       uploadForm.append("file", fixedBlob, pdfFilename);

//       const uploadRes = await fetch(`${apiKey}/upload-to-drive`, { method: "POST", body: uploadForm });
//       if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
//       const uploadData = await uploadRes.json();

//       const fileUrl =
//         uploadData.api_media_url   // ✅ preferred: Drive API media endpoint (public)
//         || uploadData.file_url     //    fallback: if you still return webContentLink
//         || (() => { throw new Error("No usable Drive URL returned"); })();
//       //const pdfFilename = `${(options.pdfName || "document").replace(/\.pdf$/i, "")}.pdf`;


//       // 3) Build template params
//       const messageTemplate = messageTemplates[options.label];
//       if (!messageTemplate || !Array.isArray(messageTemplate.params)) {
//         throw new Error(`Invalid template: ${options.label}`);
//       }
//       const paramArray = messageTemplate.params.map((tpl) =>
//         String(tpl).replace(/{(\w+)}/g, (_, key) => {
//           const v = options.apiData?.[key];
//           return v != null && String(v).trim() !== "" ? String(v).trim() : "N/A";
//         })
//       );

//       // 4) Numbers
//       const numbers = Array.from(new Set(String(whatsappNumbers || "")
//         .split(",").map((n) => n.trim()).filter((n) => /^\d{10}$/.test(n)).map((n) => `91${n}`)));
//       if (numbers.length === 0) throw new Error("No valid WhatsApp numbers (need 10-digit).");

//       // 5) Components (DOCUMENT header if template expects it)
//       const includeHeaderDoc = options.headerDocument === true || messageTemplate.header === "document";
//       const components = [];

//       if (includeHeaderDoc) {
//         components.unshift({
//           type: "header",
//           parameters: [{
//             type: "document",
//             document: { link: fileUrl, filename: pdfFilename }
//           }]
//         });

//       }

//       components.push({
//         type: "body",
//         parameters: paramArray.map((p) => ({ type: "text", text: String(p) })),
//       });

//       // 6) Send
//       for (const msisdn of numbers) {
//         const payload = {
//           type: "template",
//           messaging_product: "whatsapp",
//           to: msisdn,
//           template: {
//             namespace: "24ce09e5_33c8_4eb6_9bfc_c3e01cba4e4b",
//             name: messageTemplate.template_name || "esalesold_web",
//             language: { policy: "deterministic", code: "en" },
//             components,
//           },
//         };

//         const res = await fetch(`${apiKey}/send-whatsapp`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         });
//         const sendResult = await res.json().catch(() => ({}));
//         if (!res.ok) throw new Error(`/send-whatsapp failed (${res.status}): ${JSON.stringify(sendResult)}`);

//         console.log(`✅ Sent to ${msisdn}:`, sendResult);
//         await new Promise((r) => setTimeout(r, 2000));
//       }
//     } catch (err) {
//       console.error("❌ WhatsApp sending error:", err);
//       throw new Error("Message sending failed.");
//     }
//   };



//   return null;
// };

// export default PdfPreview;


import React from "react";
import PdfPreview_JK from "./PdfPreview_JK";
import PdfPreview_Default from "./PdfPreview_Default";

const PdfPreview = (props) => {
  const gstNo = sessionStorage.getItem("Company_GSTNO") || "";

  // Define all GST numbers that should use PdfPreview_JK
  const jkGSTs = [
    "27AAECJ8332R1ZV",
    "27AEJPS9860D1Z0",
    "27ARCPS1606H1ZW",
    "27AAMFJ4182A1ZG",
  ];

  // Check if current GST number matches any of the JK GST numbers
  const isJK = jkGSTs.includes(gstNo.toUpperCase());

  return isJK ? (
    <PdfPreview_JK {...props} />
  ) : (
    <PdfPreview_Default {...props} />
  );
};

export default PdfPreview;
