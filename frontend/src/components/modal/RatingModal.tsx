"use client";
import React, { useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";

const RatingModal = ({ orderId, customerId, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return alert("Vui lòng chọn số sao!");
    setLoading(true);
    try {
      await axios.post("http://localhost:4000/api/users/feedbacks", {
        order_id: orderId,
        customer_id: customerId,
        rating,
        comment,
      });
      alert("Cảm ơn bạn đã đánh giá đơn hàng!");
      onClose();
    } catch (err) {
      console.error("❌ Lỗi khi gửi feedback:", err);
      alert("Không thể gửi đánh giá.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Đánh giá đơn hàng</h2>

        {/* ⭐ Rating */}
        <div className="flex justify-center mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className={`w-8 h-8 cursor-pointer ${
                (hover || rating) >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
        </div>

        {/* 💬 Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Nhập nhận xét của bạn..."
          className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-4 focus:ring-1 focus:ring-blue-500"
          rows={4}
        />

        {/* 🔘 Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
