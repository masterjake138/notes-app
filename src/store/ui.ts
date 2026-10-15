import { create } from "zustand";

export type Filter =
  | { type: "all" }
  | { type: "pinned" }
  | { type: "trash" }
  | { type: "tag"; tagId: string };

export type SortKey = "updated" | "created" | "title";

export type ConfirmRequest = {
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
};

interface UIState {
  filter: Filter;
  selectedNoteId: string | null;
  search: string;
  sort: SortKey;
  sidebarOpen: boolean;
  tagMenuOpen: boolean;
  confirm: ConfirmRequest | null;

  setFilter: (filter: Filter) => void;
  selectNote: (id: string | null) => void;
  setSearch: (search: string) => void;
  setSort: (sort: SortKey) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTagMenuOpen: (open: boolean) => void;
  requestConfirm: (request: ConfirmRequest) => void;
  closeConfirm: () => void;
}

export const useUI = create<UIState>((set) => ({
  filter: { type: "all" },
  selectedNoteId: null,
  search: "",
  sort: "updated",
  sidebarOpen: false,
  tagMenuOpen: false,
  confirm: null,

  setFilter: (filter) => set({ filter, selectedNoteId: null, sidebarOpen: false }),
  selectNote: (id) => set({ selectedNoteId: id, sidebarOpen: false }),
  setSearch: (search) => set({ search }),
  setSort: (sort) => set({ sort }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTagMenuOpen: (tagMenuOpen) => set({ tagMenuOpen }),
  requestConfirm: (confirm) => set({ confirm }),
  closeConfirm: () => set({ confirm: null }),
}));
