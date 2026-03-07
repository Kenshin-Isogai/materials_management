import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouterProvider, createMemoryRouter } from "react-router-dom";

const apiGetMock = vi.fn(async (path: string) => {
  if (path === "/workspace/summary") {
    return {
      projects: [],
      pipeline: [],
    };
  }
  throw new Error(`Unexpected apiGet path: ${path}`);
});

const apiGetWithPaginationMock = vi.fn();
const apiSendMock = vi.fn();
const apiDownloadMock = vi.fn();

vi.mock("../src/lib/api", () => ({
  apiDownload: (...args: unknown[]) => apiDownloadMock(...args),
  apiGet: (...args: unknown[]) => apiGetMock(...args),
  apiGetWithPagination: (...args: unknown[]) => apiGetWithPaginationMock(...args),
  apiSend: (...args: unknown[]) => apiSendMock(...args),
}));

import { appRoutes } from "../src/App";

describe("app router", () => {
  beforeEach(() => {
    apiGetMock.mockClear();
    apiGetWithPaginationMock.mockClear();
    apiSendMock.mockClear();
    apiDownloadMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the workspace route through a data router without crashing", async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/workspace"],
    });

    render(<RouterProvider router={router} />);

    expect(screen.getByRole("heading", { name: "Workspace" })).toBeTruthy();

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/workspace/summary");
    });

    expect(screen.getByText("No projects available yet.")).toBeTruthy();
  });
});
