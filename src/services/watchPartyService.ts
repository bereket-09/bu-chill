import { WatchPartyRoom, WatchPartyMessage, WatchPartyMember } from "@/types/watchParty";

const ROOMS_KEY_PREFIX = "buchill_wp_room_";
const PUBLIC_ROOMS_KEY = "buchill_wp_public_rooms";
const MESSAGES_KEY_PREFIX = "buchill_wp_msgs_";

/**
 * Generates an uppercase 6-character room code (e.g. 'ZQ3PZP')
 */
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O, 0, 1, I to avoid ambiguity
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Saves a newly created room
 */
export function createWatchPartyRoom(room: WatchPartyRoom): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${ROOMS_KEY_PREFIX}${room.code.toUpperCase()}`, JSON.stringify(room));

    if (room.is_public) {
      const publicList = getPublicRooms();
      const updated = [room, ...publicList.filter((r) => r.code !== room.code)].slice(0, 20);
      localStorage.setItem(PUBLIC_ROOMS_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Failed to store watch party room:", e);
  }
}

/**
 * Retrieves a room by its code
 */
export function getWatchPartyRoom(code: string): WatchPartyRoom | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${ROOMS_KEY_PREFIX}${code.toUpperCase()}`);
    if (raw) return JSON.parse(raw);

    // Also check public rooms list as fallback
    const publicRooms = getPublicRooms();
    const found = publicRooms.find((r) => r.code.toUpperCase() === code.toUpperCase());
    return found || null;
  } catch {
    return null;
  }
}

/**
 * Retrieves public watch party rooms
 */
export function getPublicRooms(): WatchPartyRoom[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PUBLIC_ROOMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Retrieves messages for a room
 */
export function getRoomMessages(code: string): WatchPartyMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${MESSAGES_KEY_PREFIX}${code.toUpperCase()}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Appends a message to a room's history
 */
export function addRoomMessage(code: string, message: WatchPartyMessage): void {
  if (typeof window === "undefined") return;
  try {
    const current = getRoomMessages(code);
    const updated = [...current, message].slice(-100); // keep last 100 messages
    localStorage.setItem(`${MESSAGES_KEY_PREFIX}${code.toUpperCase()}`, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to add room message:", e);
  }
}
