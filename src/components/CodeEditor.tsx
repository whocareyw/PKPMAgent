import React, { useState } from "react";
import Editor from "@monaco-editor/react";

export function CodeEditor() {
  const [code, setCode] = useState("# Write your Python code here\n\ndef hello_world():\n    print('Hello, World!')\n\nhello_world()");

  function handleEditorChange(value: string | undefined) {
    setCode(value || "");
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 border rounded-md overflow-hidden bg-[#1e1e1e]">
        <Editor
          height="100%"
          defaultLanguage="python"
          defaultValue={code}
          theme="vs-dark"
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            tabSize: 4, 
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}
