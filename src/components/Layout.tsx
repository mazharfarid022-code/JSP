import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { Factory, Menu, X, LogOut, User, LayoutDashboard, Users, Package, FileText, DollarSign } from 'lucide-react';
import { clsx } from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'worker';
}

export default function Layout({ children, role }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setAdminState, workerData } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    setAdminState(false);
    navigate('/');
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ur' : 'en');
  };

  const adminNav = [
    { name: t('dashboard'), href: '/admin', icon: LayoutDashboard },
    { name: t('workers'), href: '/admin/workers', icon: Users },
    { name: t('items'), href: '/admin/items', icon: Package },
    { name: t('workRecords'), href: '/admin/work', icon: FileText },
    { name: t('payments'), href: '/admin/payments', icon: DollarSign },
  ];

  const workerNav = [
    { name: t('dashboard'), href: '/worker', icon: LayoutDashboard },
    { name: t('profile'), href: '/worker/profile', icon: User },
    { name: t('payments'), href: '/worker/payments', icon: DollarSign },
  ];

  const navigation = role === 'admin' ? adminNav : workerNav;

  return (
    <div className="min-h-screen bg-slate-50 flex" dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
      {/* Mobile sidebar */}
      <div className={clsx("fixed inset-0 flex z-40 md:hidden", sidebarOpen ? "visible" : "invisible")}>
        <div className={clsx("fixed inset-0 bg-slate-600 bg-opacity-75 transition-opacity duration-300 ease-linear", sidebarOpen ? "opacity-100" : "opacity-0")} onClick={() => setSidebarOpen(false)}></div>
        <div className={clsx("relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 transition ease-in-out duration-300 transform", sidebarOpen ? "translate-x-0" : (i18n.language === 'ur' ? "translate-x-full" : "-translate-x-full"))}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button type="button" className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={() => setSidebarOpen(false)}>
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Factory className="h-8 w-8 text-orange-500" />
              <span className="ml-2 text-white text-xl font-bold">{t('factoryName')}</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || (item.href !== `/${role}` && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white',
                      'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                    )}
                  >
                    <item.icon className={clsx(isActive ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-300', 'mr-4 flex-shrink-0 h-6 w-6')} aria-hidden="true" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex bg-slate-800 p-4">
            <button onClick={handleLogout} className="flex-shrink-0 group block w-full text-left">
              <div className="flex items-center">
                <div>
                  <LogOut className="inline-block h-6 w-6 rounded-full text-slate-300" />
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-white">{t('logout')}</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <Factory className="h-8 w-8 text-orange-500" />
                <span className="ml-2 text-white text-xl font-bold">{t('factoryName')}</span>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href || (item.href !== `/${role}` && location.pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={clsx(
                        isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white',
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                      )}
                    >
                      <item.icon className={clsx(isActive ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-300', 'mr-3 flex-shrink-0 h-6 w-6')} aria-hidden="true" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex bg-slate-800 p-4">
              <button onClick={handleLogout} className="flex-shrink-0 w-full group block text-left">
                <div className="flex items-center">
                  <div>
                    <LogOut className="inline-block h-5 w-5 rounded-full text-slate-300" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{t('logout')}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white border-b border-slate-200 flex justify-between items-center">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="pr-4 flex items-center space-x-4">
            <button onClick={toggleLanguage} className="text-sm font-medium text-slate-500 hover:text-slate-700">
              {i18n.language === 'en' ? 'اردو' : 'EN'}
            </button>
          </div>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-slate-900 capitalize">
                {navigation.find(n => location.pathname === n.href || (n.href !== `/${role}` && location.pathname.startsWith(n.href)))?.name || t('dashboard')}
              </h1>
              <div className="hidden md:flex items-center space-x-4">
                {role === 'worker' && workerData && (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-slate-700">{workerData.name}</span>
                    <img className="h-8 w-8 rounded-full bg-slate-300" src={workerData.profileImageUrl || "https://picsum.photos/seed/user/200/200"} alt="" />
                  </div>
                )}
                <button onClick={toggleLanguage} className="px-3 py-1 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {i18n.language === 'en' ? 'اردو' : 'English'}
                </button>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
