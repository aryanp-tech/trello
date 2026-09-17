const AddMemberModal = ({ email, onEmailChange, onSubmit, onClose }) => {
  return (

    // Modal for adding a new member to the board by sending an invitation email
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl border border-[#3a3c42] bg-[#202225] p-5 shadow-2xl"
      >
        <h2 className="mb-2 text-lg font-semibold">Invite member</h2>
        <p className="mb-4 text-sm text-white/60">
          Send a board invitation by email.
        </p>
        <input
          autoFocus
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="member@email.com"
          className="w-full rounded-md bg-[#303237] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          required
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm text-white/75 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold"
          >
            Send invite
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMemberModal;
