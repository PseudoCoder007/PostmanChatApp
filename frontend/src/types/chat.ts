export type RoomType = 'direct' | 'group';
export type RoomVisibility = 'public_room' | 'private_room';

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
  canUseIgris: boolean;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  createdBy: string;
  createdAt: string;
  directPeer: Profile | null;
  visibility: RoomVisibility;
  member: boolean;
  currentUserRole: string | null;
  memberCount: number;
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

export interface RoomJoinRequest {
  roomId: string;
  profile: Profile;
  status: 'pending' | 'approved' | 'rejected';
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
  triggerType: 'SEND_DIRECT_MESSAGE' | 'SEND_GROUP_MESSAGE' | 'CREATE_GROUP_ROOM' | 'UPLOAD_IMAGE' | 'UPLOAD_DOCUMENT';
  triggerTarget: string | null;
  autoCompletes: boolean;
  source: string;
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
  type: 'MESSAGE_CREATED' | 'MESSAGE_UPDATED' | 'MESSAGE_DELETED' | 'TYPING';
  message: Message | null;
  typing?: TypingEvent | null;
}

export interface TypingEvent {
  roomId: string;
  userId: string;
  displayName: string;
  typing: boolean;
}

export interface IgrisChatResponse {
  reply: string;
}

export interface IgrisChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface IgrisHistoryItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface FeedbackRequest {
  category: 'bug' | 'feedback' | 'query';
  subject: string;
  message: string;
  contactEmail?: string;
}

export interface FeedbackResponse {
  sent: boolean;
  message: string;
}
