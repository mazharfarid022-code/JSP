import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trash2, Edit, Ban, CheckCircle } from 'lucide-react';

export default function AdminWorkers() {
  const { t } = useTranslation();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'Workers'));
      const workersData: any[] = [];
      querySnapshot.forEach((doc) => {
        workersData.push({ id: doc.id, ...doc.data() });
      });
      setWorkers(workersData);
    } catch (error) {
      console.error("Error fetching workers:", error);
    }
    setLoading(false);
  };

  const handleToggleBlock = async (workerId: string, currentStatus: string) => {
    if (window.confirm(t('areYouSure'))) {
      try {
        const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
        await updateDoc(doc(db, 'Workers', workerId), { status: newStatus });
        fetchWorkers();
      } catch (error) {
        console.error("Error updating worker status:", error);
      }
    }
  };

  const handleDelete = async (workerId: string) => {
    if (window.confirm(t('areYouSure'))) {
      try {
        await deleteDoc(doc(db, 'Workers', workerId));
        fetchWorkers();
      } catch (error) {
        console.error("Error deleting worker:", error);
      }
    }
  };

  if (loading) return <div className="text-center py-10">{t('loading')}</div>;

  return (
    <div className="bg-white shadow rounded-lg border border-slate-100 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-slate-900">{t('workers')}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('workerId')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('name')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('profession')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('status')}</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {workers.map((worker) => (
              <tr key={worker.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{worker.workerId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img className="h-10 w-10 rounded-full" src={worker.profileImageUrl || "https://picsum.photos/seed/user/200/200"} alt="" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-900">{worker.name}</div>
                      <div className="text-sm text-slate-500">{worker.mobile}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{worker.profession}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${worker.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {worker.status === 'active' ? t('active') : t('blocked')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleToggleBlock(worker.id, worker.status)} className="text-orange-600 hover:text-orange-900 mr-4">
                    {worker.status === 'active' ? <Ban className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                  </button>
                  <button onClick={() => handleDelete(worker.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
