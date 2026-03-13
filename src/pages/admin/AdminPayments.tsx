import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Trash2 } from 'lucide-react';

export default function AdminPayments() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    workerId: '',
    receivedPayment: '',
  });
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const paymentsSnap = await getDocs(collection(db, 'Payments'));
      const paymentsData: any[] = [];
      paymentsSnap.forEach((doc) => paymentsData.push({ id: doc.id, ...doc.data() }));
      setPayments(paymentsData);

      const workersSnap = await getDocs(collection(db, 'Workers'));
      const workersData: any[] = [];
      workersSnap.forEach((doc) => workersData.push({ id: doc.id, ...doc.data() }));
      setWorkers(workersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleWorkerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const workerId = e.target.value;
    setFormData({ ...formData, workerId });
    const worker = workers.find(w => w.workerId === workerId);
    setSelectedWorker(worker || null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    setAdding(true);

    try {
      const received = Number(formData.receivedPayment);
      const newRemaining = (selectedWorker.remainingBalance || 0) - received;

      await addDoc(collection(db, 'Payments'), {
        workerId: selectedWorker.workerId,
        workerName: selectedWorker.name,
        receivedPayment: received,
        remainingBalance: newRemaining,
        createdAt: new Date().toISOString(),
      });

      // Update worker's balances
      const workerRef = doc(db, 'Workers', selectedWorker.id);
      await updateDoc(workerRef, {
        totalReceived: (selectedWorker.totalReceived || 0) + received,
        remainingBalance: newRemaining,
      });

      alert(t('paymentAdded'));
      setShowAddForm(false);
      setFormData({ workerId: '', receivedPayment: '' });
      setSelectedWorker(null);
      fetchData();
    } catch (error) {
      console.error("Error adding payment:", error);
      alert("Error adding payment");
    }
    setAdding(false);
  };

  const handleDelete = async (paymentId: string) => {
    if (window.confirm(t('areYouSure'))) {
      try {
        await deleteDoc(doc(db, 'Payments', paymentId));
        fetchData();
      } catch (error) {
        console.error("Error deleting payment:", error);
      }
    }
  };

  if (loading) return <div className="text-center py-10">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">{t('payments')}</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          {t('addPayment')}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white shadow rounded-lg border border-slate-100 p-6">
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('workerId')}</label>
                <select required value={formData.workerId} onChange={handleWorkerChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm">
                  <option value="">Select Worker</option>
                  {workers.map(w => <option key={w.id} value={w.workerId}>{w.workerId} - {w.name}</option>)}
                </select>
                {selectedWorker && (
                  <div className="mt-2 text-sm text-slate-500">
                    {selectedWorker.name} | Balance: Rs {selectedWorker.remainingBalance || 0}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('receivedPayment')}</label>
                <input type="number" required value={formData.receivedPayment} onChange={(e) => setFormData({ ...formData, receivedPayment: e.target.value })} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">New Balance</label>
                <div className="mt-1 block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium">
                  Rs {selectedWorker && formData.receivedPayment ? ((selectedWorker.remainingBalance || 0) - Number(formData.receivedPayment)).toFixed(2) : '0.00'}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                {t('cancel')}
              </button>
              <button type="submit" disabled={adding} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50">
                {adding ? t('loading') : t('save')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('date')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('worker')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('receivedPayment')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('remainingBalance')}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(payment.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{payment.workerName} ({payment.workerId})</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">Rs {payment.receivedPayment}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">Rs {payment.remainingBalance}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleDelete(payment.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
