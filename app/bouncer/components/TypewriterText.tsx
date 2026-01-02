"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export interface TypewriterConfig {
  baseTypingSpeed?: number;
  typingSpeedVariation?: number;
  cursorBlinkRate?: number;
  cursorWidth?: string;
  delayBetweenLines?: number;
  showCursor?: boolean;
}

interface TypewriterTextProps {
  lines: string[];
  onComplete?: () => void;
  config?: TypewriterConfig;
  className?: string;
}

const DEFAULT_CONFIG: Required<TypewriterConfig> = {
  baseTypingSpeed: 100,
  typingSpeedVariation: 100,
  cursorBlinkRate: 530,
  cursorWidth: "2px",
  delayBetweenLines: 200,
  showCursor: true,
};

export default function TypewriterText({
  lines,
  onComplete,
  config = {},
  className = "",
}: TypewriterTextProps) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [showCursor, setShowCursor] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  const currentLine = lines[currentLineIndex] || "";
  const isLastLine = currentLineIndex === lines.length - 1;
  const isLineComplete = currentCharIndex >= currentLine.length;

  // Typing effect
  useEffect(() => {
    if (isComplete) return;

    if (currentCharIndex < currentLine.length) {
      const timeout = setTimeout(
        () => {
          setDisplayedLines((prev) => {
            const newLines = [...prev];
            if (!newLines[currentLineIndex]) {
              newLines[currentLineIndex] = "";
            }
            newLines[currentLineIndex] += currentLine[currentCharIndex];
            return newLines;
          });
          setCurrentCharIndex((prev) => prev + 1);
        },
        mergedConfig.baseTypingSpeed +
          Math.random() * mergedConfig.typingSpeedVariation
      );

      return () => clearTimeout(timeout);
    } else if (isLastLine && currentCharIndex >= currentLine.length) {
      // Last line complete - trigger onComplete
      if (!isComplete) {
        setIsComplete(true);
        onComplete?.();
      }
    } else if (currentCharIndex >= currentLine.length) {
      // Move to next line after delay
      const timeout = setTimeout(() => {
        setCurrentLineIndex((prev) => prev + 1);
        setCurrentCharIndex(0);
      }, mergedConfig.delayBetweenLines);

      return () => clearTimeout(timeout);
    }
  }, [
    currentLineIndex,
    currentCharIndex,
    lines,
    currentLine,
    isLastLine,
    mergedConfig,
    onComplete,
    isComplete,
  ]);

  // Cursor blink effect
  useEffect(() => {
    if (!mergedConfig.showCursor || isComplete) return;

    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, mergedConfig.cursorBlinkRate);

    return () => clearInterval(interval);
  }, [mergedConfig.cursorBlinkRate, mergedConfig.showCursor, isComplete]);

  return (
    <div className={className}>
      {displayedLines.map((line, index) => (
        <p key={index}>
          {line}
          {mergedConfig.showCursor &&
            index === currentLineIndex &&
            !isComplete && (
              <motion.span
                animate={{ opacity: showCursor ? 1 : 0 }}
                transition={{ duration: 0 }}
                className="inline-block align-middle ml-1 bg-current"
                style={{
                  width: mergedConfig.cursorWidth,
                  height: "1em",
                }}
              />
            )}
        </p>
      ))}
    </div>
  );
}
