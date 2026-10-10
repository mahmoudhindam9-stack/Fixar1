import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SubFacility, Facility } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCode(prefix: string, number?: number): string {
  if (!number) return `${prefix}-0000`;
  return `${prefix}-${String(number).padStart(4, '0')}`;
}

export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function formatDate(date: string | Date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function flattenSubFacilities(sfs: SubFacility[], prefix = ''): { id: string, name: string }[] {
  let result: { id: string, name: string }[] = [];
  if (!sfs) return result;
  for (const sf of sfs) {
    const fullName = prefix ? `${prefix} > ${sf.name}` : sf.name;
    result.push({ id: sf.id, name: fullName });
    if (sf.children && sf.children.length > 0) {
      result.push(...flattenSubFacilities(sf.children, fullName));
    }
  }
  return result;
}

export function getSubFacilityName(facilities: Facility[], fId: string | undefined, sfId: string | undefined): string {
  if (!fId || !sfId) return '';
  const facility = facilities.find(f => f.id === fId);
  if (!facility) return '';
  const flattened = flattenSubFacilities(facility.subFacilities);
  return flattened.find(sf => sf.id === sfId)?.name || '';
}
