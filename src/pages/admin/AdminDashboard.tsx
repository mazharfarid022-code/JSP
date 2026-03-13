import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/Layout';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, Package, FileText, DollarSign } from 'lucide-react';

import AdminWorkers from './AdminWorkers';
import AdminItems from './AdminItems';
import AdminWorkRecords from './AdminWorkRecords';
import AdminPayments from './AdminPayments';

function AdminHome() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalWorkers: 0,
    totalItems: 0,
    runningLaat: 0,
    completedLaat: 0,
    totalProduction: 0,
    totalPayments: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const workersSnap = await getDocs(collection(db, 'Workers'));
        const itemsSnap = await getDocs(collection(db, 'Items'));
        const workSnap = await getDocs(collection(db, 'WorkRecords'));
        const paymentsSnap = await getDocs(collection(db, 'Payments'));

        let running = 0;
        let completed = 0;
        let prod = 0;
        let pay = 0;

        workSnap.forEach(doc => {
          const data = doc.data();
          if (data.status === 'started') running++;
          if (data.status === 'completed') completed++;
          prod += data.totalItemsStitched || 0;
        });

        paymentsSnap.forEach(doc => {
          pay += doc.data().receivedPayment || 0;
        });

        setStats({
          totalWorkers: workersSnap.size,
          totalItems: itemsSnap.size,
          runningLaat: running,
          completedLaat: completed,
          totalProduction: prod,
          totalPayments: pay,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { name: t('totalWorkers'), stat: stats.totalWorkers, icon: Users, color: 'bg-blue-500' },
    { name: t('totalItems'), stat: stats.totalItems, icon: Package, color: 'bg-indigo-500' },
    { name: t('runningLaat'), stat: stats.runningLaat, icon: FileText, color: 'bg-orange-500' },
    { name: t('completedLaat'), stat: stats.completedLaat, icon: FileText, color: 'bg-green-500' },
    { name: t('totalProduction'), stat: stats.totalProduction, icon: Package, color: 'bg-purple-500' },
    { name: t('totalPayments'), stat: `Rs ${stats.totalPayments}`, icon: DollarSign, color: 'bg-emerald-500' },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg border border-slate-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`rounded-md p-3 ${item.color}`}>
                    <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">{item.name}</dt>
                    <dd>
                      <div className="text-lg font-medium text-slate-900">{item.stat}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Layout role="admin">
      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/workers" element={<AdminWorkers />} />
        <Route path="/items" element={<AdminItems />} />
        <Route path="/work" element={<AdminWorkRecords />} />
        <Route path="/payments" element={<AdminPayments />} />
      </Routes>
    </Layout>
  );
}
