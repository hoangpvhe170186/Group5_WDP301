import { useState } from "react";
import { 
  Search, 
  Filter, 
  Star, 
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  BarChart3
} from "lucide-react";

export default function QualityManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("month");

  // Dữ liệu mẫu đánh giá
  const reviews = [
    {
      id: "REV001",
      customerName: "Nguyễn Văn A",
      orderId: "#ORD001",
      rating: 5,
      title: "Dịch vụ tuyệt vời",
      comment: "Giao hàng nhanh, đóng gói cẩn thận, nhân viên thân thiện. Sẽ tiếp tục sử dụng dịch vụ.",
      category: "Delivery",
      createdAt: "2024-01-15 14:30",
      helpful: 12
    },
    {
      id: "REV002",
      customerName: "Trần Thị B",
      orderId: "#ORD002",
      rating: 4,
      title: "Tốt nhưng có thể cải thiện",
      comment: "Chất lượng sản phẩm tốt, nhưng thời gian giao hàng hơi chậm so với cam kết.",
      category: "Product",
      createdAt: "2024-01-14 10:15",
      helpful: 8
    },
    {
      id: "REV003",
      customerName: "Lê Văn C",
      orderId: "#ORD003",
      rating: 2,
      title: "Không hài lòng",
      comment: "Sản phẩm bị hỏng khi nhận, phải liên hệ nhiều lần mới được giải quyết.",
      category: "Product",
      createdAt: "2024-01-13 16:20",
      helpful: 5
    },
    {
      id: "REV004",
      customerName: "Phạm Thị D",
      orderId: "#ORD004",
      rating: 5,
      title: "Rất hài lòng",
      comment: "Đóng gói đẹp, giao hàng đúng giờ, sản phẩm chất lượng cao.",
      category: "Service",
      createdAt: "2024-01-12 09:45",
      helpful: 15
    },
    {
      id: "REV005",
      customerName: "Hoàng Văn E",
      orderId: "#ORD005",
      rating: 3,
      title: "Trung bình",
      comment: "Dịch vụ ổn, giá cả hợp lý nhưng cần cải thiện thời gian phản hồi hỗ trợ khách hàng.",
      category: "Support",
      createdAt: "2024-01-11 13:30",
      helpful: 3
    }
  ];

  // Thống kê chất lượng
  const qualityStats = [
    {
      label: "Điểm đánh giá TB",
      value: "4.2",
      change: "+0.3",
      trend: "up",
      icon: Star
    },
    {
      label: "Tỷ lệ hài lòng",
      value: "87%",
      change: "+5%",
      trend: "up",
      icon: CheckCircle
    },
    {
      label: "Đánh giá tích cực",
      value: "156",
      change: "+12",
      trend: "up",
      icon: TrendingUp
    },
    {
      label: "Khiếu nại",
      value: "8",
      change: "-2",
      trend: "down",
      icon: AlertCircle
    }
  ];

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Delivery":
        return <Truck className="w-4 h-4" />;
      case "Product":
        return <Package className="w-4 h-4" />;
      case "Service":
        return <Users className="w-4 h-4" />;
      case "Support":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Delivery":
        return "bg-blue-100 text-blue-800";
      case "Product":
        return "bg-green-100 text-green-800";
      case "Service":
        return "bg-purple-100 text-purple-800";
      case "Support":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredReviews = reviews.filter(review => {
    return review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           review.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
           review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           review.comment.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý chất lượng</h1>
        <div className="flex gap-3">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Báo cáo chi tiết
          </button>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tạo khảo sát
          </button>
        </div>
      </div>

      {/* Quality stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {qualityStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Icon className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium flex items-center ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">so với tháng trước</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rating distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố đánh giá</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = reviews.filter(r => r.rating === rating).length;
            const percentage = (count / reviews.length) * 100;
            return (
              <div key={rating} className="flex items-center">
                <div className="flex items-center w-20">
                  <span className="text-sm font-medium text-gray-600">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current ml-1" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-12 text-right">
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên khách hàng, đơn hàng, tiêu đề..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="quarter">Quý này</option>
              <option value="year">Năm nay</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Reviews table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Đánh giá gần đây</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đánh giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nội dung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày đánh giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReviews.map((review, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{review.customerName}</div>
                      <div className="text-sm text-gray-500">Đơn hàng: {review.orderId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex">
                        {getRatingStars(review.rating)}
                      </div>
                      <span className={`ml-2 text-sm font-medium ${getRatingColor(review.rating)}`}>
                        {review.rating}/5
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {review.helpful} người hữu ích
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="text-sm font-medium text-gray-900">{review.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-2">{review.comment}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(review.category)}`}>
                      {getCategoryIcon(review.category)}
                      <span className="ml-1">{review.category}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {review.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1">
                        <Star className="w-4 h-4" />
                      </button>
                      <button className="text-orange-600 hover:text-orange-900 p-1">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 p-1">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Trước
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Sau
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">{filteredReviews.length}</span> 
                của <span className="font-medium">{reviews.length}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Trước
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Sau
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
