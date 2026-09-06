'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { Group, Friend } from '@/types';
import {
  UserPlus,
  Copy,
  Check,
  X,
  Users,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import clsx from 'clsx';

interface GroupInviteModalProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GroupInviteModal({ group, isOpen, onClose }: GroupInviteModalProps) {
  const { friends, inviteMemberToGroup } = useApp();
  const { theme } = useTheme();

  const [copiedLink, setCopiedLink] = useState(false);
  const [searchFriend, setSearchFriend] = useState('');
  const [customInviteInput, setCustomInviteInput] = useState('');
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen || !group) return null;

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?join=${group.id}`
      : `https://zenfocus.app/?join=${group.id}`;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
      showToast('Invite link copied to clipboard!');
    } catch {
      // Fallback
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleInviteFriend = (friend: Friend) => {
    inviteMemberToGroup(group.id, {
      id: friend.id,
      name: friend.name,
      handle: friend.handle,
      avatar: friend.avatar,
      color: friend.color,
    });
    setInvitedMap((prev) => ({ ...prev, [friend.id]: true }));
    showToast(`${friend.name} was added to ${group.name}!`);
  };

  const handleCustomInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const val = customInviteInput.trim();
    if (!val) return;

    const cleanName = val.replace(/^@/, '');
    const randomColors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#14b8a6'];
    const randomAvatars = ['🦊', '🐼', '🐨', '🦁', '🐯', '🦉', '🐱', '🚀'];
    const pickedColor = randomColors[Math.floor(Math.random() * randomColors.length)];
    const pickedAvatar = randomAvatars[Math.floor(Math.random() * randomAvatars.length)];

    inviteMemberToGroup(group.id, {
      id: `invited-${Date.now()}`,
      name: cleanName,
      handle: val.startsWith('@') ? val : `@${cleanName.toLowerCase()}`,
      avatar: pickedAvatar,
      color: pickedColor,
    });

    setCustomInviteInput('');
    showToast(`Invited ${val} to ${group.name}!`);
  };

  const existingMemberIds = new Set(group.members.map((m) => m.id));
  const existingMemberHandles = new Set(group.members.map((m) => m.handle.toLowerCase()));

  const filteredFriends = friends.filter((f) => {
    const q = searchFriend.toLowerCase().trim();
    if (!q) return true;
    return f.name.toLowerCase().includes(q) || f.handle.toLowerCase().includes(q);
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[520px] max-w-[94vw] max-h-[86vh] bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 md:p-7 shadow-2xl flex flex-col gap-5 overflow-hidden animate-in zoom-in-95 duration-200 select-none relative"
      >
        {/* Toast feedback */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-variant/30 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: theme.hex }}
            >
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-primary tracking-tight">
                Invite to {group.name}
              </h3>
              <p className="text-xs text-on-surface-variant">
                Invite friends and study partners directly into your focus room
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Link Section */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-primary uppercase tracking-wider">
            Shareable Invite Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface select-all font-mono focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm',
                copiedLink
                  ? 'bg-emerald-500 text-white'
                  : 'bg-primary text-on-primary hover:opacity-90'
              )}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Invite by Username / Handle */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-surface-variant/30">
          <label className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Invite by Username or Name
          </label>
          <form onSubmit={handleCustomInvite} className="flex gap-2">
            <input
              type="text"
              value={customInviteInput}
              onChange={(e) => setCustomInviteInput(e.target.value)}
              placeholder="e.g. @developer_sam or Alex"
              className="flex-1 px-3.5 py-2 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!customInviteInput.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container border border-outline-variant hover:border-primary text-on-surface disabled:opacity-40 text-xs font-semibold transition-all shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>
          </form>
        </div>

        {/* Invite Existing Friends */}
        <div className="flex flex-col gap-2 pt-2 border-t border-surface-variant/30 flex-1 min-h-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Invite Friends ({friends.length})
            </span>
          </div>

          {friends.length > 5 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFriend}
                onChange={(e) => setSearchFriend(e.target.value)}
                placeholder="Search friends..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
              />
            </div>
          )}

          <div
            className="flex flex-col gap-2 overflow-y-auto max-h-[190px] pr-1"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--outline-variant) transparent',
            }}
          >
            {friends.length === 0 ? (
              <div className="p-4 rounded-2xl bg-surface-container-low text-center text-xs text-outline">
                No friends added yet. Share the invite link above to invite teammates!
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="p-4 rounded-2xl bg-surface-container-low text-center text-xs text-outline">
                No friends matching &quot;{searchFriend}&quot;
              </div>
            ) : (
              filteredFriends.map((friend) => {
                const isAlreadyMember =
                  existingMemberIds.has(friend.id) ||
                  existingMemberHandles.has(friend.handle.toLowerCase());

                const isPendingInvite =
                  Boolean(invitedMap[friend.id]) ||
                  Boolean(
                    group.pendingInvites?.some(
                      (p) => p.id === friend.id || p.handle.toLowerCase() === friend.handle.toLowerCase()
                    )
                  );

                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-surface-variant/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0"
                        style={{ backgroundColor: friend.color }}
                      >
                        {friend.avatar}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-primary truncate">
                          {friend.name}
                        </span>
                        <span className="text-[10px] text-on-surface-variant truncate">
                          {friend.handle}
                        </span>
                      </div>
                    </div>

                    {isAlreadyMember ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                        <Check className="w-3.5 h-3.5" />
                        <span>Joined</span>
                      </span>
                    ) : isPendingInvite ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-xl">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Invited</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleInviteFriend(friend)}
                        className="flex items-center gap-1 px-3 py-1 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Invite</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-surface-variant/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-container border border-outline-variant text-on-surface text-xs font-semibold hover:border-primary transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
