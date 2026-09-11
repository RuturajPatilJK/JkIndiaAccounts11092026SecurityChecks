import React, { useState, useEffect, useRef } from "react";
import "../Navbar/Navbar.css";
import { Link } from "react-router-dom";
import logo from "../../Assets/jkIndia.png";
import eBuySugarLogo from "../../Assets/eBuySugarlogo.png";
import { useNavigate } from "react-router-dom";
import { FaCaretRight, FaBars, FaTimes } from 'react-icons/fa';
import AvatarIcon from "../../Common/AvtarIcon/AvtarIconNavbar";
import Swal from 'sweetalert2';
import axios from 'axios';

import {
  ClipboardDocumentCheckIcon, BookOpenIcon, TruckIcon, ChartBarIcon, ScaleIcon,
  DocumentTextIcon, CurrencyDollarIcon, EnvelopeIcon, ChevronRightIcon, ChevronDownIcon,
  ShoppingCartIcon, ReceiptPercentIcon, ArrowPathIcon, ArrowsRightLeftIcon, BanknotesIcon,
  ArrowDownTrayIcon, ShoppingBagIcon, CreditCardIcon, WrenchScrewdriverIcon, UserPlusIcon,
  UserGroupIcon, FolderIcon, CalendarIcon, LockOpenIcon, MegaphoneIcon, BuildingOfficeIcon,
  FolderPlusIcon, CalendarDaysIcon, CheckBadgeIcon, BuildingLibraryIcon, LinkIcon, MapPinIcon,
  DocumentChartBarIcon, UserCircleIcon, CogIcon, TagIcon, GlobeAltIcon, DevicePhoneMobileIcon,
  CursorArrowRaysIcon, CalculatorIcon, ClockIcon, ClipboardDocumentListIcon, ShieldCheckIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

const API_URL = process.env.REACT_APP_API;

const Navbar = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeSubMenu, setActiveSubMenu] = useState("");
  const [clickedMenu, setClickedMenu] = useState("");
  const [hoveredSubMenuItem, setHoveredSubMenuItem] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileOpenMenus, setMobileOpenMenus] = useState({});
  const navbarRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const [username, setUsername] = useState("");
  const companyCode = sessionStorage.getItem("Company_Code");
  const uid = sessionStorage.getItem("uid");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const navigate = useNavigate();

  const handleMouseEnter = (menuName) => {
    if (window.innerWidth > 768) {
      setActiveMenu(menuName);
      if (!clickedMenu) {
        setActiveSubMenu("");
      }
    }
  };

  const handleSubMouseEnter = (subMenuName) => {
    if (window.innerWidth > 768) {
      setActiveSubMenu(subMenuName);
    }
  };

  // const handleMouseLeave = (event) => {
  //   if (window.innerWidth > 768) {
  //     if (navbarRef.current && !navbarRef.current.contains(event.target)) {
  //       setActiveMenu("");
  //       setActiveSubMenu("");
  //       setHoveredSubMenuItem("");
  //     }
  //   }
  // };



  const handleMouseLeave = () => {
    if (window.innerWidth > 768 && !clickedMenu) {
      setActiveMenu(null);
      setActiveSubMenu(null);
    }
  };


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth > 768) {
        if (
          navbarRef.current &&
          !navbarRef.current.contains(event.target)
        ) {
          setActiveMenu(null);
          setActiveSubMenu(null);
          setClickedMenu("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClick = (menuName) => {
    if (window.innerWidth > 768) {
      if (clickedMenu === menuName) {
        setClickedMenu("");
        setActiveMenu("");
        setActiveSubMenu("");
      } else {
        setClickedMenu(menuName);
        setActiveMenu(menuName);
        setActiveSubMenu(menuName);
      }
    }
  };

  // Mobile menu handlers
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (!isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  const toggleMobileSubMenu = (menuName) => {
    setMobileOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = 'auto';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth <= 768) {
        if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) &&
          !event.target.closest('.mobile-menu-button')) {
          setIsMobileMenuOpen(false);
          document.body.style.overflow = 'auto';
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
        document.body.style.overflow = 'auto';
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOpenBalanceStock = () => {
    const url = '/balance-stock';
    window.open(url, '_blank');
    closeMobileMenu();
  };

  const handleEwaybill = () => {
    const url = '/ewaybill';
    window.open(url, '_blank');
    closeMobileMenu();
  };

  const handleAnalytics = () => {
    const url = '/Analytics';
    window.open(url, '_blank');
    closeMobileMenu();
  };

  const handleFundManagement = () => {
    const url = '/fundmanagement';
    window.open(url, '_blank');
    closeMobileMenu();
  };


  // const handleClosingStock = () => {
  //   const url = '/ClosingStock-report';
  //   window.open(url, '_blank');
  //   closeMobileMenu();
  // };


  const handleSalryCliked = async () => {
    setIsLoading(true);
    try {
      const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/genratesalary&uid=${uid}`;
      const response = await axios.get(userCheckUrl);
      const userDetails = response.data?.UserDetails;

      if (userDetails?.canView === "Y") {
        window.open("/genratesalary", "_blank");
      } else {
        Swal.fire({
          title: 'Access Denied!',
          text: 'You do not have Permission to view Posting Salary',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      Swal.fire({
        title: 'Access Denied!',
        text: 'You do not have Permission to view Posting Salary.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsLoading(false);
    }
    closeMobileMenu();
  };

  const handleBroadCastCliked = async () => {
    setIsLoading(true);
    try {
      const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/send-message&uid=${uid}`;
      const response = await axios.get(userCheckUrl);
      const userDetails = response.data?.UserDetails;

      if (userDetails?.canView === "Y") {
        window.open("/send-message", "_blank");
      } else {
        Swal.fire({
          title: 'Access Denied!',
          text: 'You do not have Permission to view BroadCast Messasges',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      Swal.fire({
        title: 'Access Denied!',
        text: 'You do not have Permission to view BroadCast Messasges.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsLoading(false);
    }
    closeMobileMenu();
  };

  const handleFileSystem = async () => {
    setIsLoading(true);
    try {
      const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/filesystemdashboard&uid=${uid}`;
      const response = await axios.get(userCheckUrl);
      const userDetails = response.data?.UserDetails;

      if (userDetails?.canView === "Y") {
        window.open("/filesystemdashboard", "_blank");
      } else {
        Swal.fire({
          title: 'Access Denied!',
          text: 'You do not have Permission to view File Management.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      Swal.fire({
        title: 'Access Denied!',
        text: 'You do not have Permission to view File Management.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsLoading(false);
    }
    closeMobileMenu();
  };

  const handleTrialBalanceScreen = async () => {
    setIsLoading(true);
    try {
      const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/TrialBalancescreen&uid=${uid}`;
      const response = await axios.get(userCheckUrl);
      const userDetails = response.data?.UserDetails;

      if (userDetails?.canView === "Y") {
        window.open("/TrialBalancescreen", "_blank");
      } else {
        Swal.fire({
          title: 'Access Denied!',
          text: 'You do not have Permission to view Trail Balance Screen.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      Swal.fire({
        title: 'Access Denied!',
        text: 'You do not have Permission to view Trail Balance Screen.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsLoading(false);
    }
    closeMobileMenu();
  };




  const handleEBuySugarClicked = async () => {
    setIsLoading(true);
    try {
      const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/ebuysugar&uid=${uid}`;
      const response = await axios.get(userCheckUrl);
      const userDetails = response.data?.UserDetails;
      if (userDetails?.canView === "Y") {
        window.open("/ebuysugar?standalone=1", "_blank");
      } else {
        Swal.fire({
          title: 'Access Denied!',
          text: 'You do not have permission to view eBuySugar.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      Swal.fire({
        title: 'Access Denied!',
        text: 'You do not have permission to view eBuySugar.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsLoading(false);
    }
    closeMobileMenu();
  };

  const handleClosingStock = async () => {
    setIsLoading(true);
    try {
      const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/ClosingStock-report&uid=${uid}`;
      const response = await axios.get(userCheckUrl);
      const userDetails = response.data?.UserDetails;

      if (userDetails?.canView === "Y") {
        window.open("/ClosingStock-report", "_blank");
      } else {
        Swal.fire({
          title: 'Access Denied!',
          text: 'You do not have Permission to view Closing Stock Report.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      Swal.fire({
        title: 'Access Denied!',
        text: 'You do not have Permission to view Closing Stock Report.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsLoading(false);
    }
    closeMobileMenu();
  };

  const handleRiskManagementClicked = async () => {
    setIsLoading(true);
    try {
      const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/RiskManagement&uid=${uid}`;
      const response = await axios.get(userCheckUrl);
      const userDetails = response.data?.UserDetails;

      if (userDetails?.canView === "Y") {
        navigate("/RiskManagement");
      } else {
        Swal.fire({
          title: 'Access Denied!',
          text: 'You do not have Permission to view Risk Management.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      Swal.fire({
        title: 'Access Denied!',
        text: 'You do not have Permission to view Risk Management.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsLoading(false);
    }
    closeMobileMenu();
  };

  const handleGoogleAnalytics = async () => {
    setIsLoading(true);
    try {
      const userCheckUrl = `${API_URL}/get_user_permissions?Company_Code=${companyCode}&Program_Name=/google-analytics&uid=${uid}`;
      const response = await axios.get(userCheckUrl);
      const userDetails = response.data?.UserDetails;
      if (userDetails?.canView === "Y") {
        window.open("/google-analytics", "_blank");
      } else {
        Swal.fire({
          title: 'Access Denied!',
          text: 'You do not have permission to view Google Analytics.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      Swal.fire({
        title: 'Access Denied!',
        text: 'You do not have permission to view Google Analytics.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsLoading(false);
    }
    closeMobileMenu();
  };


  const handleLogoClick = () => {
    navigate('/dashboard');
    closeMobileMenu();
  };


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth > 768) {
        if (
          navbarRef.current &&
          !navbarRef.current.contains(event.target)
        ) {
          setActiveMenu(null);
          setActiveSubMenu(null);
          setClickedMenu("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Navigation items data
  const navItems = [
    {
      name: "Company",
      items: [
        { to: "/create-utility", icon: BuildingOfficeIcon, text: "Create Company" },
        { to: "/select-company", icon: CheckBadgeIcon, text: "Select Company" },
        { to: "/create-accounting-year", icon: FolderPlusIcon, text: "Create Accounting Year" },
        { to: "/select-accounting-year", icon: CalendarDaysIcon, text: "Select Accounting Year" }
      ]
    },
    {
      name: "Master",
      hasSubmenus: true,
      items: [
        {
          name: "Account Information",
          icon: UserCircleIcon,
          subItems: [
            { to: "/AccountMaster-utility", icon: UserCircleIcon, text: "Account Master" },
            { action: handleRiskManagementClicked, icon: CursorArrowRaysIcon, text: "Risk Management" },
            { to: "/CustomerLimit", icon: CursorArrowRaysIcon, text: "Customer Limits" },
            { to: "/financial-groups-utility", icon: BuildingLibraryIcon, text: "Financial Groups" },
            { to: "/city-master-utility", icon: MapPinIcon, text: "City Master" },
            { to: "/PartyUnitMaster-utility", icon: BuildingLibraryIcon, text: "Corporate Customer Unit/Godown" },
            { to: "/ac-master-declaration", icon: DocumentTextIcon, text: "TDS Declaration" },
             { to: "/employee-management-utility", icon: UserGroupIcon, text: "Employee Management" },
            { to: "/bank-details", icon: BanknotesIcon, text: "Bank Details" }
          ]
        },
        {
          name: "Other Master",
          icon: CursorArrowRaysIcon,
          subItems: [
            { to: "/syetem-masterutility", icon: CogIcon, text: "System Master" },
            { to: "/brand-master-utility", icon: TagIcon, text: "Brand Master" },
            { to: "/gst-rate-masterutility", icon: CursorArrowRaysIcon, text: "GST Rate Master" },
            { to: "/gst-state-master-utility", icon: GlobeAltIcon, text: "GST State Master" },
            { to: "/TDS_section-utility", icon: GlobeAltIcon, text: "TDS Section" }
          ]
        },
        { to: "/eway-bill-setting", icon: DocumentTextIcon, text: "eWay Bill Setting" },
        { to: "/company-parameter", icon: BuildingLibraryIcon, text: "Company Parameter" },
        { to: "/whatsapp-api", icon: DevicePhoneMobileIcon, text: "WhatsApp API Integration" }
      ]
    },
    {
      name: "Inward",
      items: [
        { to: "/sugarpurchasebill-utility", icon: CursorArrowRaysIcon, text: "Purchase Bill" },
        { to: "/ShetkariPurchaseBillUtility", icon: CursorArrowRaysIcon, text: "Shetkari Purchase Bill" },
        { to: "/OtherGSTInput-utility", icon: ReceiptPercentIcon, text: "Other GST Input" },
        { to: "/reverse-charge", icon: ArrowPathIcon, text: "Reverse Charge" },
        { to: "/sugar-sale-return-purchase-utility", icon: ArrowsRightLeftIcon, text: "Sugar Sale Return Purchase" }
      ]
    },
    {
      name: "Transactions",
      items: [
        { to: "/RecieptPaymentUtility", icon: BanknotesIcon, text: "Receipt Payment" },
        { to: "/JournalVoucher_Utility", icon: DocumentTextIcon, text: "Journal Voucher" },
        { to: "/utrentry-Utility", icon: CursorArrowRaysIcon, text: "UTR Entry" },
        { to: "/debitcreditnote-utility", icon: ReceiptPercentIcon, text: "Debit/Credit Note" },
        { to: "/other-purchaseutility", icon: ShoppingBagIcon, text: "Other Purchase" },
        { to: "/PaymentNote-utility", icon: CreditCardIcon, text: "Payment Note" }
      ]
    },
    {
      name: "Business Related",
      items: [
        { to: "/tender-purchaseutility", icon: ClipboardDocumentCheckIcon, text: "Tender Purchase" },
        { to: "/sauda-book-utility-page", icon: BookOpenIcon, text: "Sauda Book Utility" },
        { to: "/sauda-shifting-utility", icon: ArrowsRightLeftIcon, text: "Sauda Shifting" },
        { to: "/delivery-order-utility", icon: TruckIcon, text: "Delivery Order" },
        { to: "/delivery-order-summary-utility", icon: TruckIcon, text: "Delivery Order -  Mobile" },
        { to: "/CarporateSale-utility", icon: TruckIcon, text: "  Carporate Sale" },
        { to: "/CarporateSaleRegister", icon: TruckIcon, text: "Carporate Sale Regsiter" },
        { to: "/pending-do", icon: TruckIcon, text: "Pending Delivery Orders" },

        {
          name: "Stock Report",
          icon: ChartBarIcon,
          isSubmenu: true,
          subItems: [
            { action: handleOpenBalanceStock, icon: Squares2X2Icon, text: "Balance Stock" },
            { to: "/register", icon: DocumentTextIcon, text: "Register" },
            { to: "/profit-loss", icon: CurrencyDollarIcon, text: "Profit Loss" }
          ]
        },
        { to: "/letter", icon: EnvelopeIcon, text: "Letter" }
      ]
    },
    {
      name: "Outward",
      items: [
        { to: "/SaleBill-utility", icon: ShoppingCartIcon, text: "Sale Bill" },
        { to: "/ShetkariSaleBillUtility", icon: ShoppingCartIcon, text: "Shetkari Sale Bill" },
        { to: "/CommissionBill-utility", icon: CursorArrowRaysIcon, text: "Commission Bill" },
        { to: "/sugar-sale-return-sale-utility", icon: ArrowPathIcon, text: "Sugar Sale Return Sale" },
        { to: "/Proforma-utility", icon: Squares2X2Icon, text: "Proforma Service Bill" },
        { to: "/ServiceBill-utility", icon: Squares2X2Icon, text: "Service Bill" },
        { action: handleSalryCliked, icon: BanknotesIcon, text: "Generate Salary" }
      ]
    },
    {
      name: "Reports",
      hasSubmenus: true,
      items: [
        {
          name: "Ledgers",
          icon: BookOpenIcon,
          subItems: [
            { to: "/ledger", icon: BookOpenIcon, text: "Ledger" },
            { to: "/daybook", icon: DocumentTextIcon, text: "Day Book" },
            { to: "/multiple-ledger", icon: BookOpenIcon, text: "Multiple Ledger" },
            { to: "/bank-book", icon: BuildingLibraryIcon, text: "Bank Book" },
            // { to: "/account-master-print", icon: ClipboardDocumentListIcon, text: "Account Master Print" },
            { to: "/group-ledger", icon: BookOpenIcon, text: "Group Ledger" },
            { to: "/interest-statement", icon: CalculatorIcon, text: "Interest Statement" }
          ]
        },
        { to: "/trial-balance", icon: ScaleIcon, text: "Trial Balance" },
        { to: "/profit-loss-balance-sheet", icon: ChartBarIcon, text: "Profit & Loss/Balance Sheet" },
        { to: "/stock-book", icon: BookOpenIcon, text: "Stock Book" },
        { action: handleTrialBalanceScreen, icon: ScaleIcon, text: "Trail Balance Screen" },
        { to: "/pending-reports", icon: ClockIcon, text: "Pending Reports" },
        { to: "/purchase-sale-registers", icon: DocumentTextIcon, text: "Purchase Sale Registers" },
        // { to: "/multiple-sale-bill-print", icon: DocumentTextIcon, text: "Multiple Sale Bill Print" },
        { to: "/partywise-sale-bill-print", icon: UserGroupIcon, text: "Partywise Sale Bill Print" },
        { to: "/FamilyGroupUtility", icon: UserGroupIcon, text: "Family Group" }
      ]
    },
    {
      name: "Utilities",
      items: [
        { to: "/user-permission-utility", icon: UserPlusIcon, text: "User Creation" },
        { to: "/group-user-creation", icon: UserGroupIcon, text: "Group User Creation" },
        { to: "/Settletenders", icon: ShieldCheckIcon, text: "Settle Tenders" },
        { to: "/club-account", icon: Squares2X2Icon, text: "Club Account" },
        { to: "/post-date", icon: CalendarIcon, text: "Post Date" },
        { to: "/unlocked-record", icon: LockOpenIcon, text: "Unlock Record" },
        { action: handleBroadCastCliked, icon: MegaphoneIcon, text: "BroadCast Messages" },
        { action: handleFileSystem, icon: DocumentTextIcon, text: "File Management" },
        { to: "/fundmanagement", icon: DocumentTextIcon, text: "Fund Management" }
      ]
    },
    {
      name: "GST Utilities",
      to: "/gstutilities"
    },
    {
      name: "Railway Rack",
      items: [
        { to: "/rack-mill-info-utility", icon: BuildingLibraryIcon, text: "Mill Master" },
        { to: "/rack-railway-station-master-utility", icon: TruckIcon, text: "Railway Station Master" },
        { to: "/rack-link-railway-station-utility", icon: LinkIcon, text: "Link Railway Station" },
        { to: "/rack-from-to-railway-station-rate-utility", icon: MapPinIcon, text: "From-To Railway Station Rate" },
        { action: () => { }, icon: DocumentChartBarIcon, text: "Report" }
      ]
    },
    {
      name: "Eway Bill",
      action: handleEwaybill
    },
    {
      name: "Analytics",
      to: "/Analytics"
    },

    {
      action: handleClosingStock,
      name: "Closing Report",

    },
    //   {
    //   name: "Google Analytics",
    //   action: handleGoogleAnalytics
    // },
    {
      name: "eBuySugar",
      action: handleEBuySugarClicked,
      logo: eBuySugarLogo,
    }
  ];

  // Desktop navigation
  const DesktopNav = () => (
    <div className="hidden md:flex space-x-6">
      {navItems.map((item, idx) => (
        <div key={idx} className="nav-item relative">
          {item.to ? (
            <Link to={item.to} className="nav-link">
              {item.logo ? (
                <img src={item.logo} alt={item.name}
                  style={{ height: 28, maxWidth: 110, objectFit: "contain", borderRadius: 6, display: "block" }} />
              ) : (
                <label className="navbarlabel cursor-pointer">{item.name}</label>
              )}
            </Link>
          ) : item.action ? (
            <div onClick={item.action} className="cursor-pointer">
              {item.logo ? (
                <img src={item.logo} alt={item.name}
                  style={{ height: 28, maxWidth: 110, objectFit: "contain", borderRadius: 6, display: "block" }} />
              ) : (
                <label className="navbarlabel cursor-pointer">{item.name}</label>
              )}
            </div>
          ) : (
            <>
              <label
                className="navbarlabel cursor-pointer"
                onMouseEnter={() => handleMouseEnter(item.name.toLowerCase().replace(/\s/g, ''))}
                onClick={() => handleClick(item.name.toLowerCase().replace(/\s/g, ''))}
              >
                {item.name}
              </label>
              {activeMenu === item.name.toLowerCase().replace(/\s/g, '') && (
                <div
                  className="absolute left-0 top-full z-10 mt-3 w-64 rounded-xl bg-white p-2 shadow-lg ring-1 ring-gray-900/5"
                  onMouseEnter={() => handleMouseEnter(item.name.toLowerCase().replace(/\s/g, ''))}
                  onMouseLeave={() => {
                    if (!clickedMenu || clickedMenu !== item.name.toLowerCase().replace(/\s/g, '')) {
                      setActiveMenu(null);
                      setActiveSubMenu(null);
                    }
                  }}
                >
                  <div className="space-y-1">
                    {renderMenuItems(item.items, true)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );

  // Mobile navigation
  const MobileNav = () => (
    <div
      ref={mobileMenuRef}
      className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
    >
      <div className="p-4 border-b flex justify-between items-center">
        <img className="h-10" src={logo} alt="Logo" />
        <button onClick={toggleMobileMenu} className="p-2 hover:bg-gray-100 rounded-lg">
          <FaTimes className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4 space-y-2">
        {navItems.map((item, idx) => (
          <div key={idx} className="border-b border-gray-100 last:border-0">
            {item.to ? (
              <Link
                to={item.to}
                className="block py-3 text-gray-700 hover:text-indigo-600 font-medium"
                onClick={closeMobileMenu}
              >
                {item.logo ? (
                  <img src={item.logo} alt={item.name}
                    style={{ height: 26, maxWidth: 100, objectFit: "contain", borderRadius: 5, display: "block" }} />
                ) : item.name}
              </Link>
            ) : item.action ? (
              <div
                onClick={item.action}
                className="block py-3 text-gray-700 hover:text-indigo-600 font-medium cursor-pointer"
              >
                {item.logo ? (
                  <img src={item.logo} alt={item.name}
                    style={{ height: 26, maxWidth: 100, objectFit: "contain", borderRadius: 5, display: "block" }} />
                ) : item.name}
              </div>
            ) : (
              <>
                <div
                  className="flex justify-between items-center py-3 text-gray-700 hover:text-indigo-600 font-medium cursor-pointer"
                  onClick={() => toggleMobileSubMenu(item.name)}
                >
                  <span>{item.name}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform ${mobileOpenMenus[item.name] ? 'rotate-180' : ''}`}
                  />
                </div>
                {mobileOpenMenus[item.name] && (
                  <div className="ml-4 pb-2 space-y-1">
                    {renderMobileMenuItems(item.items)}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        <div className="pt-4 border-t mt-4">
          <AvatarIcon />
        </div>
      </div>
    </div>
  );

  const renderMenuItems = (items, isDesktop = false) => {
    return items?.map((item, idx) => {
      if (item.subItems) {
        return (
          <div key={idx} className="relative">
            <div
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-200 cursor-pointer"
              onMouseEnter={() => isDesktop && handleSubMouseEnter(item.name.toLowerCase().replace(/\s/g, ''))}
              onClick={() => !isDesktop && toggleMobileSubMenu(item.name)}
            >
              <div className="flex items-center">
                <item.icon className="h-5 w-5 mr-2 text-indigo-600" />
                {item.name}
              </div>
              <ChevronRightIcon className={`h-4 w-4 transition-transform ${isDesktop && activeSubMenu === item.name.toLowerCase().replace(/\s/g, '') ? 'rotate-90' : ''}`} />
            </div>
            {isDesktop && activeSubMenu === item.name.toLowerCase().replace(/\s/g, '') && (
              <div className="absolute left-full top-0 ml-1 w-64 rounded-xl bg-white p-2 shadow-lg ring-1 ring-gray-900/5">
                <div className="space-y-1">
                  {item.subItems.map((subItem, subIdx) => (
                    subItem.action ? (
                      <div
                        key={subIdx}
                        onClick={() => { subItem.action(); setActiveMenu(null); }}
                        className="block rounded-lg px-3 py-2 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-200 flex items-center cursor-pointer"
                      >
                        <subItem.icon className="h-5 w-5 mr-2 text-indigo-600" />
                        {subItem.text}
                      </div>
                    ) : (
                      <Link
                        key={subIdx}
                        to={subItem.to}
                        className="block rounded-lg px-3 py-2 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-200 flex items-center"
                        onClick={() => { setActiveMenu(null); setActiveSubMenu(null); }}
                      >
                        <subItem.icon className="h-5 w-5 mr-2 text-indigo-600" />
                        {subItem.text}
                      </Link>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      } else if (item.isSubmenu) {
        return (
          <div key={idx} className="relative">
            <div
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-200 cursor-pointer"
              onMouseEnter={() => isDesktop && handleSubMouseEnter(item.name.toLowerCase().replace(/\s/g, ''))}
              onClick={() => !isDesktop && toggleMobileSubMenu(item.name)}
            >
              <div className="flex items-center">
                <item.icon className="h-5 w-5 mr-2 text-indigo-600" />
                {item.name}
              </div>
              <ChevronRightIcon className={`h-4 w-4 transition-transform ${isDesktop && activeSubMenu === item.name.toLowerCase().replace(/\s/g, '') ? 'rotate-90' : ''}`} />
            </div>
            {isDesktop && activeSubMenu === item.name.toLowerCase().replace(/\s/g, '') && (
              <div className="absolute left-full top-0 ml-1 w-64 rounded-xl bg-white p-2 shadow-lg ring-1 ring-gray-900/5">
                <div className="space-y-1">
                  {item.subItems.map((subItem, subIdx) => (
                    subItem.action ? (
                      <div
                        key={subIdx}
                        onClick={() => { subItem.action(); setActiveMenu(null); }}
                        className="block rounded-lg px-3 py-2 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-200 flex items-center cursor-pointer"
                      >
                        <subItem.icon className="h-5 w-5 mr-2 text-indigo-600" />
                        {subItem.text}
                      </div>
                    ) : (
                      <Link
                        key={subIdx}
                        to={subItem.to}
                        className="block rounded-lg px-3 py-2 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-200 flex items-center"
                        onClick={() => { setActiveMenu(null); setActiveSubMenu(null); }}
                      >
                        <subItem.icon className="h-5 w-5 mr-2 text-indigo-600" />
                        {subItem.text}
                      </Link>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      } else if (item.action) {
        return (
          <div
            key={idx}
            onClick={() => { item.action(); if (isDesktop) setActiveMenu(null); }}
            className="block rounded-lg px-3 py-2 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-200 flex items-center cursor-pointer"
          >
            <item.icon className="h-5 w-5 mr-2 text-indigo-600" />
            {item.text}
          </div>
        );
      } else {
        return (
          <Link
            key={idx}
            to={item.to}
            className="block rounded-lg px-3 py-2 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-200 flex items-center"
            onClick={() => { if (isDesktop) setActiveMenu(null); }}
          >
            <item.icon className="h-5 w-5 mr-2 text-indigo-600" />
            {item.text}
          </Link>
        );
      }
    });
  };

  const renderMobileMenuItems = (items) => {
    return items?.map((item, idx) => {
      if (item.subItems) {
        return (
          <div key={idx}>
            <div
              className="flex justify-between items-center py-2 pl-3 text-sm text-gray-600 hover:text-indigo-600 cursor-pointer"
              onClick={() => toggleMobileSubMenu(item.name)}
            >
              <div className="flex items-center">
                <item.icon className="h-4 w-4 mr-2" />
                {item.name}
              </div>
              <ChevronDownIcon className={`h-3 w-3 transition-transform ${mobileOpenMenus[item.name] ? 'rotate-180' : ''}`} />
            </div>
            {mobileOpenMenus[item.name] && (
              <div className="ml-6 space-y-1">
                {item.subItems.map((subItem, subIdx) => (
                  subItem.action ? (
                    <div
                      key={subIdx}
                      onClick={() => { subItem.action(); closeMobileMenu(); }}
                      className="flex items-center py-2 pl-2 text-sm text-gray-500 hover:text-indigo-600 cursor-pointer"
                    >
                      <subItem.icon className="h-3 w-3 mr-2" />
                      {subItem.text}
                    </div>
                  ) : (
                    <Link
                      key={subIdx}
                      to={subItem.to}
                      className="flex items-center py-2 pl-2 text-sm text-gray-500 hover:text-indigo-600"
                      onClick={closeMobileMenu}
                    >
                      <subItem.icon className="h-3 w-3 mr-2" />
                      {subItem.text}
                    </Link>
                  )
                ))}
              </div>
            )}
          </div>
        );
      } else if (item.isSubmenu) {
        return (
          <div key={idx}>
            <div
              className="flex justify-between items-center py-2 pl-3 text-sm text-gray-600 hover:text-indigo-600 cursor-pointer"
              onClick={() => toggleMobileSubMenu(item.name)}
            >
              <div className="flex items-center">
                <item.icon className="h-4 w-4 mr-2" />
                {item.name}
              </div>
              <ChevronDownIcon className={`h-3 w-3 transition-transform ${mobileOpenMenus[item.name] ? 'rotate-180' : ''}`} />
            </div>
            {mobileOpenMenus[item.name] && (
              <div className="ml-6 space-y-1">
                {item.subItems.map((subItem, subIdx) => (
                  subItem.action ? (
                    <div
                      key={subIdx}
                      onClick={() => { subItem.action(); closeMobileMenu(); }}
                      className="flex items-center py-2 pl-2 text-sm text-gray-500 hover:text-indigo-600 cursor-pointer"
                    >
                      <subItem.icon className="h-3 w-3 mr-2" />
                      {subItem.text}
                    </div>
                  ) : (
                    <Link
                      key={subIdx}
                      to={subItem.to}
                      className="flex items-center py-2 pl-2 text-sm text-gray-500 hover:text-indigo-600"
                      onClick={closeMobileMenu}
                    >
                      <subItem.icon className="h-3 w-3 mr-2" />
                      {subItem.text}
                    </Link>
                  )
                ))}
              </div>
            )}
          </div>
        );
      } else if (item.action) {
        return (
          <div
            key={idx}
            onClick={() => { item.action(); closeMobileMenu(); }}
            className="flex items-center py-2 pl-3 text-sm text-gray-600 hover:text-indigo-600 cursor-pointer"
          >
            <item.icon className="h-4 w-4 mr-2" />
            {item.text}
          </div>
        );
      } else {
        return (
          <Link
            key={idx}
            to={item.to}
            className="flex items-center py-2 pl-3 text-sm text-gray-600 hover:text-indigo-600"
            onClick={closeMobileMenu}
          >
            <item.icon className="h-4 w-4 mr-2" />
            {item.text}
          </Link>
        );
      }
    });
  };

  // Hide navbar completely when eBuySugar is opened as a standalone window
  const isStandalone = new URLSearchParams(window.location.search).get("standalone") === "1";
  if (isStandalone) return null;

  return (
    <>
      <div ref={navbarRef} className="navbar relative" onMouseLeave={handleMouseLeave}>
        <div className="flex justify-between items-center w-full px-4 md:px-8">
          <img className="logo h-10 md:h-12 cursor-pointer" src={logo} alt="Logo" onClick={handleLogoClick} />

          {/* Desktop Navigation */}
          <DesktopNav />

          {/* Mobile Menu Button and Avatar */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:block">
              <AvatarIcon />
            </div>
            <button
              className="mobile-menu-button md:hidden p-2 hover:bg-gray-100 rounded-lg focus:outline-none"
              onClick={toggleMobileMenu}
            >
              <FaBars className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={toggleMobileMenu} />
        )}

        {/* Mobile Navigation Menu */}
        <MobileNav />

        {/* Mobile Avatar (visible when menu is closed) */}
        <div className="md:hidden absolute right-16 top-1/2 transform -translate-y-1/2">
          <AvatarIcon />
        </div>
      </div>
    </>
  );
}

export default Navbar;