import CardListSelector from "./CardListSelector";
import CardActionsMenu from "./CardActionsMenu";

const CardModalHeader = ({
  currentColumn,
  columns = [],
  onSelectColumn,
  onDeleteCard,
  onClose,
}) => {
  return (
    <>
      <header className="flex items-center justify-between border-b border-[#2d323b] bg-[#181b20] px-4 py-2.5">
        {/* Left: Column Selector Dropdown with manual write & presets */}
        <CardListSelector
          currentColumn={currentColumn}
          columns={columns}
          onSelectColumn={onSelectColumn}
        />

        {/* Right: Watch, 3-dots Menu & Close */}
        <CardActionsMenu onDeleteCard={onDeleteCard} onClose={onClose} />
      </header>

      {/* Subtitle list banner */}
      <div className="flex items-center justify-between border-b border-[#2d323b] bg-[#141d2e] px-4 py-2 text-xs">
        <span className="font-medium text-[#97bbf5]">
          In list &ldquo;{currentColumn?.label}&rdquo;
        </span>
      </div>
    </>
  );
};

export default CardModalHeader;
