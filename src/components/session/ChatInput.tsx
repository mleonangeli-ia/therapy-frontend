"use client";
import { useState, useRef, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import clsx from "clsx";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
  isProcessing?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, isProcessing, placeholder }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const text = value.trim();
    if (!text || disabled || isProcessing) return;
    onSend(text);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  };

  return (
    <div className="flex items-end gap-3 bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        disabled={disabled || isProcessing}
        placeholder={placeholder ?? "Escribí tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"}
        rows={1}
        className={clsx(
          "flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400",
          "focus:outline-none leading-relaxed",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "max-h-[150px] overflow-y-auto"
        )}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled || isProcessing}
        className={clsx(
          "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
          value.trim() && !disabled && !isProcessing
            ? "bg-primary-600 text-white hover:bg-primary-700"
            : "bg-gray-100 text-gray-300 cursor-not-allowed"
        )}
      >
        {isProcessing ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
      </button>
    </div>
  );
}
