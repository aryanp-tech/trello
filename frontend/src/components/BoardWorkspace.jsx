import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useBoardWorkspace } from "../hooks/useBoardWorkspace";
import BoardCanvas from "./BoardCanvas";
import BoardWorkspaceHeader from "./BoardWorkspaceHeader";
import CardFormModal from "./CardFormModal";
import CardDetailsModal from "./CardDetailsModal";
import AddColumnModal from "./AddColumnModal";
import AddMemberModal from "./AddMemberModal";
import NotificationToast from "./NotificationToast";

const BoardWorkspace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const workspace = useBoardWorkspace();

  if (workspace.loading)
    return (
      <div className="min-h-screen bg-[#111214] p-8 text-white">
        Loading board...
      </div>
    );
  if (!workspace.board)
    return (
      <div className="min-h-screen bg-[#111214] p-8 text-white">
        Board not found
      </div>
    );

    // The main workspace for a specific board, handling board data, modals, and notifications
  return (
    <main
      className="min-h-screen bg-[#111214] bg-cover bg-center px-4 pb-0 pt-4 text-white"
      style={{
        backgroundImage: workspace.board.backgroundImage
          ? `linear-gradient(rgba(17,18,20,.78), rgba(17,18,20,.9)), url(${workspace.board.backgroundImage})`
          : undefined,
      }}
    >
        {/* // Notification toast for displaying success or error messages related to board actions */}
      <NotificationToast
        notification={workspace.notification}
        onClose={() => workspace.setNotification(null)}
      />
      <BoardWorkspaceHeader
        board={workspace.board}
        user={user}
        onBack={() => navigate("/dashboard")}
        onProfile={() => navigate("/profile")}
        onMembers={() => workspace.setMemberModalOpen(true)}
      />

      {workspace.error && (
        <p className="mb-4 rounded-md bg-red-950/70 px-4 py-3 text-sm">
          {workspace.error}
        </p>
      )}

      <BoardCanvas
        columns={workspace.columns}
        cards={workspace.cards}
        onCardOpen={workspace.openCard}
        onCardDragStart={workspace.setDraggedCard}
        onCardDragEnd={() => workspace.setDraggedCard(null)}
        onDrop={workspace.moveCard}
        onRename={workspace.handleRenameColumn}
        onDeleteColumn={workspace.handleDeleteColumn}
        onCreateCard={workspace.openCreate}
        onAddColumn={() => workspace.setColumnModalOpen(true)}
      />

      {/* // Modals for creating/editing cards, adding columns, and adding members */}
      {workspace.modalOpen && (
        <CardFormModal
          editingCard={workspace.editingCard}
          title={workspace.title}
          description={workspace.description}
          saving={workspace.saving}
          onTitleChange={workspace.setTitle}
          onDescriptionChange={workspace.setDescription}
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
      {workspace.selectedCard && (
        <CardDetailsModal
          card={workspace.selectedCard}
          onEdit={() => workspace.openEdit(workspace.selectedCard)}
          onDelete={workspace.handleDelete}
          onClose={() => workspace.setSelectedCard(null)}
        />
      )}
    </main>
  );
};

export default BoardWorkspace;
