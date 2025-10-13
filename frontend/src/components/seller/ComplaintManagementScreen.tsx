import React, { useState } from 'react';
import { SparklesIcon } from './Icons';

const ComplaintManagementScreen = () => {
  const initialComplaints = [
    { id: 'KN-015', orderId: 'HE-84255', seller: 'Shop A', issue: 'Hàng hóa bị hư hỏng nặng khi nhận.', received: '2 giờ trước' },
    { id: 'KN-014', orderId: 'HE-84251', seller: 'Shop B', issue: 'Giao hàng trễ 3 ngày so với dự kiến.', received: '1 ngày trước' },
  ];

  const [complaints, setComplaints] = useState(initialComplaints.map(c => ({ ...c, suggestions: null, draft: null, isLoading: false, error: null })));

  const getGeminiResponse = async (prompt) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (prompt.includes("Gợi ý các bước giải quyết")) {
          resolve({
            text: () => `1. **Xin lỗi khách hàng:** Liên hệ ngay và xin lỗi vì sự cố.\n2. **Kiểm tra hàng hóa:** Xác minh tình trạng sản phẩm với kho.\n3. **Đề xuất phương án:** Đổi hàng mới hoặc hoàn tiền tùy theo chính sách.`,
          });
        } else if (prompt.includes("Soạn email phản hồi")) {
          const sellerName = prompt.match(/người bán (.*?) về vấn đề/)[1];
          resolve({
            text: () => `Chào anh/chị ${sellerName},\n\nChúng tôi rất tiếc về vấn đề mà khách hàng đã gặp phải với đơn hàng của bạn.\n\nVui lòng kiểm tra và phản hồi trong vòng 24 giờ để chúng tôi hỗ trợ xử lý.\n\nTrân trọng,\nĐội ngũ Home Express`,
          });
        } else {
          reject(new Error("Yêu cầu không hợp lệ."));
        }
      }, 1500);
    });
  };

  const handleGenerate = async (complaintId, type) => {
    const complaintIndex = complaints.findIndex(c => c.id === complaintId);
    if (complaintIndex === -1) return;

    const updatedComplaints = [...complaints];
    updatedComplaints[complaintIndex] = { ...updatedComplaints[complaintIndex], isLoading: type, error: null };
    setComplaints(updatedComplaints);

    const complaint = updatedComplaints[complaintIndex];

    try {
      let prompt = '';
      if (type === 'suggestions') {
        prompt = `Với vai trò là người bán, hãy gợi ý các bước giải quyết cho khiếu nại sau: "${complaint.issue}"`;
      } else if (type === 'draft') {
        prompt = `Với vai trò là người bán, hãy soạn email phản hồi cho đội ngũ hỗ trợ về vấn đề: "${complaint.issue}" của người bán ${complaint.seller}`;
      }
      
      const response = await getGeminiResponse(prompt);
      const text = await response.text();

      const finalComplaints = [...complaints];
      if (type === 'suggestions') {
        finalComplaints[complaintIndex] = { ...complaint, suggestions: text, isLoading: false };
      } else {
        finalComplaints[complaintIndex] = { ...complaint, draft: text, isLoading: false };
      }
      setComplaints(finalComplaints);
    } catch (err) {
      const finalComplaints = [...complaints];
      finalComplaints[complaintIndex] = { ...complaint, error: 'Không thể tạo nội dung. Vui lòng thử lại.', isLoading: false };
      setComplaints(finalComplaints);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Quản lý Khiếu nại</h1>
      <div className="space-y-4">
        {complaints.map(c => (
          <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-600">{c.id} (Đơn hàng: {c.orderId})</p>
                <h3 className="mt-1 text-lg font-bold text-gray-800">{c.seller}</h3>
                <p className="mt-2 text-sm text-gray-600">{c.issue}</p>
              </div>
              <div className="text-right">
                <button className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600">Xử lý ngay</button>
              </div>
            </div>
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => handleGenerate(c.id, 'suggestions')} 
                  disabled={c.isLoading}
                  className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <SparklesIcon />
                  {c.isLoading === 'suggestions' ? 'Đang tạo gợi ý...' : '✨ Gợi ý giải quyết'}
                </button>
                <button 
                  onClick={() => handleGenerate(c.id, 'draft')}
                  disabled={c.isLoading}
                  className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-xs font-semibold text-green-600 shadow-sm transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <SparklesIcon />
                  {c.isLoading === 'draft' ? 'Đang soạn thư...' : '✨ Soạn thư trả lời'}
                </button>
              </div>

              {c.error && <p className="mt-3 text-xs text-red-600">{c.error}</p>}

              {c.suggestions && (
                <div className="mt-4 rounded-lg bg-blue-50/50 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">Gợi ý các bước xử lý</h4>
                  <div className="prose prose-sm mt-2 text-blue-900" dangerouslySetInnerHTML={{ __html: c.suggestions.replace(/\n/g, '<br/>') }} />
                </div>
              )}

              {c.draft && (
                <div className="mt-4 rounded-lg bg-green-50/50 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-green-800">Bản nháp email gửi hỗ trợ</h4>
                  <div className="prose prose-sm mt-2 whitespace-pre-line text-green-900">{c.draft}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplaintManagementScreen;