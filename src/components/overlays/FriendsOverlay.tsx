'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Search, X, Check, Timer, MessageSquare } from 'lucide-react';
import clsx from 'clsx';

export function FriendsOverlay() {
  const {
    overlay,
    closeOverlay,
    friends,
    attachedFriendIds,
    toggleAttachFriend,
    acceptFriendRequest,
    declineFriendRequest,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  if (overlay !== 'friends') return null;

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const focusingFriends = filteredFriends.filter((f) => f.status === 'focusing');
  const availableFriends = filteredFriends.filter((f) => f.status !== 'focusing');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-gutter bg-surface-dim/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Social Overlay / Modal Container matching friends_management_overlay_crimson */}
      <div
        className="w-full max-w-[480px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Search */}
        <div className="p-lg border-b border-outline-variant bg-surface-bright">
          <div className="flex justify-between items-center mb-lg">
            <h2 className="font-headline-md text-headline-md text-primary tracking-tight">Friends</h2>
            <button
              onClick={closeOverlay}
              className="text-secondary hover:text-primary transition-colors p-sm rounded-full hover:bg-surface-container"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-md top-1/2 -translate-y-1/2 text-secondary" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border-b border-outline-variant border-x-0 border-t-0 focus:border-primary focus:ring-0 pl-xl pr-md py-md font-body-md text-body-md text-primary placeholder-secondary bg-transparent transition-colors outline-none"
              placeholder="Search username..."
              type="text"
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto max-h-[540px] p-lg flex flex-col gap-xl">
          {/* Incoming Requests */}
          <section>
            <h3 className="font-label-md text-label-md text-secondary uppercase tracking-wider mb-md">
              Incoming Requests (1)
            </h3>
            <div className="flex items-center justify-between p-md rounded-lg border border-outline-variant bg-surface-container-low">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full border border-outline-variant bg-surface-container flex items-center justify-center text-lg">
                  👩🏻‍🎨
                </div>
                <div>
                  <p className="font-body-md text-body-md font-medium text-primary">ElenaR</p>
                  <p className="font-label-md text-label-md text-secondary">Mutuals: David, Sam</p>
                </div>
              </div>
              <div className="flex gap-sm">
                <button
                  onClick={() => declineFriendRequest('elena-req')}
                  aria-label="Decline"
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-outline-variant text-secondary hover:bg-surface transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => acceptFriendRequest('elena-req')}
                  aria-label="Accept"
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-on-primary hover:opacity-90 transition-opacity"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Active Now (Focusing) */}
          <section>
            <h3 className="font-label-md text-label-md text-secondary uppercase tracking-wider mb-md flex items-center gap-xs">
              <span className="w-2 h-2 rounded-full bg-primary block opacity-70"></span> Focusing Now
            </h3>
            <div className="flex flex-col gap-sm">
              {focusingFriends.map((friend) => {
                const isAttached = attachedFriendIds.includes(friend.id);
                return (
                  <div
                    key={friend.id}
                    className="group flex flex-col p-md rounded-lg border border-outline-variant hover:border-primary/30 transition-colors bg-surface-container-lowest"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-md">
                        <div className="relative">
                          <div
                            className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-base"
                            style={{ backgroundColor: friend.color + '25' }}
                          >
                            {friend.avatar}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-surface-container-lowest rounded-full flex items-center justify-center border border-outline-variant">
                            <Timer className="w-2.5 h-2.5 text-primary" />
                          </div>
                        </div>
                        <div>
                          <p className="font-body-md text-body-md font-medium text-primary">{friend.name}</p>
                          <p className="font-label-md text-label-md text-secondary">
                            {friend.currentTask || 'Deep Work'} • {friend.timerMinutes || 25}m left
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          toggleAttachFriend(friend.id);
                          closeOverlay();
                          setActiveTab('timer');
                        }}
                        className="font-label-md text-label-md px-3 py-1 border border-outline-variant rounded-lg text-primary hover:bg-surface-container-low transition-colors"
                      >
                        {isAttached ? 'On Canvas' : 'Join'}
                      </button>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1 bg-surface-container-high rounded-full mt-md overflow-hidden">
                      <div className="h-full bg-primary/70 rounded-full w-[65%]"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Online / Available */}
          <section>
            <h3 className="font-label-md text-label-md text-secondary uppercase tracking-wider mb-md">Available</h3>
            <div className="flex flex-col gap-sm">
              {availableFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="group flex items-center justify-between p-md rounded-lg border border-transparent hover:border-outline-variant transition-colors hover:bg-surface-container-low cursor-pointer"
                >
                  <div className="flex items-center gap-md">
                    <div className="relative">
                      <div
                        className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-base"
                        style={{ backgroundColor: friend.color + '20' }}
                      >
                        {friend.avatar}
                      </div>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-outline rounded-full border border-surface-container-lowest"></div>
                    </div>
                    <div>
                      <p className="font-body-md text-body-md font-medium text-primary">{friend.name}</p>
                      <p className="font-label-md text-label-md text-secondary">Online</p>
                    </div>
                  </div>
                  <div className="flex gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        toggleAttachFriend(friend.id);
                        closeOverlay();
                        setActiveTab('timer');
                      }}
                      className="p-1.5 rounded text-secondary hover:text-primary hover:bg-surface-container transition-colors"
                      title="Invite to Focus"
                    >
                      <Timer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-lg border-t border-outline-variant bg-surface-bright flex justify-between items-center gap-md">
          <button
            onClick={closeOverlay}
            className="flex-1 py-sm px-md rounded-lg border border-outline-variant text-primary font-label-md text-label-md hover:bg-surface-container-low transition-colors text-center"
          >
            Close
          </button>
          <button
            onClick={closeOverlay}
            className="flex-1 py-sm px-md rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity text-center"
          >
            Find Contacts
          </button>
        </div>
      </div>
    </div>
  );
}
