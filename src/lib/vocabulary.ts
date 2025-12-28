export const VOCABULARY_DATA = {
  basic: [
    {
      id: "b1",
      word: "Diligent",
      definition: "Showing careful and persistent effort in your work",
    },
    {
      id: "b2",
      word: "Resilient",
      definition: "Able to recover quickly from difficulties",
    },
    {
      id: "b3",
      word: "Pragmatic",
      definition: "Dealing with things in a practical, realistic way",
    },
    {
      id: "b4",
      word: "Collaborate",
      definition: "To work together with others toward a common goal",
    },
    {
      id: "b5",
      word: "Innovative",
      definition: "Introducing new ideas or methods",
    },
    {
      id: "b6",
      word: "Catalyst",
      definition: "A person or thing that precipitates change",
    },
    {
      id: "b7",
      word: "Efficacy",
      definition: "The ability to produce the desired result",
    },
    {
      id: "b8",
      word: "Articulate",
      definition: "Able to express ideas clearly and effectively",
    },
  ],
  advanced: [
    {
      id: "a1",
      word: "Ephemeral",
      definition: "Lasting for a very short time; transitory",
    },
    {
      id: "a2",
      word: "Serendipity",
      definition: "The occurrence of events by chance in a happy way",
    },
    {
      id: "a3",
      word: "Paradigm",
      definition: "A typical example or pattern of something",
    },
    {
      id: "a4",
      word: "Ambidextrous",
      definition: "Able to use both hands with equal skill",
    },
    {
      id: "a5",
      word: "Perspicacious",
      definition: "Having keen insight and understanding",
    },
    {
      id: "a6",
      word: "Quintessential",
      definition: "Representing the most perfect example of something",
    },
    {
      id: "a7",
      word: "Obfuscate",
      definition: "To deliberately make something unclear or obscure",
    },
    {
      id: "a8",
      word: "Sagacious",
      definition: "Having or showing keen mental discernment and good judgment",
    },
  ],
};

export function getVocabularyByLevel(level: "basic" | "advanced") {
  return VOCABULARY_DATA[level];
}

export function getRandomVocabulary(level: "basic" | "advanced", count: number) {
  const items = VOCABULARY_DATA[level];
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, items.length));
}
