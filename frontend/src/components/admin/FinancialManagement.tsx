import { useState } from "react";
import { 
  Search, 
  Filter, 
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Wallet,
  BarChart3,
  PieChart,
  Calendar,
  Eye,
  Edit,
  CheckCircle
} from "lucide-react";

export default function FinancialManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("month");
  const [filterType, setFilterType] = useState("all");

  // Dữ liệu mẫu tài chính
  const transactions = [
    {
      id: "TXN001",
      type: "income",
      description: "Thanh toán đơn hàng #ORD001",
      amount: 1500000,
      customer: "Nguyễn Văn A",
      paymentMethod: "Bank Transfer",
      status: "completed",
      createdAt: "2024-01-15 14:30",
      orderId: "#ORD001"
    },
    {
      id: "TXN002",
      type: "expense",
      description: "Chi phí vận chuyển",
      amount: 200000,
      customer: "Công ty vận chuyển ABC",
      paymentMethod: "Cash",
      status: "completed",
      createdAt: "2024-01-15 10:15",
      orderId: null
    },
    {
      id: "TXN003",
      type: "income",
      description: "Thanh toán đơn hàng #ORD002",
      amount: 2300000,
      customer: "Trần Thị B",
      paymentMethod: "Credit Card",
      status: "pending",
      createdAt: "2024-01-14 16:20",
      orderId: "#ORD002"
    },
    {
      id: "TXN004",
      type: "refund",
      description: "Hoàn tiền đơn hàng #ORD003",
      amount: 800000,
      customer: "Lê Văn C",
      paymentMethod: "Bank Transfer",
      status: "processing",
      createdAt: "2024-01-14 09:45",
      orderId: "#ORD003"
    },
    {
      id: "TXN005",
      type: "income",
      description: "Thanh toán đơn hàng #ORD004",
      amount: 450000,
      customer: "Phạm Thị D",
      paymentMethod: "E-Wallet",
      status: "completed",
      createdAt: "2024-01-13 13:30",
      orderId: "#ORD004"
    }
  ];

  // Thống kê tài chính
  const financialStats = [
    {
      label: "Tổng doanh thu",
      value: "₫45.6M",
      change: "+15%",
      trend: "up",
      icon: TrendingUp,
      color: "green"
    },
    {
      label: "Chi phí vận hành",
      value: "₫12.3M",
      change: "+8%",
      trend: "up",
      icon: TrendingDown,
      color: "red"
    },
    {
      label: "Lợi nhuận",
      value: "₫33.3M",
      change: "+18%",
      trend: "up",
      icon: DollarSign,
      color: "blue"
    },
    {
      label: "Tỷ lệ hoàn tiền",
      value: "2.1%",
      change: "-0.5%",
      trend: "down",
      icon: CheckCircle,
      color: "orange"
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "income":
        return <TrendingUp className="w-4 h-4" />;
      case "expense":
        return <TrendingDown className="w-4 h-4" />;
      case "refund":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "income":
        return "bg-green-100 text-green-800";
      case "expense":
        return "bg-red-100 text-red-800";
      case "refund":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "income":
        return "Thu nhập";
      case "expense":
        return "Chi phí";
      case "refund":
        return "Hoàn tiền";
      default:
        return "Không xác định";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Hoàn thành";
      case "pending":
        return "Chờ xử lý";
      case "processing":
        return "Đang xử lý";
      case "failed":
        return "Thất bại";
      default:
        return "Không xác định";
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "Credit Card":
        return <CreditCard className="w-4 h-4" />;
      case "Bank Transfer":
        return <Wallet className="w-4 h-4" />;
      case "E-Wallet":
        return <DollarSign className="w-4 h-4" />;
      case "Cash":
        return <DollarSign className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || transaction.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý tài chính</h1>
        <div className="flex gap-3">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Báo cáo chi tiết
          </button>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Financial stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {financialStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-2 bg-${stat.color}-100 rounded-lg`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
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

      {/* Revenue chart placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Biểu đồ doanh thu</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg">Tháng</button>
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg">Quý</button>
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg">Năm</button>
          </div>
        </div>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Biểu đồ doanh thu sẽ được hiển thị ở đây</p>
          </div>
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
                placeholder="Tìm kiếm theo ID, khách hàng, mô tả..."
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
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Tất cả loại</option>
              <option value="income">Thu nhập</option>
              <option value="expense">Chi phí</option>
              <option value="refund">Hoàn tiền</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Giao dịch gần đây</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID giao dịch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phương thức
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{transaction.id}</div>
                    {transaction.orderId && (
                      <div className="text-sm text-gray-500">{transaction.orderId}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                      {getTypeIcon(transaction.type)}
                      <span className="ml-1">{getTypeText(transaction.type)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{transaction.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.customer}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 
                      transaction.type === 'expense' ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {transaction.type === 'expense' || transaction.type === 'refund' ? '-' : '+'}₫{transaction.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      {getPaymentMethodIcon(transaction.paymentMethod)}
                      <span className="ml-2">{transaction.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {getStatusText(transaction.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-orange-600 hover:text-orange-900 p-1">
                        <Edit className="w-4 h-4" />
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
                Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">{filteredTransactions.length}</span> 
                của <span className="font-medium">{transactions.length}</span> kết quả
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
