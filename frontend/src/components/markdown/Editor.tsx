
import React, { FormEvent, useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {Components, IComponent} from './Components';


const tokenize = (text: string) => {
  const lines: string[] = text.split('\n');
  const tokens: Array<Token> = [];

  for(const line of lines) {
    for(const component of Components) {
      var matched = false;
      for(const regex of component.regex) {
        if(regex.test(line)){
          tokens.push({type:component.type, content:component.contentTransform(line), source: line})
          matched = true;
          break;
        }
      }
      if(matched){
        break;
      }
    }
  }

  return tokens;
};

interface Token {
  type: string;
  content: string;
  source: string;
}

interface ComponentWrapperProps {
  token: Token;
  component: IComponent| undefined;
}

function ComponentWrapper({token, component}: ComponentWrapperProps){
  const componentref = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCaretInside, setIsCaretInside] = useState(false);
  const [value, setValue] = useState(token.content);
  const [source, setSource] = useState(token.source);

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (!selection) return;

    const anchorNode = selection.anchorNode;

    if (componentref.current && componentref.current.contains(anchorNode)) {
      setIsCaretInside(true);
      setIsEditing(true);
    } else {
      setIsCaretInside(false);
      setIsEditing(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);
  
  if(component){
    return (
      <div
      ref={componentref}
      className='w-full h-full focus:outline-none outline-none'
      tabIndex={0}
      onFocus={() => setIsEditing(true)}
      onBlur={()=>setIsEditing(false)}
      >
        <component.component content={isEditing? token.source: token.content}/>
      </div>
      
    );
  } else {
    return null;
  }
}



interface MarkdownEditorProps {
  initialContent: string;
}

function MarkdownEditor1({initialContent}: MarkdownEditorProps) {
  const [tokens, setTokens] = useState(tokenize(initialContent));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const caretPosition = useRef<{ index: number | null; offset: number | null }>({
    index: null,
    offset: null,
  });

  // Speichert die aktuelle Caret-Position
  const saveCaretPosition = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const parent = range.startContainer.parentElement;

      if (parent?.hasAttribute("data-index")) {
        caretPosition.current = {
          index: parseInt(parent.getAttribute("data-index") || "0", 10),
          offset: range.startOffset,
        };
      } else {
        caretPosition.current = { index: null, offset: null };
      }
    }
  };

  // Stellt die gespeicherte Caret-Position wieder her
  const restoreCaretPosition = () => {
    const { index, offset } = caretPosition.current;
    if (index !== null && offset !== null && parentRef.current) {
      const child = parentRef.current.querySelector(`[data-index="${index}"]`);
      if (child && child.firstChild) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.setStart(child.firstChild, offset);
        range.collapse(true);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  };

  // Synchronisiert Tokens mit dem DOM
  const syncTokensWithDOM = () => {
    const updatedTokens = tokens.map((token, index) => {
      const child = parentRef.current?.querySelector(`[data-index="${index}"]`);
      return child ? { ...token, source: child.textContent || "" } : token;
    });
    setTokens(updatedTokens);
  };

  // Event-Handler für Eingaben im Editor
  const handleInput = () => {
    saveCaretPosition();
    syncTokensWithDOM();
    restoreCaretPosition();
  };

  // MutationObserver zum Überwachen von DOM-Änderungen
  useEffect(() => {
    const observer = new MutationObserver(() => {
      syncTokensWithDOM();
    });

    if (parentRef.current) {
      observer.observe(parentRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => observer.disconnect();
  }, [tokens]);

  return (
    <div
    ref={parentRef}
    contentEditable="true"
    suppressContentEditableWarning={true}
    onInput={handleInput}
    onBlur={() => setActiveIndex(null)}
    className="w-full h-screen bg-skin-primary text-skin-primary">
      {tokens.map((token, index) => {
        const component: IComponent|undefined = Components.find((component: IComponent)=>component.type==token.type)
        if(component!=undefined){
          return (
          <div 
          key={index}
          data-index={index}
          data-type={token.type}
          contentEditable="true" // Kinder bleiben editierbar
          suppressContentEditableWarning={true}
          onFocus={() => setActiveIndex(index)}
          >
            <component.component
            content={activeIndex === index ? token.source : token.content}/>
          </div>)
        }
        return null;
      })}
    </div>
  );
};




export {MarkdownEditor1};
export type {Token};


import { createEditor, Transforms, Node, Editor, Element as SlateElement, Descendant, Range } from "slate";
import { Slate, Editable, withReact, RenderElementProps, ReactEditor } from "slate-react";

// Token-Interface für die ursprünglichen Daten
interface Token {
  type: string;
  source: string; // Unbearbeiteter Text
  content: string; // Bearbeiteter Text
}

// CustomElement-Typ für Slate
type CustomElement = {
  type: 'text';
  tokenIndex: number; // Der Index des Tokens im Array
  showSource: boolean; // Steuert, ob source oder content angezeigt wird
  children: { text: string }[]; // Slate erwartet immer ein `text`-Attribut für den Inhalt
};

// Slate-Typen deklarieren
declare module 'slate' {
  interface CustomTypes {
    Element: CustomElement;
    Text: {
      text: string;
    };
  }
}

// Beispiel für die Anfangsdaten
const initialTokens: Token[] = [
  { type: 'text', source: 'Dies ist der Quelltext der ersten Zeile.', content: 'Dies ist die erste Zeile.' },
  { type: 'text', source: 'Dies ist der Quelltext der zweiten Zeile.', content: 'Dies ist die zweite Zeile.' },
];

const MarkdownEditor: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>(initialTokens);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Slate Editor-Instanz erstellen
  const editor = useMemo(() => withReact(createEditor()), []);

  // Initialwert für Slate
  const initialValue: CustomElement[] = useMemo(() => {
    return tokens.map((token, index) => ({
      type: 'text',
      tokenIndex: index,
      showSource: false, // Initial zeigen wir den Content
      children: [{ text: token.content }], // Slate erwartet ein `text`-Feld als Inhalt
    }));
  }, [tokens]);

  // Slate RenderElement-Callback: Wie jedes Element gerendert wird
  const renderElement = useCallback(
    ({ attributes, children, element }: any) => {
      const customElement = element as CustomElement;
      const tokenIndex = customElement.tokenIndex;

      // Wenn `showSource` wahr ist, zeigen wir den `source`-Text, ansonsten den `content`
      const displayText = customElement.showSource
        ? tokens[tokenIndex]?.source
        : tokens[tokenIndex]?.content;

      return (
        <div
          {...attributes}
          data-index={tokenIndex}
          style={{
            padding: '4px',
            marginBottom: '8px',
            border: customElement.showSource ? '1px dashed blue' : 'none',
          }}
        >
          {displayText}
          {children}
        </div>
      );
    },
    [tokens]
  );

  // Handle Change: Wenn sich der Inhalt ändert
  const handleChange = (value: Node[]) => {
    const updatedTokens = value.map((node) => {
      const customNode = node as CustomElement;
      const textContent = Node.string(node); // Slate stellt den Text aus den Kindern zusammen

      const originalToken = tokens[customNode.tokenIndex];
      return {
        ...originalToken,
        source: originalToken.source, // Source bleibt unverändert
        content: textContent, // Content wird aktualisiert
      };
    });
    setTokens(updatedTokens);
  };

  // Handle Selection Change: Wenn die Auswahl ändert, wird das aktive Token bestimmt
  const handleSelectionChange = () => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [node] = Editor.nodes(editor, {
        match: (n) => Editor.isBlock(editor, n as CustomElement), // Typanpassung
      });

      if (node) {
        const [element] = node;
        const tokenIndex = (element as CustomElement).tokenIndex;

        // Setze den Fokus auf das Token und zeige den `source`-Text
        setActiveIndex(tokenIndex);

        // Setze den `showSource`-Status für das fokussierte Token
        Transforms.setNodes(
          editor,
          { showSource: true },
          {
            match: (n) =>
              Editor.isBlock(editor, n as CustomElement) &&
              (n as CustomElement).tokenIndex === tokenIndex,
          }
        );

        // Setze den `showSource`-Status für alle anderen Tokens auf `false`
        Transforms.setNodes(
          editor,
          { showSource: false },
          {
            match: (n) =>
              Editor.isBlock(editor, n as CustomElement) &&
              (n as CustomElement).tokenIndex !== tokenIndex,
          }
        );
      }
    }
  };

  // Handle Blur: Wenn der Editor den Fokus verliert, setzen wir `showSource` auf `false`
  const handleBlur = () => {
    setActiveIndex(null);
    Transforms.setNodes(
      editor,
      { showSource: false },
      { match: (n) => Editor.isBlock(editor, n as CustomElement) }
    );
  };

  return (
    <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
      <Editable
        renderElement={renderElement}
        onSelect={handleSelectionChange}
        onBlur={handleBlur}
        style={{
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          minHeight: '200px',
          overflowY: 'auto',
        }}
      />
    </Slate>
  );
};

export {MarkdownEditor};