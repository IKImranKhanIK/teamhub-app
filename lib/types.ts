export type AvailabilityStatus = "available" | "meeting" | "ooo" | "focused";

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  funFact: string;
  emoji: string;
  status?: AvailabilityStatus;
}

export interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
}

export interface Kudos {
  id: string;
  fromName: string;
  toName: string;
  message: string;
  emoji: string;
  timestamp: number;
}
