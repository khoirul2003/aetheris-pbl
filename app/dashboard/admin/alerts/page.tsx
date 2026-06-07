"use client";

import { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { ClientAlertModel, AlertData } from "@/models/clientAlertModel";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

export default function AdminAlertsPage() {
  // Pagination State - Default diubah ke 30
  const [pageSize, setPageSize] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: "time" | "level" | "status"; direction: "asc" | "desc" } | null>(null);

  // Core Data State
  const [alertsData, setAlertsData] = useState<AlertData[]>([]);
  const [usersMap, setUsersMap] = useState<{ [uid: string]: string }>({});

  // 1. Fetch real-time restaurant names mapping from 'users' collection
  useEffect(() => {
    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const mapping: { [uid: string]: string } = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        mapping[doc.id] = data.restaurantName || data.name || "Unknown Restaurant";
      });
      setUsersMap(mapping);
    });

    return () => unsubscribeUsers();
  }, []);

  // 2. Fetch global alert logs for Admin
  useEffect(() => {
    const unsubscribeAlerts = ClientAlertModel.subscribeToAlerts("ALL", (data: AlertData[]) => {
      setAlertsData(data);
    });
    
    return () => unsubscribeAlerts();
  }, []);

  // Safe Timestamp conversion
  const formatAlertTime = (createdAt: { toDate?: () => Date } | Date | string | number | null | undefined) => {
    if (!createdAt) return "-";
    
    const date = (createdAt && typeof createdAt === "object" && "toDate" in createdAt && typeof createdAt.toDate === "function")
      ? createdAt.toDate()
      : new Date(createdAt as string | number | Date);

    return date.toISOString().replace('T', ' ').substring(0, 16);
  };

  // Transform and Sort Data
  const tableData = useMemo(() => {
    let formattedData = alertsData.map((item) => {
      const timeStr = formatAlertTime(item.createdAt);
      return {
        id: item.userId ? `RES-${item.userId.substring(0, 4).toUpperCase()}` : "RES-000",
        time: timeStr,
        restaurant: usersMap[item.userId] || item.sensorName || "Partner Restaurant",
        sensor: item.sensorName || item.location || "Main Sensor",
        level: item.level === "danger" ? "DANGER" : "WARNING",
        action: item.level === "danger" ? "Buzzer Active & SMS Sent" : "App Notification Sent",
        status: item.isResolved ? "RESOLVED" : "PROCESSING",
      };
    });

    if (sortConfig !== null) {
      formattedData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return formattedData;
  }, [alertsData, usersMap, sortConfig]);

  // Handle Sort Click
  const handleSort = (key: "time" | "level" | "status") => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Pagination Logic
  const indexOfLastRow = currentPage * pageSize;
  const indexOfFirstRow = indexOfLastRow - pageSize;
  const currentRows = tableData.slice(indexOfFirstRow, indexOfLastRow);

  const renderPaginationControls = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 border-t border-slate-200 print:hidden text-slate-700 text-sm">
      <div className="flex items-center gap-2">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1); // Reset ke halaman 1 saat mengubah jumlah baris
          }}
          className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4D6344] cursor-pointer transition-all"
        >
          <option value={10}>10</option>
          <option value={30}>30</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span>entries per page</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-slate-500 font-medium">
          Showing {tableData.length === 0 ? 0 : indexOfFirstRow + 1} - {Math.min(indexOfLastRow, tableData.length)} of {tableData.length} logs
        </span>
        <div className="flex gap-1">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white cursor-pointer transition-colors border-none"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            disabled={indexOfLastRow >= tableData.length}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white cursor-pointer transition-colors border-none"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout
      title="Alert History"
      description="View and monitor all detected system alerts."
    >
      <div className="flex w-full flex-col gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Restaurant ID</th>
                  
                  {/* SORTABLE TIME */}
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                    onClick={() => handleSort("time")}
                  >
                    <div className="flex items-center gap-1.5">
                      Time
                      <ArrowUpDown size={14} className={`transition-opacity ${sortConfig?.key === "time" ? "opacity-100 text-[#4D6344]" : "opacity-0 group-hover:opacity-50"}`} />
                    </div>
                  </th>
                  
                  <th className="px-6 py-4">Restaurant Name</th>
                  <th className="px-6 py-4">Sensor Name</th>
                  
                  {/* SORTABLE ALERT LEVEL */}
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                    onClick={() => handleSort("level")}
                  >
                    <div className="flex items-center gap-1.5">
                      Alert Level
                      <ArrowUpDown size={14} className={`transition-opacity ${sortConfig?.key === "level" ? "opacity-100 text-[#4D6344]" : "opacity-0 group-hover:opacity-50"}`} />
                    </div>
                  </th>
                  
                  <th className="px-6 py-4">System Action</th>
                  
                  {/* SORTABLE STATUS */}
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1.5">
                      Status
                      <ArrowUpDown size={14} className={`transition-opacity ${sortConfig?.key === "status" ? "opacity-100 text-[#4D6344]" : "opacity-0 group-hover:opacity-50"}`} />
                    </div>
                  </th>

                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 text-sm">
                {currentRows.length > 0 ? (
                  currentRows.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">{item.id}</td>
                      <td className="px-6 py-4 text-slate-500">{item.time}</td>
                      <td className="px-6 py-4 text-slate-900 font-medium">{item.restaurant}</td>
                      <td className="px-6 py-4 text-slate-600">{item.sensor}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          item.level === "DANGER" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                        }`}>{item.level}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{item.action}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === "RESOLVED" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        }`}>{item.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-xs">
                      No alert logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Menampilkan Pagination HANYA 1 kali di bawah tabel */}
          {renderPaginationControls()}
        </div>
      </div>
    </AdminLayout>
  );
}