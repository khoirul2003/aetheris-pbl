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

  const formatAlertTime = (createdAt: unknown) => {
    if (!createdAt) return "-";
    
    // Mengecek dengan aman apakah object tersebut memiliki fungsi "toDate" (ciri khas Firestore Timestamp)
    const isFirestoreTimestamp = 
      typeof createdAt === "object" && 
      createdAt !== null && 
      "toDate" in createdAt && 
      typeof (createdAt as Record<string, unknown>).toDate === "function";

    const date = isFirestoreTimestamp
      ? (createdAt as { toDate: () => Date }).toDate()
      : new Date(createdAt as string | number | Date);

    // FORMAT BARU: Thu, Jun 4, 2026 - 12:31 PM
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);

    const formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);

    return `${formattedDate} - ${formattedTime}`;
  };

  // Transform and Sort Data
  const tableData = useMemo(() => {
    const formattedData = alertsData.map((item) => {
      const timeStr = formatAlertTime(item.createdAt);
      return {
        id: item.userId ? `RES-${item.userId.substring(0, 4).toUpperCase()}` : "RES-000",
        time: timeStr,
        // Menyimpan nilai Date mentah untuk keperluan sorting yang akurat
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rawDate: item.createdAt ? (typeof item.createdAt === "object" && "toDate" in item.createdAt ? (item.createdAt as any).toDate().getTime() : new Date(item.createdAt as string).getTime()) : 0,
        restaurant: usersMap[item.userId] || item.sensorName || "Partner Restaurant",
        sensor: item.sensorName || item.location || "Main Sensor",
        level: item.level === "danger" ? "DANGER" : "WARNING",
        action: item.level === "danger" ? "Buzzer Active & SMS Sent" : "App Notification Sent",
        status: item.isResolved ? "RESOLVED" : "PROCESSING",
      };
    });

    if (sortConfig !== null) {
      formattedData.sort((a, b) => {
        // PERBAIKAN: Jika yang disortir adalah waktu, gunakan rawDate (angka milidetik) agar urutannya benar (bukan urutan abjad A-Z)
        if (sortConfig.key === "time") {
          return sortConfig.direction === "asc" ? a.rawDate - b.rawDate : b.rawDate - a.rawDate;
        }

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
        <div className="rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: "var(--card-bg)", borderWidth: 1, borderColor: "var(--card-border)" }}>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead className="text-xs uppercase font-medium tracking-wider" style={{ backgroundColor: "var(--table-head-bg)", color: "var(--card-text-muted)", borderBottomWidth: 1, borderBottomColor: "var(--table-border)" }}>
                <tr>
                  <th className="px-6 py-4">Restaurant ID</th>
                  <th className="px-6 py-4 cursor-pointer hover:opacity-80" onClick={() => handleSort("time")}>
                    <div className="flex items-center gap-1">Time <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="px-6 py-4">Restaurant Name</th>
                  <th className="px-6 py-4">Sensor Name</th>
                  <th className="px-6 py-4 cursor-pointer hover:opacity-80" onClick={() => handleSort("level")}>
                    <div className="flex items-center gap-1">Alert Level <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="px-6 py-4">System Action</th>
                  <th className="px-6 py-4 cursor-pointer hover:opacity-80" onClick={() => handleSort("status")}>
                    <div className="flex items-center gap-1">Status <ArrowUpDown size={12} /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y" style={{ color: "var(--card-text)", borderColor: "var(--table-border)", backgroundColor: "var(--table-body-bg)" }}>
                {currentRows.map((item, i) => (
                  <tr key={i} className="hover:opacity-90">
                    <td className="px-6 py-4 font-mono text-xs font-bold" style={{ color: "var(--card-title)" }}>{item.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap" style={{ color: "var(--card-text-muted)" }}>{item.time}</td>
                    <td className="px-6 py-4 font-medium" style={{ color: "var(--card-title)" }}>{item.restaurant}</td>
                    <td className="px-6 py-4" style={{ color: "var(--card-text)" }}>{item.sensor}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.level === "DANGER" ? "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400" : "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400"}`}>{item.level}</span>
                    </td>
                    <td className="px-6 py-4 text-xs" style={{ color: "var(--card-text-muted)" }}>{item.action}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === "RESOLVED" ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400" : "bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-400"}`}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4" style={{ backgroundColor: "var(--card-surface)", borderTopWidth: 1, borderTopColor: "var(--card-surface-border)" }}>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="border rounded px-2 py-1 text-sm" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}>
              <option value={10}>10</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1 border rounded disabled:opacity-50 cursor-pointer" style={{ borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}><ChevronLeft size={16}/></button>
              <button disabled={indexOfLastRow >= tableData.length} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1 border rounded disabled:opacity-50 cursor-pointer" style={{ borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}><ChevronRight size={16}/></button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}