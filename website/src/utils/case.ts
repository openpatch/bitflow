export function toKebab(string: string) {
  return string
    .split("")
    .map((letter, index) => {
      if (/[A-Z]/.test(letter)) {
        return ` ${letter.toLowerCase()}`;
      }
      return letter;
    })
    .join("")
    .trim()
    .replace(/[_\s]+/g, "-");
}

export function toCamel(string: string) {
  return toKebab(string)
    .split("-")
    .map((word, index) => {
      if (index === 0) return word;
      return word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
}

export function toTitle(string: string) {
  return toKebab(string)
    .split("-")
    .map((word) => {
      return word.slice(0, 1).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function toSentence(string: string) {
  const interim = toKebab(string).replace(/-/g, " ");
  return interim.slice(0, 1).toUpperCase() + interim.slice(1);
}
