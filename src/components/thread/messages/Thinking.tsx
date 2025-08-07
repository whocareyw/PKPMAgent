import { useState } from "react";
import { MarkdownText } from "../markdown-text";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

export function ThinkingSection({ content , isUnFinish}: { content: string; isUnFinish: boolean }) {

  const [isExpanded, setIsExpanded] = useState(isUnFinish);

  if (!content) return null;

  return (
    <div className="py-1">
      <motion.div
        className="rounded-lg border border-gray-100 bg-gray-50"
        initial={false}
        animate={{ backgroundColor: isExpanded ? "rgb(249 250 251)" : "rgb(249 250 251)" }}
        transition={{ duration: 0.2 }}
      >
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full cursor-pointer items-center justify-between px-2 py-1 text-left text-gray-700 transition-all duration-200 ease-in-out hover:bg-gray-100"

          initial={{ scale: 1 }}
          whileHover={{ scale: 1 }}
          whileTap={{ scale: 1 }}
        >
          <div className="flex items-center gap-1">
            <span className="font-bold text-md">💡</span>
            <span className="font-bold text-sm">Thinking...</span>
          </div>
          <motion.div
            initial={false}
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div className="border-t border-gray-200 px-4 py-3">
                <div className="text-xs text-gray-500">
                  <MarkdownText>{content}</MarkdownText>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}