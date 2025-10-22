import { useEffect, useState } from "react";
import axios from "axios";

export default function ExtraFeeSelector({
  onChange,
}: {
  onChange: (selectedFees: any[]) => void;
}) {
  const [extraFees, setExtraFees] = useState<any[]>([]);
  const [selectedFees, setSelectedFees] = useState<string[]>([]);

  // 🔄 Lấy danh sách phụ phí từ backend
  useEffect(() => {
    axios
      .get("http://localhost:4000/api/extrafees")
      .then((res) => {
        if (res.data.success) setExtraFees(res.data.data);
      })
      .catch((err) => console.error("❌ Lỗi tải phụ phí:", err));
  }, []);

  // ✅ Khi người dùng chọn/bỏ chọn
  const toggleFee = (id: string) => {
    setSelectedFees((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  // 🧮 Truyền dữ liệu ra ngoài
  useEffect(() => {
    const selectedData = extraFees.filter((f) => selectedFees.includes(f._id));
    onChange(selectedData);
  }, [selectedFees]);

  // 📂 Gom nhóm theo category
  const grouped = extraFees.reduce((acc: any, fee) => {
    acc[fee.category] = acc[fee.category] || [];
    acc[fee.category].push(fee);
    return acc;
  }, {});

  return (
    <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h3 className="font-bold text-lg mb-3">🔧 Dịch vụ bổ sung</h3>

      {Object.entries(grouped).map(([category, fees]: any) => (
        <div key={category} className="mb-4">
          <p className="font-semibold text-orange-600 mb-2">{category}</p>
          <div className="space-y-2">
            {fees.map((fee: any) => {
              const price = Number(fee.price.$numberDecimal || fee.price);
              const checked = selectedFees.includes(fee._id);
              return (
                <label
                  key={fee._id}
                  className={`flex justify-between items-center border rounded-md p-2 cursor-pointer text-sm transition-all ${
                    checked ? "border-orange-500 bg-orange-50" : "border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFee(fee._id)}
                    />
                    <span>{fee.name}</span>
                  </div>
                  <span className="text-orange-600 font-semibold">
                    +{price.toLocaleString("vi-VN")}₫
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
