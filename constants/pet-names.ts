export type PetKind = "cat" | "dog";

const CAT_NAMES = [
  "Sir Pouncealot",
  "Chairman Meow",
  "Captain Whiskers",
  "Muffin Bandit",
  "Tiny Floof",
  "Noodle Paws",
  "Cheddar Biscuit",
  "Bean Burrito",
  "Pickle Puff",
  "Princess Zoomies",
  "Mr Wigglebeans",
  "Biscuit Ninja",
  "Tuna Sprinkles",
  "Moonlight Meow",
  "Snuggle Nugget",
  "Boop Commander",
  "Fluffy McSnax",
  "Purrito",
  "Jellybean Toebeans",
  "Sassy Sprout",
] as const;

const DOG_NAMES = [
  "Professor Woof",
  "Bark Twain",
  "Wiggles Von Fluff",
  "Nugget Rocket",
  "Sir Licksalot",
  "Peanut Wobble",
  "Captain Snoot",
  "Waffle Boots",
  "Biscuit Bandit",
  "Zoomie Bean",
  "Pogo Paws",
  "Sniffles McGee",
  "Cocoa Wiggle",
  "Duke Drools",
  "Mochi Bounce",
  "Toffee Tailspin",
  "Pickles Pup",
  "Marshmallow Ruff",
  "Teddy Tumbles",
  "Buddy Bubbles",
] as const;

const shuffle = <T,>(input: readonly T[]) => {
  const copy = [...input];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const inferPetKindFromLabel = (label: string): PetKind =>
  label.toLowerCase().includes("dog") ? "dog" : "cat";

export const getRandomPetNames = (kind: PetKind, count: number) => {
  const source = kind === "cat" ? CAT_NAMES : DOG_NAMES;
  const shuffled = shuffle(source);
  const names: string[] = [];
  for (let i = 0; i < count; i += 1) {
    names.push(shuffled[i % shuffled.length]);
  }
  return names;
};
