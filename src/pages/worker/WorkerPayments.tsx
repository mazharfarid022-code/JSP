import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Download, Mail } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function WorkerPayments() {
  const { t } = useTranslation();
  const { workerData, currentUser } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [workRecords, setWorkRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, week, month

  useEffect(() => {
    fetchData();
  }, [currentUser, workerData, filter]);

  const fetchData = async () => {
    if (!currentUser || !workerData) return;
    setLoading(true);
    try {
      // Calculate date filters
      const now = new Date();
      let startDate = new Date(0);
      
      if (filter === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7));
      } else if (filter === 'month') {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
      }

      const paymentsQ = query(collection(db, 'Payments'), where('workerId', '==', workerData.workerId));
      const paymentsSnap = await getDocs(paymentsQ);
      const pData: any[] = [];
      paymentsSnap.forEach((doc) => {
        const data = doc.data();
        if (new Date(data.createdAt) >= startDate) {
          pData.push({ id: doc.id, ...data });
        }
      });
      setPayments(pData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

      const workQ = query(collection(db, 'WorkRecords'), where('workerId', '==', workerData.workerId));
      const workSnap = await getDocs(workQ);
      const wData: any[] = [];
      workSnap.forEach((doc) => {
        const data = doc.data();
        if (new Date(data.createdAt) >= startDate) {
          wData.push({ id: doc.id, ...data });
        }
      });
      setWorkRecords(wData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add Factory Header
    doc.setFontSize(20);
    doc.text('JS APPARELS', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Kids Wear Manufacturer', 105, 28, { align: 'center' });
    doc.text('Earning Statement', 105, 36, { align: 'center' });

    // Add Worker Info
    doc.setFontSize(10);
    doc.text(`Worker Name: ${workerData?.name}`, 14, 50);
    doc.text(`Worker ID: ${workerData?.workerId}`, 14, 56);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 50);

    // Add Summary
    doc.text(`Total Earned: Rs ${workerData?.totalEarned || 0}`, 14, 70);
    doc.text(`Total Received: Rs ${workerData?.totalReceived || 0}`, 14, 76);
    doc.text(`Remaining Balance: Rs ${workerData?.remainingBalance || 0}`, 14, 82);

    // Add Work Records Table
    doc.text('Work Records', 14, 95);
    const workBody = workRecords.map(w => [
      new Date(w.createdAt).toLocaleDateString(),
      w.laatNumber,
      w.totalItemsStitched,
      `Rs ${w.totalEarned}`,
      w.status
    ]);
    
    (doc as any).autoTable({
      startY: 100,
      head: [['Date', 'Laat Number', 'Items', 'Earned', 'Status']],
      body: workBody,
    });

    // Add Payments Table
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.text('Payment History', 14, finalY + 15);
    
    const paymentBody = payments.map(p => [
      new Date(p.createdAt).toLocaleDateString(),
      `Rs ${p.receivedPayment}`,
      `Rs ${p.remainingBalance}`
    ]);

    (doc as any).autoTable({
      startY: finalY + 20,
      head: [['Date', 'Received', 'Remaining Balance']],
      body: paymentBody,
    });

    return doc;
  };

  const handleDownloadPDF = () => {
    const doc = generatePDF();
    doc.save(`Statement_${workerData?.workerId}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleSendEmail = async () => {
    try {
      const doc = generatePDF();
      const pdfBase64 = doc.output('datauristring');
      
      const response = await fetch('/api/send-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: currentUser?.email,
          subject: 'JS APPARELS Earning Statement',
          text: `Dear ${workerData?.name},\n\nPlease find attached your earning statement.\n\nThank you for working with JS APPARELS.`,
          pdfBase64: pdfBase64,
          filename: `Statement_${workerData?.workerId}.pdf`
        }),
      });

      if (response.ok) {
        alert(t('receiptSent'));
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert(t('receiptError'));
    }
  };

  if (loading) return <div className="text-center py-10">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900">{t('statistics')}</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="block w-full sm:w-auto border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
          >
            <option value="all">All Time</option>
            <option value="month">{t('thisMonth')}</option>
            <option value="week">{t('thisWeek')}</option>
          </select>
          
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
          >
            <Download className="-ml-1 mr-2 h-5 w-5 text-slate-500" />
            {t('downloadStatement')}
          </button>
          
          <button
            onClick={handleSendEmail}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800"
          >
            <Mail className="-ml-1 mr-2 h-5 w-5" />
            {t('sendEmail')}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-slate-100 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
          <h3 className="text-lg leading-6 font-medium text-slate-900">Work History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('date')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('laatNumber')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('totalItemsStitched')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('totalEarned')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {workRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">{t('noData')}</td>
                </tr>
              ) : (
                workRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(record.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{record.laatNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{record.totalItemsStitched}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">Rs {record.totalEarned}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {record.status === 'completed' ? t('completed') : t('started')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-slate-100 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
          <h3 className="text-lg leading-6 font-medium text-slate-900">Payment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('date')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('receivedPayment')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('remainingBalance')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-slate-500">{t('noData')}</td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">Rs {payment.receivedPayment}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">Rs {payment.remainingBalance}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
