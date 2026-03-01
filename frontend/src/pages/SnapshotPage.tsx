import { useState } from "react";
import { apiGet } from "../lib/api";

type SnapshotRow = {
  item_id: number;
  item_number: string;
  location: string;
  quantity: number;
  category: string | null;
};

type SnapshotResponse = {
  date: string;
  mode: "past" | "future";
  rows: SnapshotRow[];
};

export function SnapshotPage() {
  const [date, setDate] = useState("");
  const [mode, setMode] = useState<"past" | "future">("future");
  const [data, setData] = useState<SnapshotResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    params.set("mode", mode);
    setLoading(true);
    try {
      const result = await apiGet<SnapshotResponse>(`/inventory/snapshot?${params.toString()}`);
      setData(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl font-bold">Snapshot</h1>
        <p className="mt-1 text-sm text-slate-600">
          Reconstruct past inventory or project future inventory at a target date.
        </p>
      </section>

      <section className="panel p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value as "past" | "future")}>
            <option value="past">past</option>
            <option value="future">future</option>
          </select>
          <button className="button md:col-span-2" disabled={loading} onClick={run}>
            Generate Snapshot
          </button>
        </div>
      </section>

      <section className="panel p-4">
        {!data && <p className="text-sm text-slate-500">No snapshot yet.</p>}
        {data && (
          <>
            <p className="mb-3 text-sm text-slate-600">
              Mode: <strong>{data.mode}</strong> / Date: <strong>{data.date}</strong> / Rows:{" "}
              <strong>{data.rows.length}</strong>
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-2 py-2">Item</th>
                    <th className="px-2 py-2">Location</th>
                    <th className="px-2 py-2">Quantity</th>
                    <th className="px-2 py-2">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={`${row.item_id}-${row.location}`} className="border-b border-slate-100">
                      <td className="px-2 py-2">{row.item_number}</td>
                      <td className="px-2 py-2">{row.location}</td>
                      <td className="px-2 py-2">{row.quantity}</td>
                      <td className="px-2 py-2">{row.category ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

