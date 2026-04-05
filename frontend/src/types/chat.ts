export type RoomType = 'direct' | 'group';

export interface Profile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
  lastActiveAt: string;
  active: boolean;
  friendshipState: 'none' | 'incoming' | 'outgoing' | 'accepted' | 'self' | null;
  xp: number;
  coins: number;
  level: number;
  title: string;
  profilePhotoUnlocked: boolean;
  canChallengeFriends: boolean;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  createdBy: string;
  createdAt: string;
  directPeer: Profile | null;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderDisplayName: string;
  senderUsername: string;
  content: string;
  attachment: Attachment | null;
  createdAt: string;
  editedAt: string | null;
  replyTo: string | null;
}

export interface FriendRequest {
  profile: Profile;
  friendshipState: 'incoming' | 'outgoing' | 'accepted' | 'none';
  createdAt: string;
}

export interface Quest {
  id: string;
  code: string;
  title: string;
  description: string;
  rewardXp: number;
  rewardCoins: number;
  status: 'assigned' | 'completed';
  assignedAt: string;
  completedAt: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  profile: Profile;
}

export interface Attachment {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  publicUrl: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  relatedRoomId: string | null;
  relatedMessageId: string | null;
  read: boolean;
  createdAt: string;
}

export interface WsMessagePayload {
  type: 'MESSAGE_CREATED' | 'MESSAGE_UPDATED' | 'MESSAGE_DELETED';
  message: Message;
}
