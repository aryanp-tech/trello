import CardListSelector from "./CardListSelector";
import CardActionsMenu from "./CardActionsMenu";

const CardModalHeader = ({
  currentColumn,
  onSelectColumn,
  onDeleteCard,
  onClose,
}) => {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 dark:border-[#2d323b] dark:bg-[#181b20] px-4 py-2.5 transition-colors">
      {/* Left: Column Selector Dropdown with manual write & presets */}
      <CardListSelector
        currentColumn={currentColumn}
        onSelectColumn={onSelectColumn}
      />

      {/* Right: Watch, 3-dots Menu & Close */}
      <CardActionsMenu onDeleteCard={onDeleteCard} onClose={onClose} />
    </header>
  );
};

export default CardModalHeader;
