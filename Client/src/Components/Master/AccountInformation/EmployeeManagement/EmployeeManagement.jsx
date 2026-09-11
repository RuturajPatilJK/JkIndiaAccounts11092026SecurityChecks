import React, { useState, useEffect, useRef } from "react";
import ActionButtonGroup from "../../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../../Common/CommonButtons/NavigationButtons";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Button, IconButton, Dialog, DialogContent } from "@mui/material";
import PrintButton from "../../../../Common/Buttons/PrintPDF";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import UserAuditInfo from "../../../../Common/UserAuditInfo/UserAuditInfo";
import Swal from "sweetalert2";
import "./EmployeeManagement.css";

const API_URL = process.env.REACT_APP_API;

const toInputDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
};

const todayInputDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const CONTACT_NUMBER_FIELDS = new Set(["mobile_No", "Alternate_No", "Emergency_contact", "Father_Number", "WhatsApp_No"]);

const DEPARTMENT_OPTIONS = ["ChiniMandi", "eBuySugar", "Administration", "JK India General", "Not required"];
const INSURANCE_OPTIONS = ["Insurance Policy", "Mediclaim Policy"];
const CITY_OPTIONS = ["Mumbai", "Kolhapur", "Surat", "Bangalore", "Pune", "Delhi"];

const JOINING_COMPANY_OPTIONS = [
    "JK India eAgriTech Limited",
    "JK Enterprises",
    "Innoplats Infotech",
    "JK Wealth Management",
    "JK Instinct Media",
    "Agrahyah Technologies",
    "Chai Station Services",
    "JK Digital",
    "JK Samor Enterprise",
    "Autoil Associates",
    "Ruggedian Lifestyle",
    "JK Charitable Trust",
    "Lata Dixit Tech Pvt. Ltd.",
];

const emptyFamilyMember = {
    Name_of_family_Members: "",
    Nature_of_relationship: "",
    Age: "",
    occupation: "",
    Contact_No: "",
};

const EmployeeManagement = ({ isPopup = false }) => {
    const [addOneButtonEnabled, setAddOneButtonEnabled] = useState(false);
    const [saveButtonEnabled, setSaveButtonEnabled] = useState(true);
    const [cancelButtonEnabled, setCancelButtonEnabled] = useState(true);
    const [editButtonEnabled, setEditButtonEnabled] = useState(false);
    const [deleteButtonEnabled, setDeleteButtonEnabled] = useState(false);
    const [backButtonEnabled, setBackButtonEnabled] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [highlightedButton, setHighlightedButton] = useState(null);

    const companyCode = sessionStorage.getItem("Company_Code");
    const yearCode = sessionStorage.getItem("Year_Code");
    const username = sessionStorage.getItem("username");

    const navigate = useNavigate();
    const location = useLocation();
    const selectedRecord = location.state?.selectedRecord;
    const permissions = location.state?.permissionsData;
    const inputRef = useRef(null);

    const initialFormData = {
        Employee_id: "",
        doc_no: "",
        doc_date: "",
        Salutation: "Mr",
        name: "",
        Gender: "",
        Nationality: "",
        Father_Name: "",
        Father_Occupation: "",
        Father_Number: "",
        Mother_Name: "",
        Mother_Occupation: "",
        Date_of_joining: "",
        Joining_Company_Name: "",
        Resign_date: "",
        Department: "",
        Company_Location: "",
        Designation: "",
        WhatsApp_No: "",
        Insurance_Mediclaim: "",
        Birth_date: "",
        height: "",
        weight: "",
        birth_place: "",
        Any_Disability: "",
        Blood_group: "",
        Emergency_name: "",
        Emergency_Relation: "",
        Emergency_contact: "",
        Present_Address: "",
        Permanent_Address: "",
        mobile_No: "",
        employee_code: "",
        Alternate_No: "",
        email_id: "",
        Aadhar_no: "",
        Pan_no: "",
        bank_name: "",
        Account_no: "",
        ifsc_code: "",
        marital_status: "",
        upload_photo: "",
        Created_By: "",
        Modified_By: "",
        status: "Y",
    };

    const [formData, setFormData] = useState(initialFormData);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState("");
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [newFamilyMember, setNewFamilyMember] = useState(emptyFamilyMember);
    const [editingFamilyMemberId, setEditingFamilyMemberId] = useState(null);
    const [editFamilyMemberData, setEditFamilyMemberData] = useState(emptyFamilyMember);

    const handleChange = (event) => {
        const { name, value } = event.target;

        if (CONTACT_NUMBER_FIELDS.has(name)) {
            const input = event.target;
            const cursorPos = input.selectionStart ?? value.length;
            const digitsBeforeCursor = value.slice(0, cursorPos).replace(/\D/g, "").length;
            const sanitizedValue = value.replace(/\D/g, "").slice(0, 10);

            setFormData((prevState) => ({ ...prevState, [name]: sanitizedValue }));

            requestAnimationFrame(() => {
                input.setSelectionRange(digitsBeforeCursor, digitsBeforeCursor);
            });
            return;
        }

        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
            ...(name === "status" && value !== "N" ? { Resign_date: "" } : {}),
        }));
    };

    const handleMultiCheckboxChange = (fieldName, option) => {
        setFormData((prevState) => {
            const current = prevState[fieldName] ? prevState[fieldName].split(",").filter(Boolean) : [];
            const updated = current.includes(option)
                ? current.filter((v) => v !== option)
                : [...current, option];
            return { ...prevState, [fieldName]: updated.join(",") };
        });
    };

    const handlePhotoChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const buildFormData = () => {
        const fd = new FormData();
        fd.append("company_code", companyCode);
        fd.append("year_code", yearCode);
        Object.entries(formData).forEach(([key, value]) => {
            if (["Employee_id", "doc_no", "upload_photo", "Created_By", "Modified_By"].includes(key)) return;
            fd.append(key, value ?? "");
        });
        if (photoFile) {
            fd.append("photo", photoFile);
        }
        return fd;
    };

    const fetchFamilyMembers = (employeeId) => {
        if (!employeeId) {
            setFamilyMembers([]);
            return;
        }
        axios
            .get(`${API_URL}/get-employee-family-members/${employeeId}`)
            .then((response) => {
                setFamilyMembers(response.data.familyMembers || []);
            })
            .catch((error) => {
                console.error("Error fetching family members:", error);
            });
    };

    const applyRecord = (data) => {
        setFormData((prevState) => ({
            ...prevState,
            ...data,
            doc_date: toInputDate(data.doc_date),
            Date_of_joining: toInputDate(data.Date_of_joining),
            Resign_date: toInputDate(data.Resign_date),
            Birth_date: toInputDate(data.Birth_date),
        }));
        setPhotoFile(null);
        setPhotoPreview(
            data.upload_photo ? `${API_URL}/preview-employee-photo/${data.Employee_id}` : ""
        );
        fetchFamilyMembers(data.Employee_id);
    };

    const fetchNextDocNo = () => {
        axios
            .get(`${API_URL}/getlast-employee?company_code=${companyCode}&year_code=${yearCode}`)
            .then((response) => {
                setFormData((prevState) => ({
                    ...prevState,
                    doc_no: (response.data.doc_no || 0) + 1,
                }));
            })
            .catch(() => {
                setFormData((prevState) => ({
                    ...prevState,
                    doc_no: 1,
                }));
            });
    };

    const handleAddOne = () => {
        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setIsEditing(true);
        setIsEditMode(false);
        setFormData({
            ...initialFormData,
            doc_date: todayInputDate(),
            Date_of_joining: todayInputDate(),
        });
        setPhotoFile(null);
        setPhotoPreview("");
        setFamilyMembers([]);
        setNewFamilyMember(emptyFamilyMember);
        fetchNextDocNo();
        setTimeout(() => {
            inputRef.current?.focus();
        });
    };

    const afterSaveState = () => {
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setIsEditing(false);
    };

    const handleSaveOrUpdate = () => {
        if (!formData.name?.trim()) {
            toast.error("Name is required.");
            return;
        }
        if (!formData.Joining_Company_Name?.trim()) {
            toast.error("Joining Company Name is required.");
            return;
        }
        if (!/^\d{10}$/.test(formData.mobile_No || "")) {
            toast.error("Mobile No must be exactly 10 digits.");
            return;
        }
        if (formData.Alternate_No && !/^\d{10}$/.test(formData.Alternate_No)) {
            toast.error("Alternate No must be exactly 10 digits.");
            return;
        }
        if (formData.Emergency_contact && !/^\d{10}$/.test(formData.Emergency_contact)) {
            toast.error("Emergency Contact No must be exactly 10 digits.");
            return;
        }
        if (!formData.Designation?.trim()) {
            toast.error("Designation is required.");
            return;
        }
        if (!formData.Company_Location) {
            toast.error("Company location is required.");
            return;
        }
        if (!formData.Father_Occupation?.trim()) {
            toast.error("Father's Occupation is required.");
            return;
        }
        if (!/^\d{10}$/.test(formData.Father_Number || "")) {
            toast.error("Father's Number must be exactly 10 digits.");
            return;
        }
        if (!formData.Mother_Name?.trim()) {
            toast.error("Mother's Name is required.");
            return;
        }
        if (!formData.Mother_Occupation?.trim()) {
            toast.error("Mother's Occupation is required.");
            return;
        }
        const fd = buildFormData();
        if (isEditMode) {
            fd.append("Modified_By", username || "");
            axios
                .put(`${API_URL}/update-employee/${formData.Employee_id}`, fd)
                .then(async () => {
                    await Swal.fire({
                        title: "Success!",
                        text: "Record updated successfully!",
                        icon: "success",
                        confirmButtonText: "OK",
                    });
                    window.location.reload();
                })
                .catch((error) => {
                    console.error("Error updating data:", error);
                    toast.error(error.response?.data?.error || "Error updating record");
                });
        } else {
            fd.append("Created_By", username || "");
            axios
                .post(`${API_URL}/create-employee`, fd)
                .then(async (response) => {
                    const newEmployee = response.data.employee;
                    const pendingMembers = familyMembers.filter((member) => !member.employee_detail_id);
                    if (pendingMembers.length) {
                        await Promise.all(
                            pendingMembers.map((member) =>
                                axios.post(
                                    `${API_URL}/add-employee-family-member/${newEmployee.Employee_id}`,
                                    member
                                )
                            )
                        );
                    }
                    Swal.fire({
                        title: "Success!",
                        text: "Record created successfully!",
                        icon: "success",
                        confirmButtonText: "OK",
                    });
                    applyRecord(newEmployee);
                    afterSaveState();
                })
                .catch((error) => {
                    console.error("Error saving data:", error);
                    toast.error(error.response?.data?.error || "Error saving record");
                });
        }
    };

    const handleEdit = () => {
        setIsEditMode(true);
        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setBackButtonEnabled(true);
        setIsEditing(true);
    };

    const fetchLastEmployee = () => {
        axios
            .get(`${API_URL}/getlast-employee?company_code=${companyCode}&year_code=${yearCode}`)
            .then((response) => {
                applyRecord(response.data);
            })
            .catch(() => {
                setFormData(initialFormData);
                setPhotoPreview("");
                setFamilyMembers([]);
            });
    };

    const handleCancel = () => {
        fetchLastEmployee();
        setIsEditing(false);
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `You won't be able to revert this Employee: ${formData.name}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            cancelButtonText: "Cancel",
            confirmButtonText: "Delete",
            reverseButtons: true,
            focusCancel: true,
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(
                    `${API_URL}/delete-employee/${formData.Employee_id}?company_code=${companyCode}&year_code=${yearCode}`
                );
                Swal.fire({
                    title: "Deleted!",
                    text: "Record deleted successfully!",
                    icon: "success",
                    confirmButtonText: "OK",
                });
                handleCancel();
            } catch (error) {
                toast.error("Deletion cancelled");
                console.error("Error during API call:", error);
            }
        }
    };

    const handleBack = () => {
        navigate("/employee-management-utility");
    };

    const handlePrint = (blank) => {
        const data = blank ? initialFormData : formData;
        const members = blank ? [] : familyMembers;
        const mark = (checked) => (checked ? "&#9745;" : "&#9744;");
        const val = (v) => (v || "").toString();
        const salutationLabels = { Mr: "Mr.", Mrs: "Mrs.", Ms: "Ms.", Miss: "Miss", Dr: "Dr." };
        const fullName = blank || !data.name ? "" : `${salutationLabels[data.Salutation] || ""} ${data.name}`.trim();

        const printWindow = window.open("", "", "height=900,width=800");
        printWindow.document.write(`
      <html>
        <head>
          <title>Personal Data Form</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #222; }
            .print-title { text-align: center; font-size: 20px; font-weight: 700; letter-spacing: 1px;
              text-transform: uppercase; margin-bottom: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; table-layout: fixed; }
            td, th { border: 1px solid #444; padding: 12px 10px; font-size: 13px; text-align: left;
              vertical-align: middle; height: 26px; word-wrap: break-word; }
            .label { background: #f7f7f7; font-weight: 600; }
            .section { background: #e9e9e9; font-weight: 700; text-transform: uppercase; font-size: 12px; }
            .photo-box { border: 1px solid #444; width: 110px; height: 130px; float: right;
              display: flex; align-items: center; justify-content: center; text-align: center;
              font-size: 10px; color: #555; }
            .photo-box img { width: 100%; height: 100%; object-fit: cover; }
          </style>
        </head>
        <body>
          <div class="print-title">Personal Data Form
            <div class="photo-box">
              ${!blank && photoPreview ? `<img src="${photoPreview}" />` : "Passport Photograph"}
            </div>
          </div>

          <table>
            <colgroup>
              <col style="width:14%"><col style="width:19%">
              <col style="width:14%"><col style="width:19%">
              <col style="width:14%"><col style="width:20%">
            </colgroup>
            <tr>
              <td class="label">Doc No</td><td>${val(data.doc_no)}</td>
              <td class="label">Date of Joining</td><td>${val(data.Date_of_joining)}</td>
              <td class="label">Employee Code</td><td>${val(data.employee_code)}</td>
            </tr>
           
          </table>

          <table>
            <colgroup>
              <col style="width:14%"><col style="width:19%">
              <col style="width:14%"><col style="width:19%">
              <col style="width:14%"><col style="width:20%">
            </colgroup>
            <tr>
              <td class="label">Joining Company Name</td><td colspan="2">${val(data.Joining_Company_Name)}</td>
              <td class="label">Company Location</td><td colspan="2">${val(data.Company_Location)}</td>
            </tr>
            <tr>
              <td class="label">Department</td>
              <td colspan="5">
                ${DEPARTMENT_OPTIONS.map((o) => `${mark((data.Department || "").split(",").includes(o))} ${o}`).join("&nbsp;&nbsp;&nbsp;")}
              </td>
            </tr>
            <tr>
              <td class="label">Name</td><td colspan="2">${val(fullName)}</td>
              <td class="label">Designation</td><td colspan="2">${val(data.Designation)}</td>
            </tr>
            <tr>
              <td class="label">Gender</td>
              <td>${mark(data.Gender === "M")} Male &nbsp;&nbsp; ${mark(data.Gender === "F")} Female</td>
              <td class="label">Nationality</td><td>${val(data.Nationality)}</td>
              <td class="label">Father's Name</td><td>${val(data.Father_Name)}</td>
            </tr>
            <tr>
              <td class="label">Father's Occupation</td><td colspan="3">${val(data.Father_Occupation)}</td>
              <td class="label">Father's Number</td><td>${val(data.Father_Number)}</td>
            </tr>
            <tr>
              <td class="label">Mother's Name</td><td>${val(data.Mother_Name)}</td>
              <td class="label">Mother's Occupation</td><td colspan="3">${val(data.Mother_Occupation)}</td>
            </tr>
            <tr>
              <td class="label">Birth Date</td><td>${val(data.Birth_date)}</td>
              <td class="label">Height</td><td>${val(data.height)}</td>
              <td class="label">Weight</td><td>${val(data.weight)}</td>
            </tr>
            <tr>
              <td class="label">Birth Place</td><td>${val(data.birth_place)}</td>
              <td class="label">Any Disability</td><td>${val(data.Any_Disability)}</td>
              <td class="label">Blood Group</td><td>${val(data.Blood_group)}</td>
            </tr>
            <tr>
              <td class="label">Insurance / Mediclaim</td>
              <td colspan="5">
                ${INSURANCE_OPTIONS.map((o) => `${mark((data.Insurance_Mediclaim || "").split(",").includes(o))} ${o}`).join("&nbsp;&nbsp;&nbsp;")}
              </td>
            </tr>
            <tr class="section"><td colspan="6">Emergency Contact Details:</td></tr>
            <tr>
              <td class="label">Name</td><td>${val(data.Emergency_name)}</td>
              <td class="label">Relation</td><td>${val(data.Emergency_Relation)}</td>
              <td class="label">Contact No</td><td>${val(data.Emergency_contact)}</td>
            </tr>
          </table>

          <table>
            <colgroup>
              <col style="width:14%"><col style="width:19%">
              <col style="width:14%"><col style="width:19%">
              <col style="width:14%"><col style="width:20%">
            </colgroup>
            <tr><td class="label">Present Address with Landmark:</td><td colspan="5">${val(data.Present_Address)}</td></tr>
            <tr><td class="label">Permanent Address with Landmark:</td><td colspan="5">${val(data.Permanent_Address)}</td></tr>
            <tr>
              <td class="label">Mobile No.:</td><td colspan="2">${val(data.mobile_No)}</td>
              <td class="label">Alternate No.:</td><td colspan="2">${val(data.Alternate_No)}</td>
            </tr>
            <tr>
              <td class="label">WhatsApp Number</td><td colspan="2">${val(data.WhatsApp_No)}</td>
              <td class="label">Email ID:</td><td colspan="2">${val(data.email_id)}</td>
            </tr>

            <tr class="section"><td colspan="2">Identity &amp; Banking Details</td></tr>
            <tr>
              <td class="label">Aadhar No.:</td><td colspan="2">${val(data.Aadhar_no)}</td>
              <td class="label">PAN No.:</td><td colspan="2">${val(data.Pan_no)}</td>
            </tr>
            <tr>
              <td class="label">Bank Name:</td><td colspan="2">${val(data.bank_name)}</td>
              <td class="label">Account No.:</td><td colspan="2">${val(data.Account_no)}</td>
            </tr>
            <tr><td class="label">IFSC Code:</td><td colspan="5">${val(data.ifsc_code)}</td></tr>
            <tr>
              <td colspan="6">
                ${["Single", "Married", "Widowed", "Separated", "Divorced"]
                .map((option) => `${mark(data.marital_status === option)} ${option}`)
                .join("&nbsp;&nbsp;&nbsp;")}
              </td>
            </tr>
          </table>

          <div>
            <table>
              <tr class="section"><td>Family Background</td></tr>
            </table>
            <table>
              <tr>
                <th>Name of family members</th>
                <th>Nature of Relationship*</th>
                <th>Age</th>
                <th>Occupation</th>
                <th>Contact No</th>
              </tr>
              ${members.length
                ? members
                    .map(
                        (m) => `
                <tr>
                  <td>${val(m.Name_of_family_Members)}</td>
                  <td>${val(m.Nature_of_relationship)}</td>
                  <td>${val(m.Age)}</td>
                  <td>${val(m.occupation)}</td>
                  <td>${val(m.Contact_No)}</td>
                </tr>`
                    )
                    .join("")
                : `<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
                     <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
                     <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`
            }
            </table>
          </div>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const handleFirstButtonClick = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/get_First_Employee_Record?company_code=${companyCode}&year_code=${yearCode}`
            );
            applyRecord(response.data);
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    const handlePreviousButtonClick = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/get_Previous_Employee_Record?company_code=${companyCode}&year_code=${yearCode}&employee_id=${formData.Employee_id}`
            );
            applyRecord(response.data);
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    const handleNextButtonClick = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/get_Next_Employee_Record?company_code=${companyCode}&year_code=${yearCode}&employee_id=${formData.Employee_id}`
            );
            applyRecord(response.data);
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    const handleLastButtonClick = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/get_Last_Employee_Record?company_code=${companyCode}&year_code=${yearCode}`
            );
            applyRecord(response.data);
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    const handlerecordDoubleClicked = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/get-employee/${selectedRecord.Employee_id}?company_code=${companyCode}&year_code=${yearCode}`
            );
            applyRecord(response.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setIsEditing(false);
    };

    useEffect(() => {
        if (selectedRecord && !isPopup) {
            handlerecordDoubleClicked();
        } else {
            handleAddOne();
        }
    }, [selectedRecord]);

    const handleKeyDown = async (event) => {
        if (event.key === "Tab") {
            const docNoValue = event.target.value;
            if (!docNoValue) return;
            try {
                const response = await axios.get(
                    `${API_URL}/get-employee-by-doc-no?doc_no=${docNoValue}&company_code=${companyCode}&year_code=${yearCode}`
                );
                applyRecord(response.data);
                setIsEditing(false);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }
    };

    // ---- Family members ----
    const handleNewFamilyMemberChange = (event) => {
        const { name, value } = event.target;
        setNewFamilyMember((prev) => ({ ...prev, [name]: value }));
    };

    const getMemberKey = (member) => member.employee_detail_id ?? member._tempId;

    const handleAddFamilyMember = async () => {
        if (!newFamilyMember.Name_of_family_Members) {
            toast.info("Family member name is required.");
            return;
        }

        if (!formData.Employee_id) {
            // Employee isn't saved yet — keep it locally and push it to the server
            // once the employee is created (see handleSaveOrUpdate).
            setFamilyMembers((prev) => [
                ...prev,
                { ...newFamilyMember, _tempId: `temp-${Date.now()}-${Math.random()}` },
            ]);
            setNewFamilyMember(emptyFamilyMember);
            return;
        }

        try {
            const response = await axios.post(
                `${API_URL}/add-employee-family-member/${formData.Employee_id}`,
                newFamilyMember
            );
            setFamilyMembers((prev) => [...prev, response.data.familyMember]);
            setNewFamilyMember(emptyFamilyMember);
        } catch (error) {
            console.error("Error adding family member:", error);
            toast.error("Error adding family member");
        }
    };

    const handleDeleteFamilyMember = async (member) => {
        if (!member.employee_detail_id) {
            setFamilyMembers((prev) => prev.filter((m) => getMemberKey(m) !== getMemberKey(member)));
            return;
        }
        try {
            await axios.delete(`${API_URL}/delete-employee-family-member/${member.employee_detail_id}`);
            setFamilyMembers((prev) =>
                prev.filter((m) => m.employee_detail_id !== member.employee_detail_id)
            );
        } catch (error) {
            console.error("Error deleting family member:", error);
            toast.error("Error deleting family member");
        }
    };

    const handleEditFamilyMemberClick = (member) => {
        setEditingFamilyMemberId(getMemberKey(member));
        setEditFamilyMemberData({
            Name_of_family_Members: member.Name_of_family_Members || "",
            Nature_of_relationship: member.Nature_of_relationship || "",
            Age: member.Age ?? "",
            occupation: member.occupation || "",
            Contact_No: member.Contact_No || "",
        });
    };

    const handleEditFamilyMemberChange = (event) => {
        const { name, value } = event.target;
        setEditFamilyMemberData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCancelEditFamilyMember = () => {
        setEditingFamilyMemberId(null);
        setEditFamilyMemberData(emptyFamilyMember);
    };

    const handleSaveFamilyMemberEdit = async (member) => {
        if (!member.employee_detail_id) {
            setFamilyMembers((prev) =>
                prev.map((m) =>
                    getMemberKey(m) === getMemberKey(member) ? { ...m, ...editFamilyMemberData } : m
                )
            );
            handleCancelEditFamilyMember();
            return;
        }
        try {
            const response = await axios.put(
                `${API_URL}/update-employee-family-member/${member.employee_detail_id}`,
                editFamilyMemberData
            );
            setFamilyMembers((prev) =>
                prev.map((m) =>
                    m.employee_detail_id === member.employee_detail_id ? response.data.familyMember : m
                )
            );
            handleCancelEditFamilyMember();
        } catch (error) {
            console.error("Error updating family member:", error);
            toast.error("Error updating family member");
        }
    };

    const fieldsDisabled = !isEditing && addOneButtonEnabled;

    return (
        <>
            {!isPopup && (
                <div>
                    <UserAuditInfo
                        createdBy={formData.Created_By}
                        modifiedBy={formData.Modified_By}
                        title={"PERSONAL DATA FORM"}
                    />
                    <br />
                    <br />
                    <br />
                    <ToastContainer autoClose={800} />
                    <ActionButtonGroup
                        handleAddOne={handleAddOne}
                        addOneButtonEnabled={addOneButtonEnabled}
                        handleSaveOrUpdate={handleSaveOrUpdate}
                        saveButtonEnabled={saveButtonEnabled}
                        isEditMode={isEditMode}
                        handleEdit={handleEdit}
                        editButtonEnabled={editButtonEnabled}
                        handleDelete={handleDelete}
                        deleteButtonEnabled={deleteButtonEnabled}
                        handleCancel={handleCancel}
                        cancelButtonEnabled={cancelButtonEnabled}
                        handleBack={handleBack}

                        backButtonEnabled={backButtonEnabled}
                        permissions={permissions}
                        nextTabIndex={30}
                    />

                    <div>
                        <NavigationButtons
                            handleFirstButtonClick={handleFirstButtonClick}
                            handlePreviousButtonClick={handlePreviousButtonClick}
                            handleNextButtonClick={handleNextButtonClick}
                            handleLastButtonClick={handleLastButtonClick}
                            highlightedButton={highlightedButton}
                            isEditing={isEditing}
                            isFirstRecord={formData.Employee_id === 1}

                        />
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <PrintButton label="Print" fetchData={() => handlePrint(false)} />
                        <PrintButton label="Print Blank Form" fetchData={() => handlePrint(true)} />
                    </div>

                </div>
            )}

            <div className="pdf-form-wrapper">
                <form>
                    <table className="pdf-form-table pdf-system-strip">
                        <tbody>
                            <tr>
                                <td className="pdf-label-cell">Change No</td>
                                <td className="pdf-input-cell">
                                    <input
                                        name="changeNo"
                                        autoComplete="off"
                                        onKeyDown={handleKeyDown}
                                        disabled={!addOneButtonEnabled}
                                    />
                                </td>
                                <td className="pdf-label-cell">Doc No</td>
                                <td className="pdf-input-cell">
                                    <input name="doc_no" value={formData.doc_no} disabled />
                                </td>
                                <td className="pdf-label-cell">Doc Date</td>
                                <td className="pdf-input-cell">
                                    <input
                                        type="date"
                                        name="doc_date"
                                        value={formData.doc_date}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="pdf-label-cell">Employee Code</td>
                                <td className="pdf-input-cell">
                                    <input
                                        name="employee_code"
                                        value={formData.employee_code}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                                <td className="pdf-label-cell">Status</td>
                                <td className="pdf-input-cell">
                                    <div className="pdf-radio-group">
                                        <label>
                                            <input
                                                type="radio"
                                                name="status"
                                                value="Y"
                                                checked={formData.status === "Y"}
                                                onChange={handleChange}
                                                disabled={fieldsDisabled}
                                            />
                                            Active
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="status"
                                                value="N"
                                                checked={formData.status === "N"}
                                                onChange={handleChange}
                                                disabled={fieldsDisabled}
                                            />
                                            Inactive
                                        </label>
                                    </div>
                                </td>
                                <td className="pdf-label-cell">Resign Date</td>
                                <td className="pdf-input-cell">
                                    <input
                                        type="date"
                                        name="Resign_date"
                                        value={formData.Resign_date}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled || formData.status !== "N"}
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>



                    <table className="pdf-form-table">
                        <tbody>
                            <tr>
                                <td className="pdf-label-cell">DOJ</td>
                                <td className="pdf-input-cell">
                                    <input
                                        type="date"
                                        name="Date_of_joining"
                                        value={formData.Date_of_joining}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                                <td className="pdf-label-cell">Photo</td>
                                <td className="pdf-input-cell" colSpan={3}>
                                    <div className="pdf-photo-row">
                                        {photoPreview ? (
                                            <img
                                                src={photoPreview}
                                                alt="Employee"
                                                className="pdf-photo-img-inline"
                                                onClick={() => setPhotoModalOpen(true)}
                                                style={{ cursor: "pointer" }}
                                            />
                                        ) : (
                                            <div className="pdf-photo-placeholder-inline">No Photo</div>
                                        )}
                                        <Button size="small" variant="outlined" component="label" disabled={fieldsDisabled}>
                                            Upload Photo
                                            <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="pdf-label-cell">Joining Company Name*</td>
                                <td className="pdf-input-cell" colSpan={2}>
                                    <select
                                        name="Joining_Company_Name"
                                        ref={inputRef}
                                        value={formData.Joining_Company_Name}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                        required
                                    >
                                        <option value="">Choose</option>
                                        {JOINING_COMPANY_OPTIONS.map((company) => (
                                            <option key={company} value={company}>
                                                {company}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="pdf-label-cell">Company Location*</td>
                                <td className="pdf-input-cell" colSpan={2}>
                                    <select
                                        name="Company_Location"
                                        value={formData.Company_Location}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                        required
                                    >
                                        <option value="">Choose</option>
                                        {CITY_OPTIONS.map((city) => (
                                            <option key={city} value={city}>
                                                {city}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                            <tr>

                            </tr>
                            <tr>
                                <td className="pdf-label-cell">Department in JK India</td>
                                <td className="pdf-input-cell" colSpan={6}>
                                    <div className="pdf-checkbox-group">
                                        {DEPARTMENT_OPTIONS.map((option) => (
                                            <label key={option}>
                                                <input
                                                    type="checkbox"
                                                    checked={(formData.Department || "").split(",").includes(option)}
                                                    onChange={() => handleMultiCheckboxChange("Department", option)}
                                                    disabled={fieldsDisabled}
                                                />
                                                {option}
                                            </label>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="pdf-label-cell">Name*</td>
                                <td className="pdf-input-cell" colSpan={2}>
                                    <div className="pdf-name-row">

                                        <input
                                            name="name"
                                            autoComplete="off"
                                            value={formData.name}
                                            onChange={handleChange}

                                            disabled={fieldsDisabled}
                                            required
                                            className="pdf-name-input"
                                        />
                                    </div>
                                </td>
                                <td className="pdf-label-cell">Designation*</td>
                                <td className="pdf-input-cell" colSpan={2} >
                                    <input
                                        name="Designation"
                                        autoComplete="off"
                                        value={formData.Designation}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                        required
                                    />
                                </td>
                            </tr>

                            <tr>
                                <td className="pdf-label-cell">Gender</td>
                                <td className="pdf-input-cell">
                                    <div className="pdf-radio-group">
                                        <label>
                                            <input
                                                type="radio"
                                                name="Gender"
                                                value="M"
                                                checked={formData.Gender === "M"}
                                                onChange={handleChange}
                                                disabled={fieldsDisabled}
                                            />
                                            Male
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="Gender"
                                                value="F"
                                                checked={formData.Gender === "F"}
                                                onChange={handleChange}
                                                disabled={fieldsDisabled}
                                            />
                                            Female
                                        </label>
                                    </div>
                                </td>
                                <td className="pdf-label-cell">Nationality</td>
                                <td className="pdf-input-cell">
                                    <input
                                        name="Nationality"
                                        value={formData.Nationality}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                                <td className="pdf-label-cell">Father's Name</td>
                                <td className="pdf-input-cell">
                                    <input
                                        name="Father_Name"
                                        value={formData.Father_Name}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                            </tr>

                            <tr>
                                <td className="pdf-label-cell">Father's Occupation*</td>
                                <td className="pdf-input-cell" colSpan={3}>
                                    <input
                                        name="Father_Occupation"
                                        value={formData.Father_Occupation}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                        required
                                    />
                                </td>
                                <td className="pdf-label-cell">Father's Number*</td>
                                <td className="pdf-input-cell" >
                                    <input
                                        name="Father_Number"
                                        value={formData.Father_Number}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                        inputMode="numeric"
                                        maxLength={10}
                                        required
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="pdf-label-cell">Mother's Name*</td>
                                <td className="pdf-input-cell">
                                    <input
                                        name="Mother_Name"
                                        value={formData.Mother_Name}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                        required
                                    />
                                </td>
                                <td className="pdf-label-cell">Mother's Occupation*</td>
                                <td className="pdf-input-cell" colSpan={3}>
                                    <input
                                        name="Mother_Occupation"
                                        value={formData.Mother_Occupation}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                        required
                                    />
                                </td>
                            </tr>

                            <tr>
                                <td className="pdf-label-cell">Birth Date</td>
                                <td className="pdf-input-cell">
                                    <input
                                        type="date"
                                        name="Birth_date"
                                        value={formData.Birth_date}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                                <td className="pdf-label-cell">Height</td>
                                <td className="pdf-input-cell">
                                    <input
                                        name="height"
                                        value={formData.height}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                                <td className="pdf-label-cell">Weight</td>
                                <td className="pdf-input-cell">
                                    <input
                                        name="weight"
                                        value={formData.weight}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="pdf-label-cell">Birth Place</td>
                                <td className="pdf-input-cell">
                                    <input
                                        name="birth_place"
                                        value={formData.birth_place}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                                <td className="pdf-label-cell">Any Disability</td>
                                <td className="pdf-input-cell">
                                    <input
                                        name="Any_Disability"
                                        value={formData.Any_Disability}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                                <td className="pdf-label-cell">Blood Group</td>
                                <td className="pdf-input-cell">
                                    <input
                                        name="Blood_group"
                                        value={formData.Blood_group}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="pdf-label-cell">Insurance / Mediclaim</td>
                                <td className="pdf-input-cell" colSpan={5}>
                                    <div className="pdf-checkbox-group">
                                        {INSURANCE_OPTIONS.map((option) => (
                                            <label key={option}>
                                                <input
                                                    type="checkbox"
                                                    checked={(formData.Insurance_Mediclaim || "").split(",").includes(option)}
                                                    onChange={() => handleMultiCheckboxChange("Insurance_Mediclaim", option)}
                                                    disabled={fieldsDisabled}
                                                />
                                                {option}
                                            </label>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                            <tr className="pdf-section-header">
                                <td colSpan={6}>Emergency Contact Details:</td>
                            </tr>
                            <tr>
                                <td className="pdf-label-cell">Name</td>
                                <td className="pdf-input-cell">
                                    <input
                                        name="Emergency_name"
                                        value={formData.Emergency_name}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                                <td className="pdf-label-cell">Relation</td>
                                <td className="pdf-input-cell">
                                    <input
                                        name="Emergency_Relation"
                                        value={formData.Emergency_Relation}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                                <td className="pdf-label-cell">Contact No</td>
                                <td className="pdf-input-cell">
                                    <input
                                        name="Emergency_contact"
                                        value={formData.Emergency_contact}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                        inputMode="numeric"
                                        maxLength={10}
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table className="pdf-form-table" style={{ marginTop: 16 }}>
                        <tbody>
                            <tr>
                                <td className="pdf-label-cell">Present Address with Landmark:</td>
                                <td className="pdf-input-cell" colSpan={5}>
                                    <textarea
                                        name="Present_Address"
                                        value={formData.Present_Address}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                        rows={1}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="pdf-label-cell">Permanent Address with Landmark</td>
                                <td className="pdf-input-cell" colSpan={5}>
                                    <textarea
                                        name="Permanent_Address"
                                        value={formData.Permanent_Address}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                        rows={1}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="pdf-label-cell">Mobile No.*</td>
                                <td className="pdf-input-cell" colSpan={2}>
                                    <input
                                        name="mobile_No"
                                        value={formData.mobile_No}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                        inputMode="numeric"
                                        maxLength={10}
                                        required
                                    />
                                </td>
                                <td className="pdf-label-cell">Alternate No.:</td>
                                <td className="pdf-input-cell" colSpan={2}>
                                    <input
                                        name="Alternate_No"
                                        value={formData.Alternate_No}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                        inputMode="numeric"
                                        maxLength={10}
                                    />
                                </td>

                            </tr>
                            <tr>

                                <td className="pdf-label-cell">WhatsApp Number</td>
                                <td className="pdf-input-cell" colSpan={2}>
                                    <input
                                        name="WhatsApp_No"
                                        value={formData.WhatsApp_No}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                        inputMode="numeric"
                                        maxLength={10}
                                    />
                                </td>

                                <td className="pdf-label-cell">Email ID:</td>
                                <td className="pdf-input-cell" colSpan={2}>
                                    <input
                                        name="email_id"
                                        value={formData.email_id}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                            </tr>
                            <tr className="pdf-section-header">
                                <td colSpan={6}>Identity &amp; Banking Details</td>
                            </tr>
                            <tr>
                                <td className="pdf-label-cell">Aadhar No.:</td>
                                <td className="pdf-input-cell" colSpan={2}>
                                    <input
                                        name="Aadhar_no"
                                        value={formData.Aadhar_no}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                                <td className="pdf-label-cell">PAN No.:</td>
                                <td className="pdf-input-cell" colSpan={3}>
                                    <input
                                        name="Pan_no"
                                        value={formData.Pan_no}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="pdf-label-cell">Bank Name:</td>
                                <td className="pdf-input-cell" colSpan={2}>
                                    <input
                                        name="bank_name"
                                        value={formData.bank_name}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                                <td className="pdf-label-cell">Account No.:</td>
                                <td className="pdf-input-cell" colSpan={3}>
                                    <input
                                        name="Account_no"
                                        value={formData.Account_no}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="pdf-label-cell">IFSC Code:</td>
                                <td className="pdf-input-cell" colSpan={5}>
                                    <input
                                        name="ifsc_code"
                                        value={formData.ifsc_code}
                                        onChange={handleChange}
                                        disabled={fieldsDisabled}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={6}>
                                    <div className="pdf-checkbox-group">
                                        {["Single", "Married", "Widowed", "Separated", "Divorced"].map((option) => (
                                            <label key={option}>
                                                <input
                                                    type="checkbox"
                                                    name="marital_status"
                                                    checked={formData.marital_status === option}
                                                    onChange={() =>
                                                        handleChange({
                                                            target: {
                                                                name: "marital_status",
                                                                value: formData.marital_status === option ? "" : option,
                                                            },
                                                        })
                                                    }
                                                    disabled={fieldsDisabled}
                                                />
                                                {option}
                                            </label>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                            <tr className="pdf-section-header">
                                <td colSpan={6}>Family Background</td>
                            </tr>
                            <tr>
                                <td colSpan={6} style={{ padding: 0 }}>
                                    <table className="pdf-family-table">
                                        <thead>
                                            <tr>
                                                <th>Name of family members</th>
                                                <th>Nature of Relationship*</th>
                                                <th>Age</th>
                                                <th>Occupation</th>
                                                <th>Contact No</th>
                                                <th style={{ width: 80 }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {familyMembers.map((member) =>
                                                editingFamilyMemberId === getMemberKey(member) ? (
                                                    <tr key={getMemberKey(member)}>
                                                        <td>
                                                            <input
                                                                name="Name_of_family_Members"
                                                                value={editFamilyMemberData.Name_of_family_Members}
                                                                onChange={handleEditFamilyMemberChange}
                                                                placeholder="Name"
                                                                disabled={fieldsDisabled}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                name="Nature_of_relationship"
                                                                value={editFamilyMemberData.Nature_of_relationship}
                                                                onChange={handleEditFamilyMemberChange}
                                                                placeholder="Relationship"
                                                                disabled={fieldsDisabled}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                name="Age"
                                                                type="number"
                                                                value={editFamilyMemberData.Age}
                                                                onChange={handleEditFamilyMemberChange}
                                                                placeholder="Age"
                                                                disabled={fieldsDisabled}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                name="occupation"
                                                                value={editFamilyMemberData.occupation}
                                                                onChange={handleEditFamilyMemberChange}
                                                                placeholder="Occupation"
                                                                disabled={fieldsDisabled}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                name="Contact_No"
                                                                value={editFamilyMemberData.Contact_No}
                                                                onChange={handleEditFamilyMemberChange}
                                                                placeholder="Contact No"
                                                                inputMode="numeric"
                                                                maxLength={10}
                                                                disabled={fieldsDisabled}
                                                            />
                                                        </td>
                                                        <td>
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleSaveFamilyMemberEdit(member)}
                                                                disabled={fieldsDisabled}
                                                            >
                                                                <SaveIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                onClick={handleCancelEditFamilyMember}
                                                                disabled={fieldsDisabled}
                                                            >
                                                                <CloseIcon fontSize="small" />
                                                            </IconButton>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    <tr key={getMemberKey(member)}>
                                                        <td>{member.Name_of_family_Members}</td>
                                                        <td>{member.Nature_of_relationship}</td>
                                                        <td>{member.Age}</td>
                                                        <td>{member.occupation}</td>
                                                        <td>{member.Contact_No}</td>
                                                        <td>
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleEditFamilyMemberClick(member)}
                                                                disabled={fieldsDisabled}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteFamilyMember(member)}
                                                                disabled={fieldsDisabled}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                            <tr>
                                                <td>
                                                    <input
                                                        name="Name_of_family_Members"
                                                        value={newFamilyMember.Name_of_family_Members}
                                                        onChange={handleNewFamilyMemberChange}
                                                        placeholder="Name"
                                                        disabled={fieldsDisabled}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        name="Nature_of_relationship"
                                                        value={newFamilyMember.Nature_of_relationship}
                                                        onChange={handleNewFamilyMemberChange}
                                                        placeholder="Relationship"
                                                        disabled={fieldsDisabled}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        name="Age"
                                                        type="number"
                                                        value={newFamilyMember.Age}
                                                        onChange={handleNewFamilyMemberChange}
                                                        placeholder="Age"
                                                        disabled={fieldsDisabled}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        name="occupation"
                                                        value={newFamilyMember.occupation}
                                                        onChange={handleNewFamilyMemberChange}
                                                        placeholder="Occupation"
                                                        disabled={fieldsDisabled}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        name="Contact_No"
                                                        value={newFamilyMember.Contact_No}
                                                        onChange={handleNewFamilyMemberChange}
                                                        placeholder="Contact No"
                                                        inputMode="numeric"
                                                        maxLength={10}
                                                        disabled={fieldsDisabled}
                                                    />
                                                </td>
                                                <td>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={handleAddFamilyMember}
                                                        disabled={fieldsDisabled}
                                                    >
                                                        Add
                                                    </Button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </form>
            </div>

            <Dialog open={photoModalOpen} onClose={() => setPhotoModalOpen(false)} maxWidth="sm">
                <DialogContent sx={{ p: 1, display: "flex", justifyContent: "center" }}>
                    <img
                        src={photoPreview}
                        alt="Employee"
                        style={{ maxWidth: "100%", maxHeight: "80vh", display: "block" }}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default EmployeeManagement;
