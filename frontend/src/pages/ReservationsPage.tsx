import { FormEvent, useMemo, useState } from "react";
import useSWR from "swr";
import { apiGetWithPagination, apiSend, apiSendForm } from "../lib/api";
import type { Item, Reservation } from "../lib/types";

type ReservationRow = {
  item_id: string;
  quantity: string;
  purpose: string;
  deadline: string;
  note: string;
};

const blankRow = (): ReservationRow => ({
  item_id: "",
  quantity: "",
  purpose: "",
  deadline: "",
  note: ""
});

export function ReservationsPage() {
  const [bulkRows, setBulkRows] = useState<ReservationRow[]>([
    blankRow(),
    blankRow(),
    blankRow(),
    blankRow()
  ]);
  const [loading, setLoading] = useState(false);
  const [reservationCsvFile, setReservationCsvFile] = useState<File | null>(null);
  const { data, error, isLoading, mutate } = useSWR("/reservations", () =>
    apiGetWithPagination<Reservation[]>("/reservations?per_page=200")
  );
  const { data: itemsResp } = useSWR("/items-options-reservations", () =>
    apiGetWithPagination<Item[]>("/items?per_page=1000")
  );
  const items = useMemo(() => itemsResp?.data ?? [], [itemsResp]);

  function itemLabel(item: Item) {
    return `${item.item_number} (${item.manufacturer_name}) #${item.item_id}`;
  }

  function updateBulkRow(index: number, patch: Partial<ReservationRow>) {
    setBulkRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeBulkRow(index: number) {
    setBulkRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function createBulk() {
    const reservations = bulkRows
      .filter((row) => row.item_id && row.quantity)
      .map((row) => ({
        item_id: Number(row.item_id),
        quantity: Number(row.quantity),
        purpose: row.purpose.trim() || null,
        deadline: row.deadline.trim() || null,
        note: row.note.trim() || null
      }));
    if (!reservations.length) return;
    setLoading(true);
    try {
      await apiSend("/reservations/batch", {
        method: "POST",
        body: JSON.stringify({ reservations })
      });
      setBulkRows([blankRow(), blankRow(), blankRow(), blankRow()]);
      await mutate();
    } finally {
      setLoading(false);
    }
  }



  async function importReservationCsv(event: FormEvent) {
    event.preventDefault();
    if (!reservationCsvFile) return;
    const formData = new FormData();
    formData.append("file", reservationCsvFile);
    setLoading(true);
    try {
      await apiSendForm("/reservations/import-csv", formData);
      setReservationCsvFile(null);
      await mutate();
    } finally {
      setLoading(false);
    }
  }

  async function release(id: number, maxQuantity: number) {
    const quantityText = window.prompt(
      `Release quantity (1-${maxQuantity}, leave blank for full release):`,
      ""
    );
    if (quantityText === null) return;
    const quantity = quantityText.trim() === "" ? null : Number(quantityText);
    if (quantity !== null && (!Number.isInteger(quantity) || quantity <= 0)) {
      window.alert("Quantity must be a positive integer.");
      return;
    }
    if (quantity !== null && quantity > maxQuantity) {
      window.alert(`Quantity cannot exceed remaining reservation quantity (${maxQuantity}).`);
      return;
    }
    setLoading(true);
    try {
      await apiSend(`/reservations/${id}/release`, {
        method: "POST",
        body: JSON.stringify(quantity === null ? {} : { quantity })
      });
      await mutate();
    } finally {
      setLoading(false);
    }
  }

  async function consume(id: number, maxQuantity: number) {
    const quantityText = window.prompt(
      `Consume quantity (1-${maxQuantity}, leave blank for full consume):`,
      ""
    );
    if (quantityText === null) return;
    const quantity = quantityText.trim() === "" ? null : Number(quantityText);
    if (quantity !== null && (!Number.isInteger(quantity) || quantity <= 0)) {
      window.alert("Quantity must be a positive integer.");
      return;
    }
    if (quantity !== null && quantity > maxQuantity) {
      window.alert(`Quantity cannot exceed remaining reservation quantity (${maxQuantity}).`);
      return;
    }
    setLoading(true);
    try {
      await apiSend(`/reservations/${id}/consume`, {
        method: "POST",
        body: JSON.stringify(quantity === null ? {} : { quantity })
      });
      await mutate();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl font-bold">Reservations</h1>
        <p className="mt-1 text-sm text-slate-600">
          Reserve stock for near-term execution and handle release or consume transitions.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Use <span className="font-semibold">Projects</span> for demand planning first, then reserve
          concrete quantities here once work is ready.
        </p>
      </section>



      <section className="panel grid gap-3 p-4">
        <h2 className="font-display text-lg font-semibold">CSV Import (Reservations)</h2>
        <p className="text-xs text-slate-500">
          Columns: item_id or assembly, quantity, assembly_quantity(optional), purpose, deadline, note, project_id(optional)
        </p>
        <form className="grid gap-2" onSubmit={importReservationCsv}>
          <input
            className="input"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setReservationCsvFile(e.target.files?.[0] ?? null)}
            required
          />
          <button className="button" disabled={loading || !reservationCsvFile} type="submit">
            Import CSV
          </button>
        </form>
      </section>

      <section className="panel space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Reservation Entry</h2>
            <button
              className="button-subtle"
              onClick={() => setBulkRows((prev) => [...prev, blankRow()])}
            >
              Add Row
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Single-item and multi-item reservations are both handled here.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">Item</th>
                  <th className="px-2 py-2">Qty</th>
                  <th className="px-2 py-2">Purpose</th>
                  <th className="px-2 py-2">Deadline</th>
                  <th className="px-2 py-2">Note</th>
                  <th className="px-2 py-2">-</th>
                </tr>
              </thead>
              <tbody>
                {bulkRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="px-2 py-2">
                      <select
                        className="input"
                        value={row.item_id}
                        onChange={(e) => updateBulkRow(idx, { item_id: e.target.value })}
                      >
                        <option value="">Select item</option>
                        {items.map((item) => (
                          <option key={item.item_id} value={item.item_id}>
                            {itemLabel(item)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="input"
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(e) => updateBulkRow(idx, { quantity: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="input"
                        value={row.purpose}
                        onChange={(e) => updateBulkRow(idx, { purpose: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="input"
                        type="date"
                        value={row.deadline}
                        onChange={(e) => updateBulkRow(idx, { deadline: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="input"
                        value={row.note}
                        onChange={(e) => updateBulkRow(idx, { note: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button className="button-subtle" onClick={() => removeBulkRow(idx)}>
                        Del
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="button" disabled={loading} onClick={createBulk}>
            Submit Batch
          </button>
      </section>

      <section className="panel p-4">
        <h2 className="mb-3 font-display text-lg font-semibold">Reservation List</h2>
        {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
        {error && <p className="text-sm text-red-600">{String(error)}</p>}
        {data?.data && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">ID</th>
                  <th className="px-2 py-2">Item</th>
                  <th className="px-2 py-2">Qty</th>
                  <th className="px-2 py-2">Purpose</th>
                  <th className="px-2 py-2">Deadline</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr key={row.reservation_id} className="border-b border-slate-100">
                    <td className="px-2 py-2">#{row.reservation_id}</td>
                    <td className="px-2 py-2">{row.item_number}</td>
                    <td className="px-2 py-2">{row.quantity}</td>
                    <td className="px-2 py-2">{row.purpose ?? "-"}</td>
                    <td className="px-2 py-2">{row.deadline ?? "-"}</td>
                    <td className="px-2 py-2">{row.status}</td>
                    <td className="px-2 py-2">
                      {row.status === "ACTIVE" ? (
                        <div className="flex gap-2">
                          <button
                            className="button-subtle"
                            onClick={() => release(row.reservation_id, row.quantity)}
                            disabled={loading}
                          >
                            Release...
                          </button>
                          <button
                            className="button-subtle"
                            onClick={() => consume(row.reservation_id, row.quantity)}
                            disabled={loading}
                          >
                            Consume...
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
