import { useNavigate } from "react-router-dom";
import { useDashboardBoards } from "../hooks/useDashboardBoards";
import LeftSidebar from "./LeftSidebar";
import BoardCard from "./BoardCard";
import BoardFormModal from "./BoardFormModal";

const DashboardHome = ({ searchQuery = "" }) => {
  const navigate = useNavigate();
  const dashboard = useDashboardBoards();
  const normalizedQuery = (searchQuery || "").trim().toLowerCase();

  // Filter boards based on the search query, ignoring case and whitespace
  const filteredBoards = dashboard.boards.filter((board) =>
    board.title.toLowerCase().includes(normalizedQuery),
  );

  return (
    <div className="min-h-[calc(100vh-64px)] border-t border-slate-200 bg-[#f8fafc] text-slate-800 transition-colors dark:border-[#1d2024] dark:bg-[#111214] dark:text-[#dedee3] lg:flex">
      <LeftSidebar boards={dashboard.boards} loading={dashboard.loading} />

      <main className="min-w-0 flex-1 px-6 py-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={dashboard.openCreate}
              className="rounded-md bg-[#5798f5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4387e8]"
            >
              Create board
            </button>
          </div>

          {dashboard.error && (
            <p className="mb-5 rounded-md bg-[#4b292d] px-4 py-3 text-sm text-[#ffb9bf]">
              {dashboard.error}
            </p>
          )}
          {dashboard.loading ? (
            <p className="text-sm text-slate-500 dark:text-[#99999f]">Loading boards...</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredBoards.map((board) => (
                <BoardCard
                  key={board._id}
                  board={board}
                  menuOpen={dashboard.menuId === board._id}
                  onOpen={() => navigate(`/boards/${board._id}`)}
                  onMenuToggle={() =>
                    dashboard.setMenuId(
                      dashboard.menuId === board._id ? null : board._id,
                    )
                  }
                  onEdit={() => dashboard.openEdit(board)}
                  onDelete={() => dashboard.handleDelete(board._id)}
                />
              ))}
              {!filteredBoards.length && (
                <p className="col-span-full text-sm text-slate-500 dark:text-[#99999f]">
                  No boards match your search.
                </p>
              )}
              <button
                type="button"
                onClick={dashboard.openCreate}
                className="flex min-h-36 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white text-sm font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50 dark:border-transparent dark:bg-[#2b2b2d] dark:text-[#aaaab0] dark:hover:bg-[#333336]"
              >
                Create new board
              </button>
            </div>
          )}
        </div>
      </main>

      {dashboard.modalOpen && (
        <BoardFormModal
          editingBoard={dashboard.editingBoard}
          title={dashboard.title}
          saving={dashboard.saving}
          onTitleChange={dashboard.setTitle}
          onSubmit={dashboard.handleSave}
          onClose={dashboard.closeForm}
        />
      )}
    </div>
  );
};

export default DashboardHome;
