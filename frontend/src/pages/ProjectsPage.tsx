import { FormEvent, useState } from "react";
import useSWR from "swr";
import { apiGetWithPagination, apiSend } from "../lib/api";
import type { Item } from "../lib/types";

type ProjectRow = {
  project_id: number;
  name: string;
  status: string;
  planned_start: string | null;
  requirement_count: number;
};

type AssemblyOption = {
  assembly_id: number;
  name: string;
};

type RequirementRow = {
  target_type: "ITEM" | "ASSEMBLY";
  target_id: string;
  quantity: string;
  requirement_type: "INITIAL" | "SPARE" | "REPLACEMENT";
  note: string;
};

const blankRequirement = (): RequirementRow => ({
  target_type: "ITEM",
  target_id: "",
  quantity: "1",
  requirement_type: "INITIAL",
  note: ""
});

export function ProjectsPage() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("PLANNING");
  const [plannedStart, setPlannedStart] = useState("");
  const [requirements, setRequirements] = useState<RequirementRow[]>([
    blankRequirement(),
    blankRequirement()
  ]);
  const [loading, setLoading] = useState(false);

  const { data, error, isLoading, mutate } = useSWR("/projects", () =>
    apiGetWithPagination<ProjectRow[]>("/projects?per_page=200")
  );
  const { data: itemsResp } = useSWR("/items-options-projects", () =>
    apiGetWithPagination<Item[]>("/items?per_page=1000")
  );
  const { data: assembliesResp } = useSWR("/assembly-options-projects", () =>
    apiGetWithPagination<AssemblyOption[]>("/assemblies?per_page=1000")
  );
  const items = itemsResp?.data ?? [];
  const assemblies = assembliesResp?.data ?? [];

  function itemLabel(item: Item) {
    return `${item.item_number} (${item.manufacturer_name}) #${item.item_id}`;
  }

  function updateRequirement(index: number, patch: Partial<RequirementRow>) {
    setRequirements((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRequirement(index: number) {
    setRequirements((prev) => prev.filter((_, i) => i !== index));
  }

  async function createProject(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const payloadRequirements = requirements
        .filter((row) => row.target_id && Number(row.quantity) > 0)
        .map((row) => {
          const base = {
            quantity: Number(row.quantity),
            requirement_type: row.requirement_type,
            note: row.note.trim() || null
          };
          if (row.target_type === "ITEM") {
            return { ...base, item_id: Number(row.target_id), assembly_id: null };
          }
          return { ...base, assembly_id: Number(row.target_id), item_id: null };
        });
      await apiSend("/projects", {
        method: "POST",
        body: JSON.stringify({
          name,
          status,
          planned_start: plannedStart || null,
          requirements: payloadRequirements
        })
      });
      setName("");
      setRequirements([blankRequirement(), blankRequirement()]);
      await mutate();
    } finally {
      setLoading(false);
    }
  }

  async function reserve(projectId: number) {
    setLoading(true);
    try {
      await apiSend(`/projects/${projectId}/reserve`, { method: "POST", body: JSON.stringify({}) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl font-bold">Projects</h1>
        <p className="mt-1 text-sm text-slate-600">
          Plan future demand and requirement structure before execution-time reservations.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Use <span className="font-semibold">Reservations</span> to allocate concrete quantities when work is ready to run.
        </p>
      </section>

      <section className="panel p-4">
        <h2 className="mb-3 font-display text-lg font-semibold">Create Project</h2>
        <form className="grid gap-3 md:grid-cols-3" onSubmit={createProject}>
          <input
            className="input"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>PLANNING</option>
            <option>CONFIRMED</option>
            <option>ACTIVE</option>
            <option>COMPLETED</option>
            <option>CANCELLED</option>
          </select>
          <input
            className="input"
            type="date"
            value={plannedStart}
            onChange={(e) => setPlannedStart(e.target.value)}
          />
          <div className="md:col-span-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Requirements</p>
              <button
                className="button-subtle"
                type="button"
                onClick={() => setRequirements((prev) => [...prev, blankRequirement()])}
              >
                Add Row
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-2 py-2">Target Type</th>
                    <th className="px-2 py-2">Target</th>
                    <th className="px-2 py-2">Qty</th>
                    <th className="px-2 py-2">Requirement Type</th>
                    <th className="px-2 py-2">Note</th>
                    <th className="px-2 py-2">-</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="px-2 py-2">
                        <select
                          className="input"
                          value={row.target_type}
                          onChange={(e) =>
                            updateRequirement(idx, {
                              target_type: e.target.value as RequirementRow["target_type"],
                              target_id: ""
                            })
                          }
                        >
                          <option value="ITEM">ITEM</option>
                          <option value="ASSEMBLY">ASSEMBLY</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        {row.target_type === "ITEM" ? (
                          <select
                            className="input"
                            value={row.target_id}
                            onChange={(e) => updateRequirement(idx, { target_id: e.target.value })}
                          >
                            <option value="">Select item</option>
                            {items.map((item) => (
                              <option key={item.item_id} value={item.item_id}>
                                {itemLabel(item)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            className="input"
                            value={row.target_id}
                            onChange={(e) => updateRequirement(idx, { target_id: e.target.value })}
                          >
                            <option value="">Select assembly</option>
                            {assemblies.map((assembly) => (
                              <option key={assembly.assembly_id} value={assembly.assembly_id}>
                                {assembly.name} #{assembly.assembly_id}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          className="input"
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) => updateRequirement(idx, { quantity: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          className="input"
                          value={row.requirement_type}
                          onChange={(e) =>
                            updateRequirement(
                              idx,
                              { requirement_type: e.target.value as RequirementRow["requirement_type"] }
                            )
                          }
                        >
                          <option value="INITIAL">INITIAL</option>
                          <option value="SPARE">SPARE</option>
                          <option value="REPLACEMENT">REPLACEMENT</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          className="input"
                          value={row.note}
                          onChange={(e) => updateRequirement(idx, { note: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button className="button-subtle" type="button" onClick={() => removeRequirement(idx)}>
                          Del
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <button className="button md:col-span-3" disabled={loading} type="submit">
            Create Project
          </button>
        </form>
      </section>

      <section className="panel p-4">
        <h2 className="mb-3 font-display text-lg font-semibold">Project List</h2>
        {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
        {error && <p className="text-sm text-red-600">{String(error)}</p>}
        {data?.data && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">ID</th>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Planned Start</th>
                  <th className="px-2 py-2">Requirements</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr key={row.project_id} className="border-b border-slate-100">
                    <td className="px-2 py-2">#{row.project_id}</td>
                    <td className="px-2 py-2 font-semibold">{row.name}</td>
                    <td className="px-2 py-2">{row.status}</td>
                    <td className="px-2 py-2">{row.planned_start ?? "-"}</td>
                    <td className="px-2 py-2">{row.requirement_count}</td>
                    <td className="px-2 py-2">
                      <button className="button-subtle" onClick={() => reserve(row.project_id)}>
                        Reserve
                      </button>
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
