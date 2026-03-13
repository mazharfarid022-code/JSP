import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { Plus, Trash2, Upload } from 'lucide-react';

export default function AdminItems() {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    laatNumber: '',
    pricePerPiece: '',
    pieceSize: '16',
    label: 'Disney Kids',
  });
  const [itemImages, setItemImages] = useState<FileList | null>(null);
  const [adding, setAdding] = useState(false);

  const labels = ['Disney Kids', 'Little Junior', 'Smart Clothing'];
  const sizes = Array.from({ length: 25 }, (_, i) => i + 16); // 16 to 40

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'Items'));
      const itemsData: any[] = [];
      querySnapshot.forEach((doc) => {
        itemsData.push({ id: doc.id, ...doc.data() });
      });
      setItems(itemsData);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const imageUrls: string[] = [];
      if (itemImages) {
        for (let i = 0; i < itemImages.length; i++) {
          const file = itemImages[i];
          const imageRef = ref(storage, `items/${Date.now()}_${file.name}`);
          await uploadBytes(imageRef, file);
          const url = await getDownloadURL(imageRef);
          imageUrls.push(url);
        }
      }

      await addDoc(collection(db, 'Items'), {
        ...formData,
        pricePerPiece: Number(formData.pricePerPiece),
        imageUrls,
        createdAt: new Date().toISOString(),
      });

      alert(t('itemAdded'));
      setShowAddForm(false);
      setFormData({ laatNumber: '', pricePerPiece: '', pieceSize: '16', label: 'Disney Kids' });
      setItemImages(null);
      fetchItems();
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Error adding item");
    }
    setAdding(false);
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm(t('areYouSure'))) {
      try {
        await deleteDoc(doc(db, 'Items', itemId));
        fetchItems();
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  if (loading) return <div className="text-center py-10">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">{t('items')}</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          {t('addItem')}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white shadow rounded-lg border border-slate-100 p-6">
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('laatNumber')}</label>
                <input type="text" required value={formData.laatNumber} onChange={(e) => setFormData({ ...formData, laatNumber: e.target.value })} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('pricePerPiece')}</label>
                <input type="number" required value={formData.pricePerPiece} onChange={(e) => setFormData({ ...formData, pricePerPiece: e.target.value })} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('pieceSize')}</label>
                <select value={formData.pieceSize} onChange={(e) => setFormData({ ...formData, pieceSize: e.target.value })} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm">
                  {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('label')}</label>
                <select value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm">
                  {labels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Images</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500">
                        <span>Upload files</span>
                        <input type="file" multiple className="sr-only" accept="image/*" onChange={(e) => setItemImages(e.target.files)} />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500">{itemImages ? `${itemImages.length} files selected` : 'PNG, JPG up to 10MB'}</p>
                  </div>
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow border border-slate-100 overflow-hidden">
            <div className="aspect-w-3 aspect-h-2 bg-slate-200">
              {item.imageUrls && item.imageUrls.length > 0 ? (
                <img src={item.imageUrls[0]} alt={item.laatNumber} className="object-cover w-full h-48" />
              ) : (
                <div className="flex items-center justify-center h-48 bg-slate-100 text-slate-400">No Image</div>
              )}
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-slate-900">{t('laatNumber')}: {item.laatNumber}</h3>
                  <p className="text-sm text-slate-500">{item.label}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Size: {item.pieceSize}
                </span>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-lg font-bold text-slate-900">Rs {item.pricePerPiece}</p>
                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 p-2">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
