import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db, storage } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Factory, Upload } from 'lucide-react';

export default function Signup() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    city: '',
    mobile: '',
    cnic: '',
    age: '',
    gender: 'Male',
    dob: '',
    email: '',
    password: '',
    profession: 'Kurti Stitching',
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const professions = [
    'Kurti Stitching', 'Trouser Stitching', 'Kurti Overlock', 'Trouser Overlock',
    'Pressman', 'Kaaj Button', 'Supervisor', 'Quality Checker', 'Cutting Master',
    'Helper', 'Employee'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const generateWorkerId = () => {
    return 'JS-' + Math.floor(100000 + Math.random() * 900000);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!profileImage) {
      setError('Profile image is required');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      await sendEmailVerification(user);

      // Upload image
      const imageRef = ref(storage, `workers/${user.uid}`);
      await uploadBytes(imageRef, profileImage);
      const imageUrl = await getDownloadURL(imageRef);

      const workerId = generateWorkerId();

      // Save to Firestore
      await setDoc(doc(db, 'Workers', user.uid), {
        ...formData,
        uid: user.uid,
        workerId,
        profileImageUrl: imageUrl,
        createdAt: new Date().toISOString(),
        role: 'worker',
        status: 'active',
        totalEarned: 0,
        totalReceived: 0,
        remainingBalance: 0
      });

      alert(t('signupSuccess'));
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('signupError'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8" dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl border border-slate-100 p-8">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-slate-900 rounded-xl flex items-center justify-center">
            <Factory className="h-10 w-10 text-orange-500" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 mb-8">
          {t('workerSignup')}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('name')}</label>
              <input type="text" name="name" required onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('fatherName')}</label>
              <input type="text" name="fatherName" required onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('email')}</label>
              <input type="email" name="email" required onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('password')}</label>
              <input type="password" name="password" required onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('city')}</label>
              <input type="text" name="city" required onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('mobile')}</label>
              <input type="text" name="mobile" required onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('cnic')}</label>
              <input type="text" name="cnic" required onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('age')}</label>
              <input type="number" name="age" required onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('gender')}</label>
              <select name="gender" onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm">
                <option value="Male">{t('male')}</option>
                <option value="Female">{t('female')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('dob')}</label>
              <input type="date" name="dob" required onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('profession')}</label>
              <select name="profession" onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm">
                {professions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
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

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50"
            >
              {loading ? t('loading') : t('signup')}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm font-medium text-orange-600 hover:text-orange-500">
            Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  );
}
