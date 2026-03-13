import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/Layout';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, DollarSign, Package } from 'lucide-react';

import WorkerProfile from './WorkerProfile';
import WorkerPayments from './WorkerPayments';

function WorkerHome() {
  const { t } = useTranslation();
  const { workerData, currentUser } = useAuth();
  const [runningLaats, setRunningLaats] = useState<any[]>([]);

  useEffect(() => {
    const fetchWork = async () => {
      if (!currentUser || !workerData) return;
      try {
        const q = query(collection(db, 'WorkRecords'), where('workerId', '==', workerData?.workerId), where('status', '==', 'started'));
        const querySnapshot = await getDocs(q);
        const laats: any[] = [];
        querySnapshot.forEach((doc) => {
          laats.push({ id: doc.id, ...doc.data() });
        });
        setRunningLaats(laats);
      } catch (error) {
        console.error("Error fetching work records:", error);
      }
    };

    fetchWork();
  }, [currentUser, workerData]);

  const statCards = [
    { name: t('totalEarned'), stat: `Rs ${workerData?.totalEarned || 0}`, icon: DollarSign, color: 'bg-green-500' },
    { name: t('totalReceived'), stat: `Rs ${workerData?.totalReceived || 0}`, icon: DollarSign, color: 'bg-blue-500' },
    { name: t('remainingBalance'), stat: `Rs ${workerData?.remainingBalance || 0}`, icon: DollarSign, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
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

      <h2 className="text-xl font-bold text-slate-900 mb-4">{t('runningLaat')}</h2>
      {runningLaats.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow border border-slate-100 text-center text-slate-500">
          {t('noData')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {runningLaats.map((laat) => (
            <div key={laat.id} className="bg-white rounded-lg shadow border border-slate-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-900">{t('laatNumber')}: {laat.laatNumber}</h3>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                    {t('started')}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-900">{t('label')}:</span> {laat.label}</p>
                  <p><span className="font-medium text-slate-900">{t('pieceSize')}:</span> {laat.pieceSize}</p>
                  <p><span className="font-medium text-slate-900">{t('pricePerPiece')}:</span> Rs {laat.pricePerPiece}</p>
                  <p><span className="font-medium text-slate-900">{t('totalItemsStitched')}:</span> {laat.totalItemsStitched}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WorkerDashboard() {
  return (
    <Layout role="worker">
      <Routes>
        <Route path="/" element={<WorkerHome />} />
        <Route path="/profile" element={<WorkerProfile />} />
        <Route path="/payments" element={<WorkerPayments />} />
      </Routes>
    </Layout>
  );
}
