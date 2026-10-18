export type Player = { name: string; phone: string };
export const playerKey = "menuoir:player-session:v1";
export function validatePlayer(name: string, phone: string) {
  const cleanName = name.trim();
  const cleanPhone = phone.trim().replace(/[\s()-]/g, "");
  return {
    player: { name: cleanName, phone: cleanPhone },
    nameError:
      cleanName.length < 2 || cleanName.length > 60
        ? "Enter a first name between 2 and 60 characters."
        : "",
    phoneError: !/^\+?[1-9]\d{6,14}$/.test(cleanPhone)
      ? "Enter a valid phone number, including country code if outside India."
      : "",
  };
}
export function readPlayer(): Player | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(playerKey) || "null");
    if (typeof saved?.name !== "string" || typeof saved?.phone !== "string")
      return null;
    const result = validatePlayer(saved.name, saved.phone);
    return result.nameError || result.phoneError ? null : result.player;
  } catch {
    return null;
  }
}
