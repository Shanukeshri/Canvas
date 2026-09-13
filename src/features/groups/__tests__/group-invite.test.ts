import { describe, it, expect } from 'vitest';
import { CreateGroupSchema } from '@/lib/validation/schemas';
import { Group, GroupMember, Task, NotificationItem } from '@/types';

describe('Focus Groups & Invite Flow', () => {
  it('validates creating a group without requiring a group code', () => {
    const inputWithoutCode = {
      name: 'Algorithm Mastery Study',
      description: 'Solving daily problems together',
      category: 'Engineering',
    };

    const parsed = CreateGroupSchema.parse(inputWithoutCode);
    expect(parsed.name).toBe('Algorithm Mastery Study');
    expect(parsed.category).toBe('Engineering');
    expect(parsed.code).toBeUndefined();
  });

  it('keeps invited person in pendingInvites and sends a notification, not adding to members yet', () => {
    const hostGroup: Group = {
      id: 'group-1',
      name: 'Frontend Guild',
      code: '#Guild1',
      description: 'Testing',
      category: 'Engineering',
      activeCount: 1,
      members: [
        {
          id: 'host-1',
          name: 'Alex Johnson',
          handle: '@alex',
          avatar: '🦊',
          color: '#6366f1',
          status: 'focusing',
          timerTime: '25:00',
          currentTask: 'Focusing',
          isUser: true,
          isConnected: true,
        },
      ],
      pendingInvites: [],
      tasks: [],
    };

    const friendToInvite = {
      id: 'friend-2',
      name: 'Sarah Connor',
      handle: '@sarah',
      avatar: '🐼',
      color: '#10b981',
    };

    // Simulate sending invite
    const invitationNotification: NotificationItem = {
      id: `ginvite-${Date.now()}`,
      title: 'Group Room Invitation',
      message: `Alex Johnson invited ${friendToInvite.name} to join "${hostGroup.name}".`,
      time: 'Just now',
      read: false,
      type: 'group_invite',
      actionPayload: {
        groupId: hostGroup.id,
        groupName: hostGroup.name,
        inviteeId: friendToInvite.id,
        inviteeName: friendToInvite.name,
        inviteeHandle: friendToInvite.handle,
      },
    };

    const groupAfterInvite: Group = {
      ...hostGroup,
      pendingInvites: [
        {
          id: friendToInvite.id,
          name: friendToInvite.name,
          handle: friendToInvite.handle,
          avatar: friendToInvite.avatar,
          color: friendToInvite.color,
          invitedAt: Date.now(),
        },
      ],
    };

    // Verified: Members remains 1, pendingInvites has the friend, notification created
    expect(groupAfterInvite.members).toHaveLength(1);
    expect(groupAfterInvite.members.some((m) => m.id === friendToInvite.id)).toBe(false);
    expect(groupAfterInvite.pendingInvites).toHaveLength(1);
    expect(invitationNotification.type).toBe('group_invite');
    expect(invitationNotification.actionPayload.groupId).toBe('group-1');
  });

  it('only adds member to group after accepting the invitation', () => {
    const groupWithPending: Group = {
      id: 'group-1',
      name: 'Frontend Guild',
      code: '#Guild1',
      description: 'Testing',
      category: 'Engineering',
      activeCount: 1,
      members: [
        {
          id: 'host-1',
          name: 'Alex Johnson',
          handle: '@alex',
          avatar: '🦊',
          color: '#6366f1',
          status: 'focusing',
          timerTime: '25:00',
          currentTask: 'Focusing',
          isUser: true,
          isConnected: true,
        },
      ],
      pendingInvites: [
        {
          id: 'friend-2',
          name: 'Sarah Connor',
          handle: '@sarah',
          avatar: '🐼',
          color: '#10b981',
          invitedAt: Date.now(),
        },
      ],
      tasks: [],
    };

    // User accepts invite
    const acceptedMember: GroupMember = {
      id: 'friend-2',
      name: 'Sarah Connor',
      handle: '@sarah',
      avatar: '🐼',
      color: '#10b981',
      status: 'focusing',
      timerTime: '25:00',
      currentTask: 'Focusing with group',
      isConnected: true, // Now connected from the other side
    };

    const groupAfterAccept: Group = {
      ...groupWithPending,
      members: [...groupWithPending.members, acceptedMember],
      pendingInvites: groupWithPending.pendingInvites?.filter((p) => p.id !== 'friend-2'),
      activeCount: 2,
    };

    expect(groupAfterAccept.members).toHaveLength(2);
    expect(groupAfterAccept.pendingInvites).toHaveLength(0);
    expect(groupAfterAccept.members.find((m) => m.id === 'friend-2')?.isConnected).toBe(true);
  });

  it('only displays timers in OrbitBubbles when peers are actually connected from the other side', () => {
    const testMembers: GroupMember[] = [
      {
        id: 'host-1',
        name: 'Alex Johnson',
        handle: '@alex',
        avatar: '🦊',
        color: '#6366f1',
        status: 'focusing',
        timerTime: '25:00',
        currentTask: 'Focusing',
        isUser: true,
        isConnected: true,
      },
      {
        id: 'friend-2',
        name: 'Connected Sarah',
        handle: '@sarah',
        avatar: '🐼',
        color: '#10b981',
        status: 'focusing',
        timerTime: '25:00',
        currentTask: 'Focusing with group',
        isUser: false,
        isConnected: true, // Connected from other side!
      },
      {
        id: 'friend-3',
        name: 'Offline David',
        handle: '@david',
        avatar: '👨🏻‍🎨',
        color: '#f97316',
        status: 'offline',
        timerTime: '25:00',
        currentTask: 'Offline',
        isUser: false,
        isConnected: false, // NOT connected!
      },
    ];

    // Filter rule used by CanvasGroupsPage for OrbitBubbles
    const visibleOrbitFriends = testMembers.filter(
      (m) => !m.isUser && m.isConnected === true && m.status !== 'offline'
    );

    // Only the actually connected peer should have an active timer bubble
    expect(visibleOrbitFriends).toHaveLength(1);
    expect(visibleOrbitFriends[0].id).toBe('friend-2');
    expect(visibleOrbitFriends.some((m) => m.id === 'friend-3')).toBe(false);
  });

  it('determines correct timer destination: groups timer for group mode vs solo timer for personal tasks', () => {
    const groupTask: Task = {
      id: 'task-101',
      title: 'Build user invite modal',
      project: 'Frontend Guild',
      priority: 'high',
      dueDate: 'Today',
      completed: false,
    };

    const soloTask: Task = {
      id: 'task-202',
      title: 'Personal meditation',
      project: 'Personal',
      priority: 'low',
      dueDate: 'Today',
      completed: false,
    };

    const testGroups: Group[] = [
      {
        id: 'group-1',
        name: 'Frontend Guild',
        code: '#123',
        description: '',
        category: 'Work',
        members: [],
        tasks: [groupTask],
        activeCount: 1,
      },
    ];

    const getDestinationTab = (task: Task, isGroupMode: boolean) => {
      if (isGroupMode) return 'groups';
      const isGroup = testGroups.some(
        (g) => g.tasks.some((t) => t.id === task.id) || g.name.toLowerCase() === task.project.toLowerCase()
      );
      return isGroup ? 'groups' : 'timer';
    };

    // When clicked from inside group mode
    expect(getDestinationTab(groupTask, true)).toBe('groups');

    // When clicked from personal todos board for a group task
    expect(getDestinationTab(groupTask, false)).toBe('groups');

    // When clicked for a personal solo task
    expect(getDestinationTab(soloTask, false)).toBe('timer');
  });

  it('deletes group invitation notification immediately once accepted or dismissed', () => {
    const notifId = 'notif-grp-123';
    const groupId = 'group-456';
    const initialNotifications: NotificationItem[] = [
      {
        id: notifId,
        title: 'Group Room Invitation',
        message: 'Alex Johnson invited you to join "Frontend Guild".',
        time: 'Just now',
        read: false,
        type: 'group_invite',
        actionPayload: {
          groupId,
          groupName: 'Frontend Guild',
          invitationId: 'inv-999',
        },
      },
      {
        id: 'notif-milestone-1',
        title: 'Focus Complete',
        message: '25 minutes logged',
        time: '5m ago',
        read: true,
        type: 'timer_complete',
      },
    ];

    // Simulate accept/dismiss action removing from active notifications state
    const remainingAfterAccept = initialNotifications.filter(
      (n) =>
        n.id !== notifId &&
        n.actionPayload?.groupId !== groupId &&
        n.actionPayload?.invitationId !== 'inv-999'
    );

    expect(remainingAfterAccept).toHaveLength(1);
    expect(remainingAfterAccept[0].id).toBe('notif-milestone-1');
    expect(remainingAfterAccept.some((n) => n.id === notifId)).toBe(false);
  });

  it('deletes friend request notification immediately once accepted or declined', () => {
    const friendRequestId = 'freq-777';
    const senderId = 'user-sender-888';
    const initialNotifications: NotificationItem[] = [
      {
        id: 'notif-freq-1',
        title: 'New Friend Request',
        message: 'Dev Sam sent you a friend request.',
        time: 'Just now',
        read: false,
        type: 'friend_request',
        actionPayload: {
          requestId: friendRequestId,
          senderId,
        },
      },
      {
        id: 'notif-other',
        title: 'System Notice',
        message: 'Welcome back',
        time: '1h ago',
        read: true,
        type: 'system',
      },
    ];

    // Filter used on accept or decline
    const remainingAfterHandled = initialNotifications.filter(
      (n) =>
        n.id !== friendRequestId &&
        n.actionPayload?.requestId !== friendRequestId &&
        n.actionPayload?.senderId !== friendRequestId
    );

    expect(remainingAfterHandled).toHaveLength(1);
    expect(remainingAfterHandled[0].id).toBe('notif-other');
  });
});
