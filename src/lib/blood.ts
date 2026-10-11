import type { BloodType } from "./types";

/** Red-cell compatibility: which donor types can give to a patient of this type. */
const CAN_RECEIVE_FROM: Record<BloodType, BloodType[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

export function compatibleDonorTypes(patient: BloodType): BloodType[] {
  return CAN_RECEIVE_FROM[patient] ?? [];
}

export function canDonateTo(donor: BloodType, patient: BloodType): boolean {
  return compatibleDonorTypes(patient).includes(donor);
}

/** Minimum gap between whole-blood donations (India NBTC: 90 days; 120 for women). We use 90 as the floor. */
export const MIN_DAYS_BETWEEN_DONATIONS = 90;

export function daysUntilEligible(lastDonationDate: string, today = new Date()): number {
  if (!lastDonationDate) return 0;
  const last = new Date(lastDonationDate + "T00:00:00");
  if (isNaN(last.getTime())) return 0;
  const diff = Math.floor((today.getTime() - last.getTime()) / 86_400_000);
  return Math.max(0, MIN_DAYS_BETWEEN_DONATIONS - diff);
}

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

/** Round to 2 decimals (~1.1 km) so a donor's home is never exposed. */
export function fuzz(coord: number): number {
  return Math.round(coord * 100) / 100;
}

export function formatDistance(km: number): string {
  return km < 1 ? "< 1 km" : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function timeAgo(date?: Date): string {
  if (!date) return "just now";
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
