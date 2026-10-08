import React from "react";
import { getAvatarColor, getInitials } from "../card/cardUtils";

const CardBadges = React.memo(({ commentsCount = 0, attachmentsCount = 0, members = [] }) => {
  const hasBadges = commentsCount > 0 || attachmentsCount > 0;
  const hasMembers = members.length > 0;

  if (!hasBadges && !hasMembers) return null;

  return (
    <div className="flex items-center justify-between gap-2 pt-0.5">
      {/* Left: Badges */}
      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-[#9fadbc]">
        {/* Comments badge */}
        {commentsCount > 0 && (
          <span
            className="flex items-center gap-1.5 font-semibold text-xs text-slate-600 dark:text-[#9fadbc]"
            title={`${commentsCount} comments`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 shrink-0 text-slate-500 dark:text-[#9fadbc]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.25}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{commentsCount}</span>
          </span>
        )}

        {/* Attachments badge */}
        {attachmentsCount > 0 && (
          <span
            className="flex items-center gap-1.5 font-semibold text-xs text-slate-600 dark:text-[#9fadbc]"
            title={`${attachmentsCount} attachments`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 shrink-0 text-slate-500 dark:text-[#9fadbc]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.25}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            <span>{attachmentsCount}</span>
          </span>
        )}
      </div>

      {/* Right: Assigned Member Avatars */}
      {hasMembers && (
        <div className="flex items-center -space-x-1.5 ml-auto">
          {members.slice(0, 3).map((m) => {
            const name = m.username || m.email || "Member";
            const id = m._id || m;
            return (
              <span
                key={id}
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white uppercase ring-1.5 ring-white dark:ring-[#22272b] ${getAvatarColor(
                  name
                )}`}
                title={name}
              >
                {getInitials(name)}
              </span>
            );
          })}
          {members.length > 3 && (
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold bg-slate-600 text-white ring-1.5 ring-white dark:ring-[#22272b]"
              title={`${members.length - 3} more members`}
            >
              +{members.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

export default CardBadges;
