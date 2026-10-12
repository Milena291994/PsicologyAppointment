export function calculateAge(birthDateISO: string): number {
  if (!birthDateISO) return -1;

  const birthDate = new Date(birthDateISO);
  if (Number.isNaN(birthDate.getTime())) return -1;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

export function isMinor(birthDateISO: string): boolean {
  const age = calculateAge(birthDateISO);
  return age >= 0 && age < 18;
}
