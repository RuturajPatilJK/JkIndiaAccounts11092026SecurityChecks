import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserCircleIcon, ShoppingBagIcon, ShieldCheckIcon, ChartPieIcon } from '@heroicons/react/24/outline';

function Analytics() {
    const location = useLocation();

    const tabs = [
        {
            name: 'Top Sellers List',
            path: '/top-sellers-purchase-report',
            icon: UserCircleIcon,
            iconColor: 'text-emerald-600',
            iconBg: 'bg-emerald-50'
        },
        {
            name: 'Top Buyers List',
            path: '/top-sale-buyer-report',
            icon: ShoppingBagIcon,
            iconColor: 'text-amber-600',
            iconBg: 'bg-amber-50'
        },
        {
            name: 'Top Buyer Percentage Wise Report',
            path: '/top-buyer-percentage-report',
            icon: ChartPieIcon,
            iconColor: 'text-purple-600',
            iconBg: 'bg-purple-50'
        },

                {
            name: 'Account Master Analytics',
            path: '/AccountMasterAnalytics',
            icon: ShieldCheckIcon,
            iconColor: 'text-blue-600',
            iconBg: 'bg-red-50'
        },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Analytics</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;

                    return (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            className={`
                                relative flex items-center gap-5 p-6 transition-all duration-300 rounded-3xl border-2
                                ${isActive
                                    ? 'bg-white border-indigo-600 shadow-xl ring-4 ring-indigo-50 scale-[1.02] z-10'
                                    : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200 hover:shadow-lg'
                                }
                            `}
                        >
                            <div className={`flex-shrink-0 p-3 rounded-2xl transition-colors ${isActive
                                ? 'bg-indigo-600 text-white'
                                : `${tab.iconBg} ${tab.iconColor}`
                                }`}>
                                <tab.icon className="h-8 w-8" />
                            </div>

                            <div className="flex flex-col">
                                <span className={`text-xl font-black ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {tab.name}
                                </span>
                            </div>

                            {isActive && (
                                <span className="absolute top-4 right-4 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export default Analytics;