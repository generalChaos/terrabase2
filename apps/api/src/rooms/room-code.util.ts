const ALPHABET = 'ABCDEFGHJKMNPQRSTUWXYZ'; // no I/L/O/V
export function genRoomCode(len = 4) {
  let s = '';
  for (let i = 0; i < len; i++)
    s += ALPHABET[(Math.random() * ALPHABET.length) | 0];
  return s;
}
