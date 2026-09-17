import { useNavigate } from "react-router-dom";

const fallbackColors = ["#c45aa9", "#1685c4", "#3d8f6e", "#8b63bd", "#c5844d"];

const LeftSidebar = ({ boards, loading }) => {
  const navigate = useNavigate();

  // Sidebar component that displays a list of boards and allows navigation to each board
  return (
    <aside className="w-full shrink-0 border-b border-[#292c31] bg-[#111214] px-5 py-6 lg:min-h-[calc(100vh-64px)] lg:w-72 lg:border-b-0 lg:border-r">
      <div>
        {/* // Sidebar header with logo and title */}
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-[#929298]">
          Your boards
        </p>
        <div className="space-y-1">
          {/* // Display each board in the sidebar */}
          {boards.map((board, index) => (
            <button
              key={board._id}
              type="button"
              onClick={() => navigate(`/boards/${board._id}`)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-[#c7c7cb] hover:bg-[#303237]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-[#ad4c9f] text-xs font-bold text-white">
                {board.title.charAt(0).toUpperCase()}
              </span>
              <span className="truncate">{board.title}</span>
              <span
                className="ml-auto h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    board.backgroundColor ||
                    fallbackColors[index % fallbackColors.length],
                }}
              />
            </button>
          ))}
          {!loading && boards.length === 0 && (
            <p className="px-3 text-sm text-[#858589]">No boards yet</p>
          )}
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;
