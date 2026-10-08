import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../context/useTheme";
import { useBoardWorkspace } from "../../hooks/useBoardWorkspace";
import BoardCanvas from "./BoardCanvas";
import BoardWorkspaceHeader from "./BoardWorkspaceHeader";
import CardFormModal from "../card/CardFormModal";
import CardDetailsModal from "../card/CardDetailsModal";
import AddColumnModal from "./AddColumnModal";
import AddMemberModal from "./AddMemberModal";
import NotificationToast from "../common/NotificationToast";
import boardWorkspaceBg from "../../assets/Board_workspace_BG.png";

const BoardWorkspace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const workspace = useBoardWorkspace();

  if (workspace.loading)
    return (
      <div className="min-h-screen bg-[#f5f7fb] p-8 text-slate-800 dark:bg-[#111214] dark:text-white">
        Loading board...
      </div>
    );
  if (!workspace.board)
    return (
      <div className="min-h-screen bg-[#f5f7fb] p-8 text-slate-800 dark:bg-[#111214] dark:text-white">
        Board not found
      </div>
    );

    // The main workspace for a specific board, handling board data, modals, and notifications
  const bgImage = workspace.board.backgroundImage || boardWorkspaceBg;

  return (
    <main
      className="h-screen flex flex-col overflow-hidden bg-cover bg-center bg-no-repeat px-4 pb-0 pt-4 text-slate-800 dark:text-white transition-colors"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
        {/* // Notification toast for displaying success or error messages related to board actions */}
      <NotificationToast
        notification={workspace.notification}
        onClose={() => workspace.setNotification(null)}
      />
      <div className="shrink-0 relative z-20">
        <BoardWorkspaceHeader
          board={workspace.board}
          user={user}
          onBack={() => navigate("/dashboard")}
          onProfile={() => navigate("/profile")}
          onMembers={() => workspace.setMemberModalOpen(true)}
          onRemoveMember={workspace.handleRemoveMember}
        />

        {workspace.error && (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-transparent dark:bg-red-950/70 dark:text-red-200">
            {workspace.error}
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 min-w-0">
        <BoardCanvas
          columns={workspace.columns}
          cards={workspace.cards}
          setCards={workspace.setCards}
          onReorderCards={workspace.handleReorderCards}
          onReorderColumns={workspace.handleReorderColumns}
          onCardOpen={workspace.openCard}
          onRename={workspace.handleRenameColumn}
          onDeleteColumn={workspace.handleDeleteColumn}
          onCreateCard={workspace.openCreate}
          onAddColumn={() => workspace.setColumnModalOpen(true)}
        />
      </div>

      {/* // Modals for creating/editing cards, adding columns, and adding members */}
      {workspace.modalOpen && (
        <CardFormModal
          title={workspace.title}
          description={workspace.description}
          list={workspace.list}
          columns={workspace.columns}
          saving={workspace.saving}
          onTitleChange={workspace.setTitle}
          onDescriptionChange={workspace.setDescription}
          onListChange={workspace.setList}
          onFileChange={workspace.setFile}
          onSubmit={workspace.handleCardSubmit}
          onClose={workspace.closeCardForm}
        />
      )}

      {/* //adding new column for the board workspace */}
      {workspace.columnModalOpen && (
        <AddColumnModal
          columnName={workspace.columnName}
          onColumnNameChange={workspace.setColumnName}
          onSubmit={workspace.handleAddColumn}
          onClose={() => workspace.setColumnModalOpen(false)}
        />
      )}

      {/* //adding new member to the board workspace */}
      {workspace.memberModalOpen && (
        <AddMemberModal
          email={workspace.memberEmail}
          onEmailChange={workspace.setMemberEmail}
          onSubmit={workspace.handleAddMember}
          onClose={() => workspace.setMemberModalOpen(false)}
        />
      )}
{/* 
      //user can view the details of the card and also edit or delete the card */}
      {/* Rich interactive card modal matching reference design */}
      {workspace.selectedCard && (
        <CardDetailsModal
          card={workspace.selectedCard}
          board={workspace.board}
          columns={workspace.columns}
          currentUser={user}
          onUpdateCard={workspace.handleUpdateCardDetails}
          onInviteMember={workspace.handleInviteMember}
          onUploadAttachment={workspace.handleUploadAttachment}
          onDeleteAttachment={workspace.handleDeleteAttachment}
          onAddComment={workspace.handleAddCommentWithFile}
          onUpdateComment={workspace.handleUpdateComment}
          onDeleteComment={workspace.handleDeleteComment}
          onDelete={() => workspace.handleDelete(workspace.selectedCard._id)}
          onClose={workspace.handleCloseCardModal}
        />
      )}
    </main>
  );
};

export default BoardWorkspace;
