"use client";
import React, { useState, useRef } from "react";
import axios from "axios";
import { X, Upload, Image, Trash2, AlertCircle } from "lucide-react";

const OrderImageUploadModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setError(""); // Reset error
    
    console.log("📁 Files selected:", files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type
    })));

    // Validate file types and size
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError(`File ${file.name} không phải là hình ảnh`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`File ${file.name} vượt quá 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      return;
    }

    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, {
          file,
          preview: e.target.result,
          name: file.name,
          size: file.size,
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setError("");
  };

  const handleUpload = async () => {
    if (images.length === 0) {
      setError("Vui lòng chọn ít nhất một ảnh");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("Bạn cần đăng nhập!");
        return;
      }

      const formData = new FormData();
      
      images.forEach(image => {
        console.log("📤 Adding to FormData:", image.name);
        formData.append("files", image.file);
      });
      
      const folderName = `orders/${order.orderCode}`;
      formData.append("folder", folderName);

      console.log("📤 Bắt đầu upload...", {
        fileCount: images.length,
        folder: folderName,
        files: images.map(img => img.name)
      });

      const res = await axios.post(
        "http://localhost:4000/api/upload/images",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      console.log("✅ Upload response:", res.data);

      if (res.data && Array.isArray(res.data)) {
        // Gửi thông tin ảnh lên server để lưu vào order
        await saveOrderImages(res.data);
      } else {
        throw new Error("Dữ liệu trả về không hợp lệ");
      }
    } catch (err) {
      console.error("❌ Lỗi khi upload ảnh:", err);
      
      let errorMessage = "Upload ảnh thất bại!";
      
      if (err.response) {
        // Server trả về lỗi
        errorMessage = err.response.data?.error || err.response.data?.message || `Lỗi server: ${err.response.status}`;
        console.error("📋 Chi tiết lỗi server:", err.response.data);
      } else if (err.request) {
        // Không nhận được response
        errorMessage = "Không thể kết nối đến server. Vui lòng thử lại.";
        console.error("📋 Không có response:", err.request);
      } else {
        // Lỗi khác
        errorMessage = err.message || "Lỗi không xác định";
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const saveOrderImages = async (uploadedImages) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await axios.post(
        `http://localhost:4000/api/orders/${order._id}/images`,
        {
          images: uploadedImages
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        console.log("✅ Đã lưu ảnh vào order:", res.data);
        alert("✅ Upload ảnh thành công!");
        onSuccess();
        onClose();
      } else {
        throw new Error(res.data.message || "Lỗi khi lưu ảnh");
      }
    } catch (err) {
      console.error("❌ Lỗi khi lưu ảnh:", err);
      setError("❌ Lỗi khi lưu thông tin ảnh: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const fileInput = {
      target: { files }
    };
    handleFileSelect(fileInput);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const clearAllImages = () => {
    setImages([]);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-5 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-center flex-1">
            📸 Upload Ảnh Đơn Hàng
          </h2>
          <button
            onClick={onClose}
            className="bg-white text-blue-600 hover:bg-blue-100 font-semibold px-4 py-2 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Mã đơn hàng:</strong> #{order.orderCode}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Lưu ý:</strong> Upload ảnh hàng hóa, địa chỉ giao nhận, hoặc các minh chứng khác
            </p>
          </div>

          {/* Hiển thị lỗi */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 cursor-pointer hover:border-blue-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 mb-2">
              Kéo thả ảnh vào đây hoặc click để chọn
            </p>
            <p className="text-sm text-gray-500">
              Hỗ trợ JPG, PNG, GIF (tối đa 5MB/ảnh)
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Ảnh đã chọn ({images.length})
                </h3>
                <button
                  onClick={clearAllImages}
                  className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa tất cả
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="mt-1 text-xs text-gray-500 truncate">
                      {image.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {(image.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || images.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang upload...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload {images.length} ảnh
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderImageUploadModal;