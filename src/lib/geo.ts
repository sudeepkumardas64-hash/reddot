import { Geolocation } from "@capacitor/geolocation";

export async function currentPosition(): Promise<{ lat: number; lng: number }> {
  const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}
