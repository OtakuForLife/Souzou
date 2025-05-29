/**
 * CodeMirror 6 autocompletion extension for note linking
 */

import { CompletionContext, CompletionResult, CompletionSource } from "@codemirror/autocomplete";
import { Entity } from "@/models/Entity";
import { linkParsingService, NoteSuggestion } from "@/services/linkParsingService";

/**
 * Interface for notes data provider
 */
interface NotesDataProvider {
  allNotes: Record<string, Entity>;
  currentNoteId?: string;
}

/**
 * Type for the result of context.matchBefore()
 */
interface MatchResult {
  from: number;
  to: number;
  text: string;
}

/**
 * Create a completion source for wiki-style note linking [[
 */
export function createNoteLinkCompletion(
  getNotesData: () => NotesDataProvider
): CompletionSource {
  return (context: CompletionContext): CompletionResult | null => {
    try {
      // Check if we're typing a wiki-style link [[
      const wikiLinkMatch = context.matchBefore(/\[\[([^\]]*)/);

      if (!wikiLinkMatch && !context.explicit) {
        return null;
      }

      // Extract the query from the matched text
      let query = "";
      if (wikiLinkMatch) {
        const matchText = wikiLinkMatch.text;
        if (matchText && matchText.startsWith('[[')) {
          query = matchText.slice(2);
        }
      }

      // Don't show suggestions for very short queries unless explicitly requested
      if (query.length < 1 && !context.explicit) {
        return null;
      }

      // Get current notes data with error handling
      const notesData = getNotesData();
      if (!notesData || !notesData.allNotes) {
        return null;
      }

      const { allNotes, currentNoteId } = notesData;

      // Get note suggestions
      const suggestions = linkParsingService.searchNotesForSuggestions(
        query,
        allNotes,
        currentNoteId
      );

      if (!suggestions || suggestions.length === 0) {
        return null;
      }

      // Calculate the correct from position
      const from = wikiLinkMatch ? wikiLinkMatch.from + 2 : context.pos; // +2 to skip "[["

      return {
        from,
        options: suggestions.map((note: NoteSuggestion) => ({
          label: note.title,
          type: "text",
          apply: `${note.title}]]`, // Complete the wiki link
          detail: "Note",
          info: `Link to: ${note.title}`,
          boost: note.title.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0,
          section: "📝 Notes" // Add section grouping
        })),
        validFor: /^[^\]]*$/ // Valid as long as we don't type a closing bracket
      };
    } catch (error) {
      console.error('Error in wiki link completion:', error);
      return null;
    }
  };
}

/**
 * Create a completion source for markdown-style links [text](
 */
export function createMarkdownLinkCompletion(
  getNotesData: () => NotesDataProvider
): CompletionSource {
  return (context: CompletionContext): CompletionResult | null => {
    try {
      // Check if we're typing a markdown link [text](
      const markdownLinkMatch = context.matchBefore(/\[[^\]]*\]\(([^)]*)/);

      if (!markdownLinkMatch && !context.explicit) {
        return null;
      }

      // Extract the query from the matched text
      let query = "";
      let parenIndex = -1;

      if (markdownLinkMatch) {
        const matchText = markdownLinkMatch.text;
        if (matchText) {
          parenIndex = matchText.lastIndexOf('(');
          query = parenIndex !== -1 ? matchText.slice(parenIndex + 1) : "";
        }
      }

      // Don't show suggestions for very short queries unless explicitly requested
      if (query.length < 1 && !context.explicit) {
        return null;
      }

      // Get current notes data with error handling
      const notesData = getNotesData();
      if (!notesData || !notesData.allNotes) {
        return null;
      }

      const { allNotes, currentNoteId } = notesData;

      // Get note suggestions
      const suggestions = linkParsingService.searchNotesForSuggestions(
        query,
        allNotes,
        currentNoteId
      );

      if (!suggestions || suggestions.length === 0) {
        return null;
      }

      // Calculate the correct from position
      const from = markdownLinkMatch && parenIndex !== -1
        ? markdownLinkMatch.from + parenIndex + 1
        : context.pos;

      return {
        from,
        options: [
          // Suggest note titles for title-based links
          ...suggestions.map((note: NoteSuggestion) => ({
            label: note.title,
            type: "text",
            apply: `${note.title})`, // Complete with title
            detail: "Note Title",
            info: `Link to: ${note.title}`,
            boost: note.title.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0
          })),
          // Suggest note IDs for ID-based links
          ...suggestions.map((note: NoteSuggestion) => ({
            label: `${note.title} (ID)`,
            type: "text",
            apply: `${note.id})`, // Complete with ID
            detail: "Note ID",
            info: `Link to: ${note.title} (using ID)`,
            boost: note.title.toLowerCase().startsWith(query.toLowerCase()) ? 0.5 : 0
          }))
        ],
        validFor: /^[^)]*$/ // Valid as long as we don't type a closing parenthesis
      };
    } catch (error) {
      console.error('Error in markdown link completion:', error);
      return null;
    }
  };
}

/**
 * Combined completion source that handles both wiki and markdown links
 */
export function createCombinedLinkCompletion(
  getNotesData: () => NotesDataProvider
): CompletionSource {
  return (context: CompletionContext): CompletionResult | null => {
    try {
      // Check if we're typing a wiki-style link [[
      const wikiLinkMatch = context.matchBefore(/\[\[([^\]]*)/);
      if (wikiLinkMatch) {
        // Handle wiki-style completion inline
        return handleWikiCompletion(context, wikiLinkMatch, getNotesData);
      }

      // Check if we're typing a markdown link [text](
      const markdownLinkMatch = context.matchBefore(/\[[^\]]*\]\(([^)]*)/);
      if (markdownLinkMatch) {
        // Handle markdown-style completion inline
        return handleMarkdownCompletion(context, markdownLinkMatch, getNotesData);
      }

      // Handle explicit completion requests
      if (context.explicit) {
        // Try wiki completion first
        const wikiResult = handleWikiCompletion(context, null, getNotesData);
        if (wikiResult) {
          return wikiResult;
        }

        // Then try markdown completion
        const markdownResult = handleMarkdownCompletion(context, null, getNotesData);
        if (markdownResult) {
          return markdownResult;
        }
      }

      return null;
    } catch (error) {
      console.error('Error in combined link completion:', error);
      return null;
    }
  };
}

/**
 * Handle wiki-style completion logic
 */
function handleWikiCompletion(
  context: CompletionContext,
  wikiLinkMatch: MatchResult | null,
  getNotesData: () => NotesDataProvider
): CompletionResult | null {
  try {
    if (!wikiLinkMatch && !context.explicit) {
      return null;
    }

    // Extract the query from the matched text
    let query = "";
    if (wikiLinkMatch) {
      const matchText = wikiLinkMatch.text;
      if (matchText && matchText.startsWith('[[')) {
        query = matchText.slice(2);
      }
    }

    // Don't show suggestions for very short queries unless explicitly requested
    if (query.length < 1 && !context.explicit) {
      return null;
    }

    // Get current notes data with error handling
    const notesData = getNotesData();
    if (!notesData || !notesData.allNotes) {
      return null;
    }

    const { allNotes, currentNoteId } = notesData;

    // Get note suggestions
    const suggestions = linkParsingService.searchNotesForSuggestions(
      query,
      allNotes,
      currentNoteId
    );

    if (!suggestions || suggestions.length === 0) {
      return null;
    }

    // Calculate the correct from position
    const from = wikiLinkMatch ? wikiLinkMatch.from + 2 : context.pos; // +2 to skip "[["

    return {
      from,
      options: suggestions.map((note: NoteSuggestion) => ({
        label: note.title,
        type: "text",
        apply: `${note.title}`, // Complete the wiki link
        detail: "Note",
        info: `Link to: ${note.title}`,
        boost: note.title.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0
      })),
      validFor: /^[^\]]*$/ // Valid as long as we don't type a closing bracket
    };
  } catch (error) {
    console.error('Error in wiki completion:', error);
    return null;
  }
}

/**
 * Handle markdown-style completion logic
 */
function handleMarkdownCompletion(
  context: CompletionContext,
  markdownLinkMatch: MatchResult | null,
  getNotesData: () => NotesDataProvider
): CompletionResult | null {
  try {
    if (!markdownLinkMatch && !context.explicit) {
      return null;
    }

    // Extract the query from the matched text
    let query = "";
    let parenIndex = -1;

    if (markdownLinkMatch) {
      const matchText = markdownLinkMatch.text;
      if (matchText) {
        parenIndex = matchText.lastIndexOf('(');
        query = parenIndex !== -1 ? matchText.slice(parenIndex + 1) : "";
      }
    }

    // Don't show suggestions for very short queries unless explicitly requested
    if (query.length < 1 && !context.explicit) {
      return null;
    }

    // Get current notes data with error handling
    const notesData = getNotesData();
    if (!notesData || !notesData.allNotes) {
      return null;
    }

    const { allNotes, currentNoteId } = notesData;

    // Get note suggestions
    const suggestions = linkParsingService.searchNotesForSuggestions(
      query,
      allNotes,
      currentNoteId
    );

    if (!suggestions || suggestions.length === 0) {
      return null;
    }

    // Calculate the correct from position
    const from = markdownLinkMatch && parenIndex !== -1
      ? markdownLinkMatch.from + parenIndex + 1
      : context.pos;

    return {
      from,
      options: [
        // Suggest note titles for title-based links
        ...suggestions.map((note: NoteSuggestion) => ({
          label: note.title,
          type: "text",
          apply: `${note.title})`, // Complete with title
          detail: "Note Title",
          info: `Link to: ${note.title}`,
          boost: note.title.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0
        })),
        // Suggest note IDs for ID-based links
        ...suggestions.map((note: NoteSuggestion) => ({
          label: `${note.title} (ID)`,
          type: "text",
          apply: `${note.id})`, // Complete with ID
          detail: "Note ID",
          info: `Link to: ${note.title} (using ID)`,
          boost: note.title.toLowerCase().startsWith(query.toLowerCase()) ? 0.5 : 0
        }))
      ],
      validFor: /^[^)]*$/ // Valid as long as we don't type a closing parenthesis
    };
  } catch (error) {
    console.error('Error in markdown completion:', error);
    return null;
  }
}

