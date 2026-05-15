const randomChar = () =>
  String.fromCharCode(65 + Math.floor(Math.random() * 26));
const randomDigit = () => Math.floor(Math.random() * 10);

export function generateCode(format: string): string {
  return format
    .split('')
    .map((char) => {
      if (char === 'X') return randomChar();
      if (char === '#') return randomDigit().toString();
      return char;
    })
    .join('');
}
