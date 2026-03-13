import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';

export default function WorkerProfile() {
  const { t } = useTranslation();
  const { workerData, currentUser, setAdminState } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: workerData?.name || '',
    fatherName: workerData?.fatherName || '',
    city: workerData?.city || '',
    mobile: workerData?.mobile || '',
    cnic: workerData?.cnic || '',
    age: workerData?.age || '',
    gender: workerData?.gender || 'Male',
    dob: workerData?.dob || '',
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setUpdating(true);

    try {
      let imageUrl = workerData?.profileImageUrl;

      if (profileImage) {
        const imageRef = ref(storage, `workers/${currentUser.uid}`);
        await uploadBytes(imageRef, profileImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      await updateDoc(doc(db, 'Workers', currentUser.uid), {
        ...formData,
        profileImageUrl: imageUrl,
      });

      alert(t('profileUpdated'));
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile");
    }
    setUpdating(false);
  };

  const handleDelete = async () => {
    if (!currentUser) return;
    if (window.confirm(t('areYouSure'))) {
      try {
        await deleteDoc(doc(db, 'Workers', currentUser.uid));
        await currentUser.delete();
        setAdminState(false);
        navigate('/');
      } catch (error) {
        console.error("Error deleting profile:", error);
        alert("Error deleting profile. You may need to re-authenticate.");
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-lg border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">{t('updateProfile')}</h2>
        
        <div className="mb-6 flex items-center space-x-4">
          <img 
            src={workerData?.profileImageUrl || "https://picsum.photos/seed/user/200/200"} 
            alt="Profile" 
            className="h-24 w-24 rounded-full object-cover border-4 border-slate-100"
          />
          <div>
            <p className="text-lg font-medium text-slate-900">{workerData?.name}</p>
            <p className="text-sm text-slate-500">{t('workerId')}: {workerData?.workerId}</p>
            <p className="text-sm text-slate-500">{workerData?.profession}</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('name')}</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('fatherName')}</label>
              <input type="text" name="fatherName" required value={formData.fatherName} onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('city')}</label>
              <input type="text" name="city" required value={formData.city} onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('mobile')}</label>
              <input type="text" name="mobile" required value={formData.mobile} onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('cnic')}</label>
              <input type="text" name="cnic" required value={formData.cnic} onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('age')}</label>
              <input type="number" name="age" required value={formData.age} onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('gender')}</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm">
                <option value="Male">{t('male')}</option>
                <option value="Female">{t('female')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('dob')}</label>
              <input type="date" name="dob" required value={formData.dob} onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">{t('profileImage')}</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="flex text-sm text-slate-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500">
                      <span>Upload a file</span>
                      <input type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                  <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
            >
              {t('deleteProfile')}
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
            >
              {updating ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
