export const TRUE = (pid: string) => `TRUE::${pid}`;
export const uid = () => Math.random().toString(36).slice(2, 9);
export function shuffle<T>(arr: T[], seed = Date.now()) {
  // Fisher–Yates with seed
  const a = arr.slice(),
    r = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
