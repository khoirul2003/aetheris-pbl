"use client";

import { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { ClientAlertModel, AlertData } from "@/models/clientAlertModel"; 
import { ClientProfileModel } from "@/models/clientProfileModel"; 
import { Search, Calendar, ChevronLeft, ChevronRight, Info } from "lucide-react";

export default function AdminActivityLogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterActor, setFilterActor] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");
  
  // State untuk Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [rawAlerts, setRawAlerts] = useState<AlertData[]>([]);
  const [usersMap, setUsersMap] = useState<{ [uid: string]: string }>({});

  // 1. Ambil Peta Kamus Lookup User
  useEffect(() => {
    const unsubscribeUsers = ClientProfileModel.subscribeToAllUsers((mapping) => {
      setUsersMap(mapping);
    });
    return () => unsubscribeUsers();
  }, []);

  // 2. Ambil snapshot data alert platform utama secara real-time
  useEffect(() => {
    const unsubscribeAlerts = ClientAlertModel.subscribeToAlerts("ALL", (snapshotData: AlertData[]) => {
      setRawAlerts(snapshotData);
    });
    return () => unsubscribeAlerts();
  }, []); 

  // 3. Transformasi dan Pemetaan data aman dengan useMemo
  const logsData = useMemo(() => {
    let idx = 1;
    return rawAlerts.map((item) => {
      let timeStr = "-";
      if (item.createdAt) {
        const timestamp = typeof item.createdAt.toDate === "function" 
          ? item.createdAt.toDate() 
          : new Date(item.createdAt as unknown as string | number | Date);
        timeStr = timestamp.toISOString().replace('T', ' ').substring(0, 16);
      }
      
      const currentRestaurantName = usersMap[item.userId] || item.restaurantName || "Partner Sector";

      return {
        id: `LOG-0${idx++}`,
        time: timeStr,
        actor: item.level === "danger" ? "System" : "Admin",
        action: item.level === "danger" ? "Threshold Changed" : "Firmware Updated",
        target: currentRestaurantName,
        desc: item.message || "Automated trigger for hazardous gas sensor detection",
      };
    });
  }, [rawAlerts, usersMap]);

  // Logika Filter Data
  const filteredLogs = useMemo(() => {
    return logsData.filter((item) => {
      const matchesSearch = 
        item.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAction = filterAction === "ALL" || item.action === filterAction;
      const matchesActor = filterActor === "ALL" || item.actor === filterActor;
      const matchesDate = !filterDate || item.time.startsWith(filterDate);

      return matchesSearch && matchesAction && matchesActor && matchesDate;
    });
  }, [logsData, searchQuery, filterAction, filterActor, filterDate]);

  // Logika Pagination 
  const indexOfLastRow = currentPage * pageSize;
  const indexOfFirstRow = indexOfLastRow - pageSize;
  const currentRows = filteredLogs.slice(indexOfFirstRow, indexOfLastRow);

  const renderPaginationControls = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 text-sm" style={{ backgroundColor: "var(--card-surface)", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}>
      <div className="flex items-center gap-2">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="rounded-lg px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
          style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <span>entries per page</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs font-medium" style={{ color: "var(--card-text-muted)" }}>
          Showing {filteredLogs.length === 0 ? 0 : indexOfFirstRow + 1} - {Math.min(indexOfLastRow, filteredLogs.length)} of {filteredLogs.length} logs
        </span>
        <div className="flex gap-1">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="p-1.5 rounded-lg disabled:opacity-50 cursor-pointer transition-colors"
            style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            disabled={indexOfLastRow >= filteredLogs.length} 
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-1.5 rounded-lg disabled:opacity-50 cursor-pointer transition-colors"
            style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout
      title="System Activity Log"
      description="Record of all crucial automated system activities and administrative adjustment actions."
    >
      <div className="space-y-6">

          <div className="p-5 rounded-2xl shadow-sm mb-6" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: "var(--card-text-faint)" }} />
                  <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
                    className="pl-9 pr-4 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-44 transition-colors"
                    style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}
                  />
                </div>

                <select 
                  value={filterAction} 
                  onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }}
                  className="rounded-xl text-xs font-medium px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                  style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}
                >
                  <option value="ALL">All Action Types</option>
                  <option value="Sensor Registered">Sensor Registered</option>
                  <option value="User Deactivated">User Deactivated</option>
                  <option value="Threshold Changed">Threshold Changed</option>
                  <option value="Package Changed">Package Changed</option>
                  <option value="Firmware Updated">Firmware Updated</option>
                </select>

                <select 
                  value={filterActor} 
                  onChange={(e) => { setFilterActor(e.target.value); setCurrentPage(1); }}
                  className="rounded-xl text-xs font-medium px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                  style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}
                >
                  <option value="ALL">All Actors</option>
                  <option value="Admin">Admin / Main System</option>
                  <option value="System">Automated System</option>
                </select>
              </div>

              <div className="relative w-full lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: "var(--card-text-faint)" }} />
                <input 
                  type="text" 
                  placeholder="Search target or description..." 
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-9 pr-4 py-2 w-full rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner transition-all"
                  style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: "var(--card-bg)", borderWidth: 1, borderColor: "var(--card-border)" }}>
            <div className="p-4 flex items-center gap-2.5 text-xs font-medium" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", borderBottomWidth: 1, borderColor: "var(--card-surface-border)", color: "var(--card-title)" }}>
              <Info size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Audit log records are <strong>Read-Only</strong>. This data is stored permanently and cannot be edited or deleted to fulfill platform data security validity.</span>
            </div>

            {renderPaginationControls()}

            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead className="text-xs uppercase font-medium tracking-wider" style={{ backgroundColor: "var(--table-head-bg)", color: "var(--card-text-muted)", borderBottomWidth: 1, borderBottomColor: "var(--table-border)" }}>
                  <tr>
                    <th className="px-6 py-4">Log ID</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Actor</th>
                    <th className="px-6 py-4">Action / Operation</th>
                    <th className="px-6 py-4">Target Object</th>
                    <th className="px-6 py-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm" style={{ backgroundColor: "var(--table-body-bg)", color: "var(--card-text)", borderColor: "var(--table-border)" }}>
                  {currentRows.length > 0 ? (
                    currentRows.map((log, i) => (
                      <tr key={i} className="hover:opacity-90 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-bold" style={{ color: "var(--card-title)" }}>{log.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap" style={{ color: "var(--card-text-muted)" }}>{log.time}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            log.actor === "System" ? "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300" : "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400"
                          }`}>{log.actor}</span>
                        </td>
                        <td className="px-6 py-4 font-medium" style={{ color: "var(--card-title)" }}>{log.action}</td>
                        <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">{log.target}</td>
                        <td className="px-6 py-4 text-xs max-w-sm" style={{ color: "var(--card-text-muted)" }}>{log.desc}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-xs" style={{ color: "var(--card-text-muted)" }}>
                        No system activity records found matching the filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPaginationControls()}
          </div>
      </div>
    </AdminLayout>
  );
}