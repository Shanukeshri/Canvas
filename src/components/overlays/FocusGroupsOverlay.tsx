'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { Group } from '@/types';
import { GroupInviteModal } from '@/components/groups/GroupInviteModal';
import {
  Users,
  Plus,
  LogOut,
  UserPlus,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';

export function FocusGroupsOverlay() {
  const {
    overlay,
    closeOverlay,
    groups,
    activeGroupId,
    setActiveGroupId,
    setActiveTab,
    createGroup,
    leaveGroup,
  } = useApp();

  const { theme } = useTheme();

  // Create Group Form State
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Engineering');

  // Leave confirmation state { [groupId]: boolean }
  const [confirmLeaveId, setConfirmLeaveId] = useState<string | null>(null);

  // Invite Modal state
  const [inviteTargetGroup, setInviteTargetGroup] = useState<Group | null>(null);

  if (overlay !== 'groups') return null;

  const handleOpenCreateForm = () => {
    setIsCreatingGroup(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    createGroup({
      name: newGroupName.trim(),
      description: newGroupDesc.trim(),
      category: newGroupCategory,
    });

    setNewGroupName('');
    setNewGroupDesc('');
    setIsCreatingGroup(false);
    setActiveTab('groups');
    closeOverlay();
  };

  const handleSelectGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    setActiveTab('groups');
    closeOverlay();
  };

  const handleLeaveGroup = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    leaveGroup(groupId);
    setConfirmLeaveId(null);
  };

  return (
    <>
      <div
        onClick={closeOverlay}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-[740px] max-w-[94vw] max-h-[88vh] bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 overflow-y-auto animate-in zoom-in-95 duration-200 select-none"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--outline-variant) transparent',
          }}
        >
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-variant/30 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-md"
                  style={{ backgroundColor: theme.hex }}
                >
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold font-display text-primary tracking-tight">
                  Focus Groups
                </h2>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Collaborate with peers in shared focus rooms with interactive timers
              </p>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {!isCreatingGroup && (
                <button
                  onClick={handleOpenCreateForm}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-md hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Make Group</span>
                </button>
              )}

              <button
                onClick={closeOverlay}
                className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                title="Close overlay (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Inline Make Group Form */}
          {isCreatingGroup && (
            <div className="p-6 rounded-3xl bg-surface-container-low border border-primary/40 flex flex-col gap-4 animate-in zoom-in-95 duration-150 shadow-md">
              <div className="flex items-center justify-between border-b border-surface-variant/30 pb-3">
                <h3 className="text-base font-bold text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Create New Focus Group
                </h3>
                <button
                  onClick={() => setIsCreatingGroup(false)}
                  className="text-outline hover:text-on-surface text-xs p-1"
                >
                  ✕ Cancel
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                {/* Group Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Fullstack React Study, Algorithms Sprint..."
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Category & Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-on-surface-variant font-medium">Category</label>
                    <select
                      value={newGroupCategory}
                      onChange={(e) => setNewGroupCategory(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface cursor-pointer focus:outline-none focus:border-primary"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Learning">Learning</option>
                      <option value="Design">Design</option>
                      <option value="Research">Research</option>
                      <option value="Writing">Writing</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-on-surface-variant font-medium">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      placeholder="Short description of the room's goal..."
                      className="px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-2.5 pt-2 border-t border-surface-variant/30">
                  <button
                    type="button"
                    onClick={() => setIsCreatingGroup(false)}
                    className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-md hover:opacity-90 transition-all"
                  >
                    Create & Enter Room
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Groups List */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-outline">
                Your Groups ({groups.length})
              </span>
              <span className="text-[11px] text-outline/80">Click any group to enter room</span>
            </div>

            {groups.length === 0 ? (
              <div className="p-10 rounded-3xl bg-surface-container-low/50 border border-dashed border-outline-variant text-center flex flex-col items-center justify-center gap-3 text-outline">
                <Users className="w-10 h-10 opacity-40" />
                <p className="text-sm">You are not part of any focus group yet.</p>
                <button
                  onClick={handleOpenCreateForm}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-medium"
                >
                  + Create Your First Group
                </button>
              </div>
            ) : (
              groups.map((group) => {
                const isActive = activeGroupId === group.id;
                const isConfirmingLeave = confirmLeaveId === group.id;

                // Format member names in front with "..." at the end
                const memberNames = group.members.map((m) => m.name.split(' ')[0]);
                const memberNamesFormatted =
                  memberNames.length > 0
                    ? memberNames.slice(0, 3).join(', ') + (memberNames.length > 3 ? ', ...' : '...')
                    : 'Alex, Sarah, David...';

                return (
                  <div
                    key={group.id}
                    onClick={() => handleSelectGroup(group.id)}
                    className={clsx(
                      'group relative p-5 rounded-3xl border transition-all cursor-pointer shadow-sm flex flex-col gap-3.5',
                      isActive
                        ? 'bg-surface-container-high/90 border-primary shadow-md ring-1 ring-primary/40'
                        : 'bg-surface-container-low/70 border-outline-variant/60 hover:border-primary/60 hover:bg-surface-container-low'
                    )}
                  >
                    {/* Top Row: Group Name + Members in front + Leave Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base md:text-lg font-bold text-primary group-hover:underline underline-offset-4 transition-all">
                            {group.name}
                          </h3>

                          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium bg-surface-container/80 px-2.5 py-0.5 rounded-full border border-surface-variant/40">
                            <span className="text-primary font-semibold">Members:</span>
                            <span className="truncate max-w-[240px]">{memberNamesFormatted}</span>
                          </div>

                          {Boolean(group.pendingInvites?.length) && (
                            <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              <span>{group.pendingInvites?.length} pending invite{group.pendingInvites?.length === 1 ? '' : 's'}</span>
                            </div>
                          )}
                        </div>

                        {group.description && (
                          <p className="text-xs text-on-surface-variant line-clamp-1 mt-1">
                            {group.description}
                          </p>
                        )}
                      </div>

                      {/* Right action: Leave Option */}
                      <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {isConfirmingLeave ? (
                          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-error/10 border border-error/30 animate-in fade-in duration-150">
                            <span className="text-[11px] text-error font-medium px-2">Leave?</span>
                            <button
                              onClick={(e) => handleLeaveGroup(e, group.id)}
                              className="px-2.5 py-1 rounded-lg bg-error text-white text-[11px] font-semibold hover:opacity-90"
                            >
                              Yes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmLeaveId(null);
                              }}
                              className="px-2 py-1 rounded-lg text-outline hover:text-on-surface text-[11px]"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmLeaveId(group.id);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-outline/70 hover:text-error hover:bg-surface-container border border-transparent hover:border-error/20 transition-all text-xs font-medium"
                            title="Leave this group"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Leave</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: User Icon with Plus (Invite) + Category & Member Avatars */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-variant/30">
                      <div className="flex items-center gap-2">
                        {/* User like icon with plus to invite others */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInviteTargetGroup(group);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-semibold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                          title="Invite others to this group"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-primary" />
                          <span>Invite</span>
                        </button>

                        <span className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-surface-container border border-outline-variant text-on-surface-variant">
                          {group.category}
                        </span>
                      </div>

                      {/* Member Avatars & Enter CTA */}
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2 overflow-hidden">
                          {group.members.map((m) => (
                            <div
                              key={m.id}
                              className="w-7 h-7 rounded-full border-2 border-surface-container-lowest flex items-center justify-center text-xs text-white font-bold shadow-sm"
                              style={{ backgroundColor: m.color }}
                              title={m.name}
                            >
                              {m.avatar}
                            </div>
                          ))}
                        </div>

                        <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>Enter Room</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Group Invite Modal */}
      <GroupInviteModal
        group={inviteTargetGroup}
        isOpen={Boolean(inviteTargetGroup)}
        onClose={() => setInviteTargetGroup(null)}
      />
    </>
  );
}
