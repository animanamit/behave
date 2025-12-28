"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MatchItem {
  id: string;
  word: string;
  definition: string;
}

interface MatchDefinitionProps {
  items: MatchItem[];
  onComplete?: (results: MatchResult[]) => void;
  title?: string;
  description?: string;
}

export interface MatchResult {
  itemId: string;
  correct: boolean;
  selectedDefinitionId: string;
}

export function MatchDefinition({
  items,
  onComplete,
  title = "Match Words to Definitions",
  description = "Click on a word and then select its matching definition",
}: MatchDefinitionProps) {
  const [selected, setSelected] = useState<{ word: string; definition: string } | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [shuffledDefinitions, setShuffledDefinitions] = useState<MatchItem[]>([]);

  // Shuffle definitions on mount
  useEffect(() => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setShuffledDefinitions(shuffled);
  }, [items]);

  const handleWordClick = (item: MatchItem) => {
    setSelected({
      word: item.word,
      definition: item.definition,
    });
  };

  const handleDefinitionClick = (definition: string, itemId: string) => {
    if (!selected) return;

    const isCorrect = selected.definition === definition;
    
    setMatches((prev) => ({
      ...prev,
      [selected.word]: itemId,
    }));

    setCompleted((prev) => ({
      ...prev,
      [selected.word]: isCorrect,
    }));

    setSelected(null);
  };

  const handleReset = () => {
    setMatches({});
    setCompleted({});
    setSelected(null);
  };

  const handleSubmit = () => {
    const results: MatchResult[] = items.map((item) => ({
      itemId: item.id,
      correct: completed[item.word] || false,
      selectedDefinitionId: matches[item.word] || "",
    }));

    onComplete?.(results);
  };

  const isAllMatched = items.every((item) => matches[item.word]);
  const correctCount = Object.values(completed).filter(Boolean).length;

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <Heading as="h3">{title}</Heading>
        <Text variant="muted">{description}</Text>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Words Column */}
        <div className="space-y-3">
          <Heading as="h4" className="text-base font-semibold">
            Words
          </Heading>
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleWordClick(item)}
                className={cn(
                  "w-full p-3 text-left rounded-lg border-2 transition-all",
                  selected?.word === item.word
                    ? "border-blue-500 bg-blue-50"
                    : matches[item.word]
                    ? completed[item.word]
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.word}</span>
                  {matches[item.word] && (
                    <>
                      {completed[item.word] ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Definitions Column */}
        <div className="space-y-3">
          <Heading as="h4" className="text-base font-semibold">
            Definitions
          </Heading>
          <div className="space-y-2">
            {shuffledDefinitions.map((item) => {
              const isMatched = Object.values(matches).includes(item.id);
              const isSelectedMatch =
                selected && Object.values(matches).includes(item.id)
                  ? completed[
                      items.find(
                        (i) =>
                          matches[i.word] === item.id &&
                          completed[i.word] === true
                      )?.word || ""
                    ]
                  : false;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!selected) return;
                    handleDefinitionClick(item.definition, item.id);
                  }}
                  disabled={!selected}
                  className={cn(
                    "w-full p-3 text-left rounded-lg border-2 transition-all text-sm",
                    !selected && "opacity-50 cursor-not-allowed",
                    selected &&
                      selected.definition === item.definition &&
                      "border-blue-500 bg-blue-50 cursor-pointer hover:bg-blue-100",
                    selected &&
                      selected.definition !== item.definition &&
                      isMatched &&
                      "border-gray-300 bg-gray-50 cursor-not-allowed",
                    selected &&
                      selected.definition !== item.definition &&
                      !isMatched &&
                      "border-gray-200 hover:border-gray-300 cursor-pointer",
                    isMatched &&
                      !selected &&
                      (isSelectedMatch
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50")
                  )}
                >
                  {item.definition}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      {isAllMatched && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Text className="font-semibold">
            Score: {correctCount} / {items.length} correct
          </Text>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button onClick={handleSubmit} disabled={!isAllMatched}>
          Submit
        </Button>
      </div>
    </div>
  );
}
