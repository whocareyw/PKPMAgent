import { PrismAsyncLight as SyntaxHighlighterPrism } from "react-syntax-highlighter";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import { prism } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { FC } from "react";

// Register languages you want to support
SyntaxHighlighterPrism.registerLanguage("js", tsx);
SyntaxHighlighterPrism.registerLanguage("jsx", tsx);
SyntaxHighlighterPrism.registerLanguage("ts", tsx);
SyntaxHighlighterPrism.registerLanguage("tsx", tsx);
SyntaxHighlighterPrism.registerLanguage("python", python);

interface SyntaxHighlighterProps {
  children: string;
  language: string;
  className?: string;
  wrapLongLines?: boolean;
}

export const SyntaxHighlighter: FC<SyntaxHighlighterProps> = ({
  children,
  language,
  className,
  wrapLongLines,
}) => {
  return (
    <SyntaxHighlighterPrism
      language={language}
      style={prism}
      customStyle={{
        margin: 0,
        width: "100%",
        background: "transparent",
        fontSize: "0.75rem",
        //padding: "1.5rem 1rem",
      }}
      className={className}
      wrapLongLines={wrapLongLines}
      codeTagProps={{
        style: {
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }
      }}
    >
      {children}
    </SyntaxHighlighterPrism>
  );
};
