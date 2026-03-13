import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, doc, deleteDoc, addDoc, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Trash2, CheckCircle } from 'lucide-react';

export default function AdminWorkRecords() {
  const { t } = useTranslation();
  const [workRecords, setWorkRecords] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    workerId: '',
    laatId: '',
    totalItemsStitched: '',
  });
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const workSnap = await getDocs(collection(db, 'WorkRecords'));
      const workData: any[] = [];
      workSnap.forEach((doc) => workData.push({ id: doc.id, ...doc.data() }));
      setWorkRecords(workData);

      const workersSnap = await getDocs(collection(db, 'Workers'));
      const workersData: any[] = [];
      workersSnap.forEach((doc) => workersData.push({ id: doc.id, ...doc.data() }));
      setWorkers(workersData);

      const itemsSnap = await getDocs(collection(db, 'Items'));
      const itemsData: any[] = [];
      itemsSnap.forEach((doc) => itemsData.push({ id: doc.id, ...doc.data() }));
      setItems(itemsData);
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

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const laatId = e.target.value;
    setFormData({ ...formData, laatId });
    const item = items.find(i => i.id === laatId);
    setSelectedItem(item || null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker || !selectedItem) return;
    setAdding(true);

    try {
      const totalItems = Number(formData.totalItemsStitched);
      const totalEarned = totalItems * selectedItem.pricePerPiece;

      await addDoc(collection(db, 'WorkRecords'), {
        workerId: selectedWorker.workerId,
        workerName: selectedWorker.name,
        laatId: selectedItem.id,
        laatNumber: selectedItem.laatNumber,
        label: selectedItem.label,
        pieceSize: selectedItem.pieceSize,
        pricePerPiece: selectedItem.pricePerPiece,
        totalItemsStitched: totalItems,
        totalEarned: totalEarned,
        status: 'started',
        createdAt: new Date().toISOString(),
      });

      // Update worker's total earned
      const workerRef = doc(db, 'Workers', selectedWorker.id);
      await updateDoc(workerRef, {
        totalEarned: (selectedWorker.totalEarned || 0) + totalEarned,
        remainingBalance: (selectedWorker.remainingBalance || 0) + totalEarned,
      });

      alert(t('workAdded'));
      setShowAddForm(false);
      setFormData({ workerId: '', laatId: '', totalItemsStitched: '' });
      setSelectedWorker(null);
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      console.error("Error adding work:", error);
      alert("Error adding work");
    }
    setAdding(false);
  };

  const handleComplete = async (record: any) => {
    if (window.confirm(t('areYouSure'))) {
      try {
        await updateDoc(doc(db, 'WorkRecords', record.id), { status: 'completed' });
        fetchData();
      } catch (error) {
        console.error("Error completing work:", error);
      }
    }
  };

  const handleDelete = async (recordId: string) => {
    if (window.confirm(t('areYouSure'))) {
      try {
        await deleteDoc(doc(db, 'WorkRecords', recordId));
        fetchData();
      } catch (error) {
        console.error("Error deleting work:", error);
      }
    }
  };

  if (loading) return <div className="text-center py-10">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">{t('workRecords')}</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          {t('addWork')}
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
                    {selectedWorker.name} | {selectedWorker.city} | {selectedWorker.mobile}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('laatNumber')}</label>
                <select required value={formData.laatId} onChange={handleItemChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm">
                  <option value="">Select Laat</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.laatNumber} - {i.label}</option>)}
                </select>
                {selectedItem && (
                  <div className="mt-2 text-sm text-slate-500">
                    Size: {selectedItem.pieceSize} | Price: Rs {selectedItem.pricePerPiece}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('totalItemsStitched')}</label>
                <input type="number" required value={formData.totalItemsStitched} onChange={(e) => setFormData({ ...formData, totalItemsStitched: e.target.value })} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('totalEarned')}</label>
                <div className="mt-1 block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium">
                  Rs {selectedItem && formData.totalItemsStitched ? (Number(formData.totalItemsStitched) * selectedItem.pricePerPiece).toFixed(2) : '0.00'}
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('laatNumber')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('totalItemsStitched')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('totalEarned')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('status')}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {workRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(record.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{record.workerName} ({record.workerId})</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{record.laatNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{record.totalItemsStitched}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">Rs {record.totalEarned}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {record.status === 'completed' ? t('completed') : t('started')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {record.status !== 'completed' && (
                      <button onClick={() => handleComplete(record)} className="text-green-600 hover:text-green-900 mr-4" title="Mark as Completed">
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-900">
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
