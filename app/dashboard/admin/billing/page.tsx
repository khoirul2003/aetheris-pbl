"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/src/components/layout/AdminHeader";
import {
  ClientSubscriptionModel,
  UserSubscriptionLog,
} from "@/models/clientSubscriptionModel";
import {
  AlertTriangle,
  Calendar,
  CreditCard,
  RefreshCw,
} from "lucide-react";

export default function AdminBillingPage() {
  const [subscriptions, setSubscriptions] = useState<
    UserSubscriptionLog[]
  >([]);

  useEffect(() => {
    const unsubscribe =
      ClientSubscriptionModel.subscribeToAllUserSubscriptions(
        (data) => {
          setSubscriptions(data);
        }
      );

    return () => unsubscribe();
  }, []);

  const expiringSubscriptions = subscriptions.filter((sub) => {
    if (!sub.endDate) return false;

    const diffTime =
      sub.endDate.toDate().getTime() -
      new Date().getTime();

    const diffDays = Math.ceil(
      diffTime / (1000 * 60 * 60 * 24)
    );

    return diffDays > 0 && diffDays <= 7;
  });

  const getDaysLeft = (sub: UserSubscriptionLog) => {
    if (!sub.endDate) return -999;

    return Math.ceil(
      (sub.endDate.toDate().getTime() -
        new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  const getExpiryColor = (sub: UserSubscriptionLog) => {
    const daysLeft = getDaysLeft(sub);

    if (daysLeft < 0) {
      return "text-slate-400";
    }

    if (daysLeft <= 7) {
      return "text-red-600";
    }

    return "text-slate-900";
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar role="admin" />

      <div className="flex flex-col flex-grow">
        <Navbar title="Langganan User" onToggleMobileMenu={() => {}} />

        <main className="ml-0 md:ml-64 pt-24 px-8 pb-8 space-y-6">
          {expiringSubscriptions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
              <div className="bg-amber-500 text-white p-2 rounded-xl h-fit">
                <AlertTriangle size={18} />
              </div>

              <div>
                <h3 className="font-bold text-amber-900">
                  Peringatan Masa Aktif Langganan
                </h3>

                <p className="text-sm text-amber-700 mt-1">
                  Ada{" "}
                  <span className="font-bold">
                    {expiringSubscriptions.length}
                  </span>{" "}
                  pelanggan yang masa langganannya akan
                  berakhir dalam 7 hari ke depan.
                </p>
              </div>
            </div>
          )}

          {/* STATISTIK BILLING */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase">
                Total Pelanggan
                </p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">
                {subscriptions.length}
                </h3>
            </div>

            <div className="bg-white border border-green-200 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-green-600 uppercase">
                Aktif
                </p>
                <h3 className="text-3xl font-black text-green-700 mt-2">
                {
                    subscriptions.filter(
                    (sub) => getDaysLeft(sub) > 7
                    ).length
                }
                </h3>
            </div>

            <div className="bg-white border border-orange-200 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-orange-600 uppercase">
                Hampir Habis
                </p>
                <h3 className="text-3xl font-black text-orange-700 mt-2">
                {
                    subscriptions.filter(
                    (sub) =>
                        getDaysLeft(sub) >= 0 &&
                        getDaysLeft(sub) <= 7
                    ).length
                }
                </h3>
            </div>

            <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-red-600 uppercase">
                Kadaluarsa
                </p>
                <h3 className="text-3xl font-black text-red-700 mt-2">
                {
                    subscriptions.filter(
                    (sub) => getDaysLeft(sub) < 0
                    ).length
                }
                </h3>
            </div>
            </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <CreditCard size={18} />
                Data Langganan User
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Monitoring status pembayaran dan masa aktif
                seluruh pelanggan.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      Restoran
                    </th>

                    <th className="px-6 py-4 text-left">
                      Paket
                    </th>

                    <th className="px-6 py-4 text-left">
                      Berlaku Sampai
                    </th>

                    <th className="px-6 py-4 text-left">
                      Pembayaran
                    </th>

                    <th className="px-6 py-4 text-left">
                      Status
                    </th>

                    <th className="px-6 py-4 text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                  {subscriptions.map((sub) => {
                    const daysLeft = getDaysLeft(sub);

                    const expiryDate = sub.endDate
                      ?.toDate()
                      .toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });

                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {sub.restaurantName}
                        </td>

                        <td className="px-6 py-4">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold">
                            {sub.packageName}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div
                            className={`flex items-center gap-2 font-medium ${getExpiryColor(
                              sub
                            )}`}
                          >
                            <Calendar size={14} />
                            {expiryDate}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {sub.paymentStatus === "paid" ? (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">
                              Lunas
                            </span>
                          ) : sub.paymentStatus ===
                            "pending" ? (
                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-xs font-bold">
                              Pending
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-xs font-bold">
                              -
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {daysLeft < 0 ? (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-bold">
                              Kadaluarsa
                            </span>
                          ) : daysLeft <= 7 ? (
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs font-bold">
                              Hampir Habis
                            </span>
                          ) : (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">
                              Aktif
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <RefreshCw size={12} />
                            Perpanjang
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {subscriptions.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-12 text-slate-400"
                      >
                        Belum ada data langganan user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}