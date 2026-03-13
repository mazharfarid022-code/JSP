import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Factory, Lock, User, Mail } from 'lucide-react';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setAdminState } = useAuth();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ur' : 'en');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Admin Login Check
    if (identifier.toLowerCase() === 'js-admin' && password === '76791276') {
      setAdminState(true);
      navigate('/admin');
      setLoading(false);
      return;
    }

    try {
      let emailToUse = identifier;

      // Check if identifier is Worker ID or CNIC (not an email)
      if (!identifier.includes('@')) {
        const workersRef = collection(db, 'Workers');
        
        // Check Worker ID
        let q = query(workersRef, where('workerId', '==', identifier));
        let querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          // Check CNIC
          q = query(workersRef, where('cnic', '==', identifier));
          querySnapshot = await getDocs(q);
        }

        if (!querySnapshot.empty) {
          emailToUse = querySnapshot.docs[0].data().email;
        } else {
          throw new Error('User not found');
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      
      if (!userCredential.user.emailVerified) {
        setError(t('emailNotVerified'));
        auth.signOut();
        setLoading(false);
        return;
      }

      setAdminState(false);
      navigate('/worker');
    } catch (err: any) {
      console.error(err);
      setError(t('loginError'));
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!identifier || !identifier.includes('@')) {
      setError('Please enter your email address to reset password');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, identifier);
      setResetSent(true);
      setError('');
    } catch (err) {
      setError('Failed to send reset email');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8" dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleLanguage}
          className="px-4 py-2 bg-white text-slate-700 rounded-md shadow-sm border border-slate-200 hover:bg-slate-50"
        >
          {i18n.language === 'en' ? 'اردو' : 'English'}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-slate-900 rounded-xl flex items-center justify-center">
            <Factory className="h-10 w-10 text-orange-500" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          {t('factoryName')}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {t('factoryDesc')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {resetSent && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                {t('resetEmailSent')}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email / Worker ID / CNIC
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2 border"
                  placeholder="Enter your ID or Email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                {t('password')}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2 border"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="font-medium text-orange-600 hover:text-orange-500"
                >
                  {t('forgotPassword')}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50"
              >
                {loading ? t('loading') : t('login')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">New worker?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/signup"
                className="w-full flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                {t('signup')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
