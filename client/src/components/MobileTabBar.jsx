import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sprout, ClipboardList, CloudSun, Bot, LayoutGrid } from 'lucide-react';

export default function MobileTabBar() {
  const { t } = useApp();
  const location = useLocation();

  const tabs = [
    { path: '/dashboard', label: t.nav.dashboard, icon: Sprout },
    { path: '/action-plan', label: t.nav.actionPlan, icon: ClipboardList },
    { path: '/weather', label: t.nav.weather, icon: CloudSun },
    { path: '/ai-chat', label: t.nav.aiChat, icon: Bot },
    { path: '/crop-decider', label: t.nav.compareCrops, icon: LayoutGrid }
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
