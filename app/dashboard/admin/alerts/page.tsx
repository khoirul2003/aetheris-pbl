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

  useEffect(() => {
    const unsubscribeAlerts = ClientAlertModel.subscribeToAlerts("ALL", (data: AlertData[]) => {
      setAlertsData(data);
    });
    return () => unsubscribeAlerts();
  }, []);

  const formatAlertTime = (createdAt: any) => {
    if (!createdAt) return "-";
    const date = (createdAt && typeof createdAt === "object" && "toDate" in createdAt && typeof createdAt.toDate === "function")
      ? createdAt.toDate()
      : new Date(createdAt);
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
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return formattedData;
  }, [alertsData, usersMap, sortConfig]);

  const handleSort = (key: "time" | "level" | "status") => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const indexOfLastRow = currentPage * pageSize;
  const indexOfFirstRow = indexOfLastRow - pageSize;
  const currentRows = tableData.slice(indexOfFirstRow, indexOfLastRow);

  return (
    <AdminLayout title="Alert History" description="View and monitor all detected system alerts.">
      <div className="flex w-full flex-col gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Restaurant ID</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("time")}>
                    <div className="flex items-center gap-1">Time <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="px-6 py-4">Restaurant Name</th>
                  <th className="px-6 py-4">Sensor Name</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("level")}>
                    <div className="flex items-center gap-1">Alert Level <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="px-6 py-4">System Action</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("status")}>
                    <div className="flex items-center gap-1">Status <ArrowUpDown size={12} /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 text-sm">
                {currentRows.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono text-xs font-bold">{item.id}</td>
                    <td className="px-6 py-4 text-slate-500">{item.time}</td>
                    <td className="px-6 py-4 font-medium">{item.restaurant}</td>
                    <td className="px-6 py-4 text-slate-600">{item.sensor}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.level === "DANGER" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{item.level}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{item.action}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === "RESOLVED" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-200">
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="border rounded px-2 py-1 text-sm">
              <option value={10}>10</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1 border rounded disabled:opacity-50"><ChevronLeft size={16}/></button>
              <button disabled={indexOfLastRow >= tableData.length} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1 border rounded disabled:opacity-50"><ChevronRight size={16}/></button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}