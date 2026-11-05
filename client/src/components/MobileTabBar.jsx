import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sprout, ClipboardList, Bot, ShieldCheck, DollarSign } from 'lucide-react';

export default function MobileTabBar() {
  const location = useLocation();

  const tabs = [
    { path: '/dashboard', label: 'Dashboard', icon: Sprout },
    { path: '/action-plan', label: 'Action Plan', icon: ClipboardList },
    { path: '/disease-identification', label: 'Disease ID', icon: ShieldCheck },
    { path: '/market-prices', label: 'Mandi Rates', icon: DollarSign },
    { path: '/ai-chat', label: 'AI Chat', icon: Bot }
  ];

  return (
    <div className="mobile-tab-bar">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`mobile-tab-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
