import { useState } from "react";
import {
    CubeIcon,
    ShoppingCartIcon,
    ScaleIcon,
    CalendarDaysIcon,
    MagnifyingGlassIcon,
    ArrowsRightLeftIcon,
    BriefcaseIcon,
} from "@heroicons/react/24/outline";
import SelfStockReport from "./Selfstockreport";
import DailyPurchaseReport from "./DailyPurchaseReport";
import DailySaudaReport from "./DailySaudaReport";
import TrailBalanceReport from "./TrailBalanceReport";
import PendingPaymentReport from "./PendingPayment";
import AccountsClosingReport from "./AccountsClosingReport"

const todayISO = () => new Date().toISOString().slice(0, 10);

const TABS = [
    { id: "self-stock",      label: "Self Stock Report", icon: CubeIcon },
    { id: "daily-purchase",  label: "Daily Purchase And Sale",     icon: ShoppingCartIcon },
    { id: "trial-balance",   label: "Trial Balance Report",     icon: ScaleIcon },
    { id: "pending-payment", label: "Pending Payment Report",  icon: ArrowsRightLeftIcon },
    { id: "account-report", label: "Accounts Closing Report",  icon: BriefcaseIcon },
];

export default function ClosingStock() {
    const [active, setActive]       = useState("self-stock");
    const [inputDate, setInputDate] = useState(todayISO());
    const [activeDate, setActiveDate] = useState(todayISO());

    const handleFetch = () => {
        if (inputDate) setActiveDate(inputDate);
    };

    const renderActiveContent = () => {
        switch (active) {
            case "self-stock":
                return <SelfStockReport toDate={activeDate} />;
            case "daily-purchase":
                return <DailyPurchaseReport toDate={activeDate} />;
            case "daily-sauda":
                return <DailySaudaReport toDate={activeDate} />;
            case "trial-balance":
                return <TrailBalanceReport toDate={activeDate} />;
            case "pending-payment":
                return <PendingPaymentReport />;

            case "account-report":
                return <AccountsClosingReport toDate={activeDate}  />;

            default:
                return null;
        }
    };

    return (
        /* The main wrapper stays visible, but we remove margins for print */
        <div className="bg-slate-50/50 p-1 lg:p-1 print:p-0 print:bg-white" style={{ marginTop: "-80px" }}>
            <div>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden print:border-none print:shadow-none print:rounded-none">

                    {/* ── Date Bar: Hidden in Print ── */}
                    <div className="flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600 print:hidden">
                        <div className="flex items-center gap-2 text-slate-300">
                            <CalendarDaysIcon className="w-4 h-4" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">As On Date</span>
                        </div>

                        <input
                            type="date"
                            value={inputDate}
                            onChange={(e) => setInputDate(e.target.value)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/60 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                        />

                        <button
                            onClick={handleFetch}
                            disabled={!inputDate}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 transition-all shadow-sm"
                        >   
                            Get Report
                        </button>

                        {activeDate && (
                            <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                <span className="text-[11px] font-semibold text-blue-300">
                                    Date : {new Date(activeDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ── Navigation Tabs: Hidden in Print ── */}
                    <div className="bg-slate-50/80 border-b border-slate-200 px-6 pt-4 print:hidden">
                        <nav
                            className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                            aria-label="Tabs"
                        >
                            {TABS.map((tab) => {
                                const isActive = active === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActive(tab.id)}
                                        className={`
                                            flex-shrink-0 whitespace-nowrap group relative flex items-center gap-2.5 px-6 py-4 text-sm font-bold transition-all duration-300
                                            rounded-t-xl border-x border-t -mb-px
                                            ${isActive
                                                ? "bg-white border-slate-200 text-blue-600 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]"
                                                : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
                                            }
                                        `}
                                    >
                                        <tab.icon className={`w-5 h-5 transition-colors ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                                        {tab.label}
                                        {isActive && (
                                            <span className="absolute top-0 left-0 right-0 h-1 bg-blue-600 rounded-full mx-2" />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* ── Dynamic Content: Visible in Print ── */}
                    <div className="relative min-h-[600px] print:min-h-0">
                        {renderActiveContent()}
                    </div>

                </div>
            </div>
        </div>
    );
}