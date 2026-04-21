"use client"; // Reactの動的な機能を使うための宣言

import { useState } from "react";

export default function Home() {
  const [n1, setN1] = useState(0);
  const [n2, setN2] = useState(0);
  const [op, setOp] = useState("+");
  const [result, setResult] = useState<any>(null);

  // JavaのAPIを叩く関数
  const calculate = async () => {
    // Java側のURL（さっきブラウザで試したやつ）
    const url = `http://localhost:8080/api/calculator/calculate?n1=${n1}&n2=${n2}&op=${encodeURIComponent(op)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      setResult(data); // 計算結果を保存
    } catch (error) {
      alert("Javaくんが起動していないか、CORSエラーかも！");
    }
  };

  return (
    <div className="p-10 font-sans">
      <h1 className="text-2xl font-bold mb-5">Java連携・最強四則演算機</h1>

      <div className="flex gap-4 mb-5 items-center">
        <input
          type="number"
          className="border p-2 w-20 text-black"
          value={n1}
          onChange={(e) => setN1(Number(e.target.value))}
        />

        <select
          className="border p-2 text-black"
          value={op}
          onChange={(e) => setOp(e.target.value)}
        >
          <option value="+">+</option>
          <option value="-">-</option>
          <option value="*">×</option>
          <option value="/">÷</option>
        </select>

        <input
          type="number"
          className="border p-2 w-20 text-black"
          value={n2}
          onChange={(e) => setN2(Number(e.target.value))}
        />

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded shadow"
          onClick={calculate}
        >
          計算！
        </button>
      </div>

      {result && (
        <div className="mt-5 p-4 bg-gray-100 rounded text-black">
          <p className="text-xl font-bold">結果: {result.result}</p>
          <p className="text-sm text-gray-500 italic">
            ※このデータはDB（ポスグレ君）に保存されました！
          </p>
        </div>
      )}
    </div>
  );
}
