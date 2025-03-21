import React, { useRef, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const RichTextEditor = ({ input, setInput }) => {
  const quillRef = useRef(null);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
    clipboard: {
      matchVisual: false,
    },
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "link",
    "image",
  ];

  const handleChange = (content) => {
    setInput({ ...input, description: content });
  };

  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor.root.setAttribute("data-gramm", "false");

      // Use MutationObserver instead of deprecated DOMNodeInserted
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            const nodes = Array.from(mutation.addedNodes);
            nodes.forEach((node) => {
              if (node.nodeType === 1) {
                node.setAttribute("data-gramm", "false");
              }
            });
          }
        });
      });

      observer.observe(editor.root, {
        childList: true,
        subtree: true,
      });

      return () => observer.disconnect();
    }
  }, []);

  return (
    <ReactQuill
      ref={quillRef}
      theme="snow"
      value={input.description}
      onChange={handleChange}
      modules={modules}
      formats={formats}
      preserveWhitespace
    />
  );
};

export default RichTextEditor;
