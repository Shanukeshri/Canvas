'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { Users, UserPlus, Plus, Check, ArrowLeft, Clock, CheckSquare, Sparkles, MessageSquare } from 'lucide-react';
import clsx from 'clsx';

export function ZenGroupsPage() {
  const {
    groups,
    activeGroupId,
    setActiveGroupId,
    addGroupTask,
    friends,
    attachedFriendIds,
    toggleAttachFriend,
    setOverlay,
  } = useApp();

  const { theme } = useTheme();

  const [topTab, setTopTab] = useState<'groups' | 'friends'>('groups');
  const [selectedGroup, setSelectedGroup] = useState<string | null>('group-1');
  const [newGroupTaskTitle, setNewGroupTaskTitle] = useState('');

  const currentGroup = groups.find((g) => g.id === selectedGroup);

  const handleAddGroupTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupTaskTitle.trim() || !selectedGroup) return;
    addGroupTask(selectedGroup, newGroupTaskTitle.trim());
    setNewGroupTaskTitle('');
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Top Header & Segmented Tab [ Groups ] [ Friends ] */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zen-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zen-text tracking-tight font-display">
            Shared Productivity
          </h1>
          <p className="text-sm text-zen-text-muted mt-1">
            Focus together quietly. Independent timers, shared presence & work.
          </p>
        </div>

        {/* Tab Control */}
        <div className="flex items-center gap-1.5 p-1 bg-zen-surface rounded-2xl border border-zen-border self-start">
          <button
            onClick={() => setTopTab('groups')}
            className={clsx(
              'px-5 py-2 rounded-xl text-xs font-semibold transition-all',
              topTab === 'groups'
                ? 'bg-zen-accent text-white shadow-md shadow-zen-accent-glow'
                : 'text-zen-text-muted hover:text-zen-text hover:bg-zen-surface-hover'
            )}
          >
            Focus Groups
          </button>
          <button
            onClick={() => setTopTab('friends')}
            className={clsx(
              'px-5 py-2 rounded-xl text-xs font-semibold transition-all',
              topTab === 'friends'
                ? 'bg-zen-accent text-white shadow-md shadow-zen-accent-glow'
                : 'text-zen-text-muted hover:text-zen-text hover:bg-zen-surface-hover'
            )}
          >
            Friends & Requests
          </button>
        </div>
      </div>

      {topTab === 'friends' ? (
        /* Friends Sub-View inside Groups Page */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {friends.map((friend) => {
            const isAttached = attachedFriendIds.includes(friend.id);
            return (
              <div
                key={friend.id}
                className="p-5 rounded-3xl bg-zen-card border border-zen-border flex items-center justify-between gap-4 hover:border-zen-accent/40 transition-all shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md"
                    style={{ backgroundColor: friend.color + '25', border: `1px solid ${friend.color}` }}
                  >
                    {friend.avatar}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-zen-text">{friend.name}</span>
                    <span className="text-xs text-zen-text-muted">{friend.handle}</span>
                    <span className="text-[11px] text-zen-accent font-medium mt-1">
                      {friend.currentTask || 'Focusing'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleAttachFriend(friend.id)}
                  className={clsx(
                    'px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5',
                    isAttached
                      ? 'bg-zen-accent text-white border-zen-accent shadow-md shadow-zen-accent-glow'
                      : 'bg-zen-surface border-zen-border text-zen-text hover:border-zen-accent'
                  )}
                >
                  {isAttached ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {isAttached ? 'On Canvas' : 'Invite'}
                </button>
              </div>
            );
          })}
        </div>
      ) : selectedGroup && currentGroup ? (
        /* Detailed Group Workspace View */
        <div className="flex flex-col gap-8">
          {/* Back button & Group Title */}
          <div className="flex items-center justify-between p-6 rounded-3xl bg-zen-card border border-zen-border shadow-xl">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedGroup(null)}
                className="p-2 rounded-xl bg-zen-surface border border-zen-border text-zen-text-muted hover:text-zen-text transition-all"
                title="Back to all groups"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-zen-text">{currentGroup.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-zen-accent-subtle text-zen-accent border border-zen-accent/30">
                    {currentGroup.category}
                  </span>
                </div>
                <p className="text-xs text-zen-text-muted mt-1">{currentGroup.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zen-text-muted font-medium">
                {currentGroup.members.length} members ({currentGroup.activeCount} online now)
              </span>
            </div>
          </div>

          {/* Group Orbital Member Bubbles Canvas */}
          <div className="relative w-full h-[380px] rounded-3xl bg-zen-surface/60 border border-zen-border p-6 flex items-center justify-center overflow-hidden shadow-inner">
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <div
                className="w-96 h-96 rounded-full border-2 border-dashed"
                style={{ borderColor: theme.hex }}
              />
            </div>

            {/* Central YOU Bubble */}
            <div
              className="relative z-10 flex flex-col items-center justify-center w-36 h-36 rounded-full shadow-2xl border-4 transition-transform hover:scale-105 cursor-pointer"
              style={{
                backgroundColor: 'var(--zen-card)',
                borderColor: theme.hex,
                boxShadow: `0 0 30px ${theme.hex}40`,
              }}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-zen-accent">YOU</span>
              <span className="text-2xl font-mono font-extrabold text-zen-text">23:41</span>
              <span className="text-[10px] text-zen-text-muted mt-1">Focusing</span>
            </div>

            {/* Surrounding Independent Member Bubbles */}
            {currentGroup.members
              .filter((m) => !m.isUser)
              .map((member, idx) => {
                const positions = [
                  { top: '15%', left: '20%' },
                  { top: '20%', right: '20%' },
                  { bottom: '15%', left: '25%' },
                  { bottom: '15%', right: '25%' },
                ];
                const pos = positions[idx % positions.length];

                return (
                  <div
                    key={member.id}
                    className="absolute flex items-center gap-3 p-2.5 rounded-2xl bg-zen-card border shadow-xl backdrop-blur-md transition-all hover:scale-105"
                    style={{ ...pos, borderColor: member.color + '80' }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-white font-bold"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.avatar}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zen-text">{member.name}</span>
                      <span className="text-[11px] font-mono text-zen-accent">{member.timerTime}</span>
                      <span className="text-[10px] text-zen-text-muted truncate max-w-[120px]">
                        {member.currentTask}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Group Workspace Tasks */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zen-text flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-zen-accent" />
                Group Tasks & Board
              </h3>
            </div>

            {/* Quick Add Group Task */}
            <form onSubmit={handleAddGroupTaskSubmit} className="flex gap-2">
              <input
                type="text"
                value={newGroupTaskTitle}
                onChange={(e) => setNewGroupTaskTitle(e.target.value)}
                placeholder="Add a new group task..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-zen-card border border-zen-border text-xs text-zen-text focus:outline-none focus:border-zen-accent"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-zen-accent text-white text-xs font-semibold shadow-md shadow-zen-accent-glow hover:bg-zen-accent-hover transition-all"
              >
                Add Group Task
              </button>
            </form>

            <div className="flex flex-col gap-2.5">
              {currentGroup.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-zen-card border border-zen-border hover:border-zen-accent/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <button
                      className={clsx(
                        'w-5 h-5 rounded-md border flex items-center justify-center',
                        task.completed ? 'bg-zen-accent border-zen-accent text-white' : 'border-zen-border'
                      )}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <span className={clsx('text-xs font-semibold text-zen-text', task.completed && 'line-through opacity-60')}>
                      {task.title}
                    </span>
                  </div>

                  <span className="text-xs text-zen-text-muted px-3 py-1 rounded-xl bg-zen-surface border border-zen-border">
                    Assigned: {task.assignedTo || 'Unassigned'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Groups List Grid View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className="p-6 rounded-3xl bg-zen-card border border-zen-border hover:border-zen-accent transition-all cursor-pointer shadow-lg flex flex-col justify-between gap-6 group hover:-translate-y-1"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-zen-accent-subtle text-zen-accent border border-zen-accent/30">
                    {group.category}
                  </span>
                  <span className="text-xs font-medium text-zen-text-muted">
                    {group.activeCount} active
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zen-text group-hover:text-zen-accent transition-colors">
                  {group.name}
                </h3>
                <p className="text-xs text-zen-text-muted leading-relaxed line-clamp-2">
                  {group.description}
                </p>
              </div>

              {/* Members Avatars Row */}
              <div className="flex items-center justify-between pt-4 border-t border-zen-border">
                <div className="flex -space-x-2 overflow-hidden">
                  {group.members.map((m) => (
                    <div
                      key={m.id}
                      className="w-8 h-8 rounded-full border-2 border-zen-card flex items-center justify-center text-xs text-white font-bold"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.avatar}
                    </div>
                  ))}
                </div>
                <span className="text-xs font-semibold text-zen-accent group-hover:translate-x-1 transition-transform">
                  Enter Room →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
