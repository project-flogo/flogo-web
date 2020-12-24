export function generateRandomString() {
  return Math.random()
    .toString(36)
    .slice(2);
}
