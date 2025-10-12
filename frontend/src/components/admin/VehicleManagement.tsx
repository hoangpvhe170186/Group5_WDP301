import { useState } from "react";
import { 
  Search, 
  Filter, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Truck,
  Car,
  Van,
  MapPin,
  Fuel,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  Wrench
} from "lucide-react";

export default function VehicleManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Dữ liệu mẫu xe
  const vehicles = [
    {
      id: "VEH001",
      plateNumber: "30A-12345",
      type: "Truck",
      model: "Hyundai HD270",
      capacity: "2000kg",
      driver: "Nguyễn Văn A",
      status: "active",
      location: "Hà Nội",
      fuelLevel: 85,
      mileage: 125000,
      lastMaintenance: "2024-01-10",
      nextMaintenance: "2024-02-10",
      createdAt: "2023-06-15"
    },
    {
      id: "VEH002",
      plateNumber: "29B-67890",
      type: "Van",
      model: "Ford Transit",
      capacity: "1000kg",
      driver: "Trần Thị B",
      status: "maintenance",
      location: "TP.HCM",
      fuelLevel: 45,
      mileage: 89000,
      lastMaintenance: "2024-01-05",
      nextMaintenance: "2024-02-05",
      createdAt: "2023-08-20"
    },
    {
      id: "VEH003",
      plateNumber: "51C-11111",
      type: "Car",
      model: "Toyota Hiace",
      capacity: "500kg",
      driver: "Lê Văn C",
      status: "active",
      location: "Đà Nẵng",
      fuelLevel: 92,
      mileage: 156000,
      lastMaintenance: "2024-01-08",
      nextMaintenance: "2024-02-08",
      createdAt: "2023-04-10"
    },
    {
      id: "VEH004",
      plateNumber: "43D-22222",
      type: "Truck",
      model: "Isuzu NQR",
      capacity: "1500kg",
      driver: "Phạm Thị D",
      status: "inactive",
      location: "Cần Thơ",
      fuelLevel: 20,
      mileage: 98000,
      lastMaintenance: "2023-12-20",
      nextMaintenance: "2024-01-20",
      createdAt: "2023-09-05"
    },
    {
      id: "VEH005",
      plateNumber: "92E-33333",
      type: "Van",
      model: "Mercedes Sprinter",
      capacity: "1200kg",
      driver: "Hoàng Văn E",
      status: "active",
      location: "Hải Phòng",
      fuelLevel: 78,
      mileage: 67000,
      lastMaintenance: "2024-01-12",
      nextMaintenance: "2024-02-12",
      createdAt: "2023-11-15"
    }
  ];

  // Thống kê xe
  const vehicleStats = [
    {
      label: "Tổng số xe",
      value: "25",
      change: "+2",
      trend: "up",
      icon: Truck,
      color: "blue"
    },
    {
      label: "Đang hoạt động",
      value: "22",
      change: "+1",
      trend: "up",
      icon: CheckCircle,
      color: "green"
    },
    {
      label: "Đang bảo trì",
      value: "2",
      change: "0",
      trend: "neutral",
      icon: Wrench,
      color: "yellow"
    },
    {
      label: "Không hoạt động",
      value: "1",
      change: "-1",
      trend: "down",
      icon: XCircle,
      color: "red"
    }
  ];

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "Truck":
        return <Truck className="w-6 h-6" />;
      case "Van":
        return <Van className="w-6 h-6" />;
      case "Car":
        return <Car className="w-6 h-6" />;
      default:
        return <Truck className="w-6 h-6" />;
    }
  };

  const getVehicleColor = (type: string) => {
    switch (type) {
      case "Truck":
        return "bg-blue-100 text-blue-800";
      case "Van":
        return "bg-green-100 text-green-800";
      case "Car":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "maintenance":
        return <Wrench className="w-4 h-4" />;
      case "inactive":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Hoạt động";
      case "maintenance":
        return "Bảo trì";
      case "inactive":
        return "Không hoạt động";
      default:
        return "Không xác định";
    }
  };

  const getFuelColor = (level: number) => {
    if (level >= 70) return "text-green-600";
    if (level >= 30) return "text-yellow-600";
    return "text-red-600";
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || vehicle.status === filterStatus;
    const matchesType = filterType === "all" || vehicle.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý xe</h1>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Thêm xe mới
        </button>
      </div>

      {/* Vehicle stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {vehicleStats.map((stat, index) => {
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
                <span className={`text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 
                  stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">so với tháng trước</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vehicle location map placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vị trí xe hiện tại</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Bản đồ vị trí xe sẽ được hiển thị ở đây</p>
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
                placeholder="Tìm kiếm theo biển số, model, tài xế, vị trí..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Tất cả loại xe</option>
              <option value="Truck">Xe tải</option>
              <option value="Van">Xe van</option>
              <option value="Car">Xe ô tô</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="maintenance">Bảo trì</option>
              <option value="inactive">Không hoạt động</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Vehicles table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thông tin xe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tài xế
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vị trí
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhiên liệu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bảo trì
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVehicles.map((vehicle, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          {getVehicleIcon(vehicle.type)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{vehicle.plateNumber}</div>
                        <div className="text-sm text-gray-500">{vehicle.model}</div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getVehicleColor(vehicle.type)}`}>
                            {vehicle.type}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">{vehicle.capacity}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{vehicle.driver}</div>
                      <div className="text-sm text-gray-500">ID: {vehicle.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {vehicle.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Fuel className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <div className={`text-sm font-medium ${getFuelColor(vehicle.fuelLevel)}`}>
                          {vehicle.fuelLevel}%
                        </div>
                        <div className="text-xs text-gray-500">{vehicle.mileage.toLocaleString()} km</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                      {getStatusIcon(vehicle.status)}
                      <span className="ml-1">{getStatusText(vehicle.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Cuối: {vehicle.lastMaintenance}</div>
                      <div className="text-xs text-gray-500">Tiếp: {vehicle.nextMaintenance}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-orange-600 hover:text-orange-900 p-1">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 p-1">
                        <Trash2 className="w-4 h-4" />
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
                Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">{filteredVehicles.length}</span> 
                của <span className="font-medium">{vehicles.length}</span> kết quả
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
