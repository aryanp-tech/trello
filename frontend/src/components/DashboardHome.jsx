import { useNavigate } from "react-router-dom";
import { useDashboardBoards } from "../hooks/useDashboardBoards";
import LeftSidebar from "./LeftSidebar";
import BoardCard from "./BoardCard";
import BoardFormModal from "./BoardFormModal";

const DashboardHome = () => {
  const navigate = useNavigate();
  const dashboard = useDashboardBoards();

  // displays all boards, user info, main dashboard page, and modals for creating/editing boards
  return (
    <div className="min-h-[calc(100vh-64px)] border-t border-[#1d2024] bg-[#111214] text-[#dedee3] lg:flex">
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
            <p className="text-sm text-[#99999f]">Loading boards...</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {dashboard.boards.map((board) => (
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
              <button
                type="button"
                onClick={dashboard.openCreate}
                className="flex min-h-36 items-center justify-center rounded-lg bg-[#2b2b2d] text-sm text-[#aaaab0] hover:bg-[#333336]"
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
