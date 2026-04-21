"use client";

import { useState, useEffect, useCallback } from "react";

export default function Home() {
  const [n1, setN1] = useState(0);
  const [n2, setN2] = useState(0);
  const [op, setOp] = useState("+");
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/calculator/history",
      );
      const data = await response.json();
      setHistory(data.sort((a: any, b: any) => b.id - a.id));
    } catch (error) {
      console.error("履歴の取得に失敗しました", error);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const calculate = async () => {
    const url = `http://localhost:8080/api/calculator/calculate?n1=${n1}&n2=${n2}&op=${encodeURIComponent(op)}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setResult(data);
      fetchHistory();
    } catch (error) {
      alert("通信エラーが発生しました。");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
            Smart <span className="text-blue-600">Calculator</span>
          </h1>
          <p className="text-slate-500">Java & PostgreSQL Powered Engine</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* メイン計算エリア */}
          <div className="md:col-span-12 lg:col-span-12">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100 transition-all hover:shadow-2xl">
              <div className="flex flex-wrap gap-4 items-center justify-center">
                <input
                  type="number"
                  className="bg-slate-50 border-none rounded-2xl p-4 w-32 text-2xl font-semibold text-slate-700 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  value={n1}
                  onChange={(e) => setN1(Number(e.target.value))}
                />

                <div className="relative">
                  <select
                    className="appearance-none bg-blue-600 text-white rounded-2xl p-4 px-8 text-2xl font-bold cursor-pointer hover:bg-blue-700 transition-colors outline-none shadow-lg shadow-blue-200"
                    value={op}
                    onChange={(e) => setOp(e.target.value)}
                  >
                    <option value="+">+</option>
                    <option value="-">−</option>
                    <option value="*">×</option>
                    <option value="/">÷</option>
                  </select>
                </div>

                <input
                  type="number"
                  className="bg-slate-50 border-none rounded-2xl p-4 w-32 text-2xl font-semibold text-slate-700 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  value={n2}
                  onChange={(e) => setN2(Number(e.target.value))}
                />

                <button
                  className="bg-slate-800 hover:bg-black text-white px-10 py-4 rounded-2xl font-bold text-xl transition-all active:scale-95 shadow-lg"
                  onClick={calculate}
                >
                  計算する
                </button>
              </div>

              {/* 計算結果表示 */}
              <div
                className={`mt-10 overflow-hidden transition-all duration-500 ${result ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
              >
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100 font-medium uppercase tracking-widest text-sm">
                      Result
                    </span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">
                      DB Saved
                    </span>
                  </div>
                  <div className="text-5xl font-mono font-bold mt-2 truncate">
                    {result?.result}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 履歴エリア */}
          <div className="md:col-span-12">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-slate-800">History</h2>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-md z-10">
                    <tr>
                      <th className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">
                        Formula
                      </th>
                      <th className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider text-right">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {history.length > 0 ? (
                      history.map((item) => (
                        <tr
                          key={item.id}
                          className="group hover:bg-blue-50/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="text-slate-400 text-xs font-mono">
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleTimeString(
                                    "ja-JP",
                                    {
                                      month: "2-digit",
                                      day: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )
                                : "--:--"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-700 font-medium text-lg">
                            {item.num1}{" "}
                            <span className="text-blue-500 font-bold mx-1">
                              {item.operator}
                            </span>{" "}
                            {item.num2}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-block bg-slate-100 group-hover:bg-blue-100 px-4 py-1 rounded-full text-slate-800 group-hover:text-blue-700 font-bold transition-all">
                              {item.result}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-12 text-center text-slate-300 italic"
                        >
                          No history data found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
