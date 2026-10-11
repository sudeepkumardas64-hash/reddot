import type { Timestamp } from "firebase/firestore";

export const BLOOD_TYPES = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

/** Private profile — only the owner can read it. */
export interface UserProfile {
  name: string;
  phone: string;
  bloodType: BloodType;
  city: string;
  lat: number;
  lng: number;
  available: boolean;
  lastDonationDate: string; // YYYY-MM-DD or ""
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/** Public donor card — what other signed-in users see. Location is rounded to ~1 km. */
export interface DonorCard {
  displayName: string; // first name only
  bloodType: BloodType;
  city: string;
  approxLat: number;
  approxLng: number;
  available: boolean;
  lastDonationDate: string;
  updatedAt?: Timestamp;
}

export interface BloodRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  patientLabel: string;
  bloodType: BloodType;
  units: number;
  hospitalName: string;
  hospitalAddress: string;
  city: string;
  lat: number;
  lng: number;
  urgency: "critical" | "standard";
  status: "active" | "fulfilled" | "cancelled";
  notes: string;
  createdAt?: Timestamp;
}

export interface Thread {
  id: string;
  participants: string[];
  names: Record<string, string>;
  requestId: string;
  lastMessage: string;
  updatedAt?: Timestamp;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt?: Timestamp;
}
