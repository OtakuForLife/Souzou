/**
 * Service for parsing and managing note links in markdown content
 */

import { Entity } from '@/models/Entity';

export interface ParsedLink {
  from: number;
  to: number;
  type: 'wiki' | 'markdown-id' | 'markdown-title';
  displayText: string;
  targetIdentifier: string; // note title or ID
  targetNoteId?: string; // resolved note ID
  isValid: boolean;
}

export interface LinkParseResult {
  links: ParsedLink[];
  brokenLinks: ParsedLink[];
}

export interface NoteSuggestion {
  id: string;
  title: string;
}

class LinkParsingService {
  /**
   * Parse all links in content and resolve them against available notes
   */
  parseLinks(content: string, allNotes: Record<string, Entity>): LinkParseResult {
    const links: ParsedLink[] = [];
    const brokenLinks: ParsedLink[] = [];

    // Parse [[Note Title]] links
    const wikiLinks = this.parseWikiLinks(content, allNotes);

    // Parse [Display](note-id) and [Display](Note Title) links
    const markdownLinks = this.parseMarkdownLinks(content, allNotes);

    // Combine and categorize
    [...wikiLinks, ...markdownLinks].forEach(link => {
      if (link.isValid && link.targetNoteId) {
        links.push(link);
      } else {
        brokenLinks.push(link);
      }
    });

    return { links, brokenLinks };
  }

  /**
   * Parse [[noteID]] style links
   */
  private parseWikiLinks(content: string, allNotes: Record<string, Entity>): ParsedLink[] {
    const links: ParsedLink[] = [];
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    let match;

    while ((match = wikiLinkRegex.exec(content)) !== null) {
      const from = match.index;
      const to = match.index + match[0].length;
      const noteId = match[1].trim();

      // Look up the note by ID
      const targetNote = allNotes[noteId] || null;
      const displayText = targetNote ? targetNote.title : `Unknown Note (${noteId})`;

      links.push({
        from,
        to,
        type: 'wiki',
        displayText,
        targetIdentifier: noteId,
        targetNoteId: targetNote?.id,
        isValid: !!targetNote
      });
    }

    return links;
  }

  /**
   * Parse [Display](target) style links
   */
  private parseMarkdownLinks(content: string, allNotes: Record<string, Entity>): ParsedLink[] {
    const links: ParsedLink[] = [];
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = markdownLinkRegex.exec(content)) !== null) {
      const from = match.index;
      const to = match.index + match[0].length;
      const displayText = match[1].trim();
      const target = match[2].trim();

      // Check if target is a note ID (UUID format or simple string ID)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);
      const isSimpleId = allNotes[target] !== undefined; // Check if it's a direct ID match

      // Heuristic: if it looks like an ID (contains dashes, no spaces, lowercase/numbers)
      // and doesn't match any note title, treat it as an ID
      const looksLikeId = /^[a-z0-9\-_]+$/i.test(target) && !target.includes(' ');

      let targetNote: Entity | null = null;
      let linkType: 'markdown-id' | 'markdown-title' = 'markdown-title';

      if (isUUID || isSimpleId) {
        // Target is a note ID (either UUID or simple string)
        targetNote = allNotes[target] || null;
        linkType = 'markdown-id';
      } else if (looksLikeId) {
        // Looks like an ID but doesn't exist - treat as broken ID
        targetNote = null;
        linkType = 'markdown-id';
      } else {
        // Target is a note title
        targetNote = this.findNoteByTitle(target, allNotes);
        linkType = 'markdown-title';
      }

      links.push({
        from,
        to,
        type: linkType,
        displayText,
        targetIdentifier: target,
        targetNoteId: targetNote?.id,
        isValid: !!targetNote
      });
    }

    return links;
  }

  /**
   * Find note by title with exact and fuzzy matching
   */
  findNoteByTitle(title: string, allNotes: Record<string, Entity>): Entity | null {
    const normalizedTitle = title.toLowerCase().trim();

    // Exact match first
    const exactMatch = Object.values(allNotes).find(note =>
      note.title.toLowerCase().trim() === normalizedTitle
    );
    if (exactMatch) return exactMatch;

    // Fuzzy match - find notes that contain the title or vice versa
    const fuzzyMatch = Object.values(allNotes).find(note => {
      const noteTitle = note.title.toLowerCase().trim();
      return noteTitle.includes(normalizedTitle) || normalizedTitle.includes(noteTitle);
    });

    return fuzzyMatch || null;
  }

  /**
   * Search notes for autocomplete suggestions
   */
  searchNotesForSuggestions(
    query: string,
    allNotes: Record<string, Entity>,
    excludeNoteId?: string
  ): NoteSuggestion[] {
    if (query.length < 1) return [];

    const normalizedQuery = query.toLowerCase().trim();

    return Object.values(allNotes)
      .filter(note =>
        note.id !== excludeNoteId && // Don't suggest current note
        note.title.toLowerCase().includes(normalizedQuery)
      )
      .sort((a, b) => {
        // Prioritize exact matches and shorter titles
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        const aExact = aTitle.startsWith(normalizedQuery);
        const bExact = bTitle.startsWith(normalizedQuery);

        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        return a.title.length - b.title.length;
      })
      .slice(0, 10) // Limit suggestions
      .map(note => ({
        id: note.id,
        title: note.title
      }));
  }

  /**
   * Get all outgoing links from a note
   */
  getOutgoingLinks(noteId: string, allNotes: Record<string, Entity>): ParsedLink[] {
    const note = allNotes[noteId];
    if (!note) return [];

    return this.parseLinks(note.content, allNotes).links;
  }

  /**
   * Get all incoming links to a note (backlinks)
   */
  getIncomingLinks(targetNoteId: string, allNotes: Record<string, Entity>): Array<{
    sourceNote: Entity;
    links: ParsedLink[];
  }> {
    const backlinks: Array<{ sourceNote: Entity; links: ParsedLink[] }> = [];

    Object.values(allNotes).forEach(sourceNote => {
      if (sourceNote.id === targetNoteId) return; // Skip self

      const outgoingLinks = this.getOutgoingLinks(sourceNote.id, allNotes);
      const linksToTarget = outgoingLinks.filter(link => link.targetNoteId === targetNoteId);

      if (linksToTarget.length > 0) {
        backlinks.push({
          sourceNote,
          links: linksToTarget
        });
      }
    });

    return backlinks;
  }

  /**
   * Resolve note title from ID for display purposes
   */
  resolveNoteTitle(noteId: string, allNotes: Record<string, Entity>): string {
    const note = allNotes[noteId];
    return note ? note.title : 'Unknown Note';
  }

  /**
   * Create a wiki-style link using note ID
   */
  createWikiLink(noteId: string): string {
    return `[[${noteId}]]`;
  }

  /**
   * Create a markdown-style link with note ID
   */
  createMarkdownLink(displayText: string, noteId: string): string {
    return `[${displayText}](${noteId})`;
  }
}

// Export singleton instance
export const linkParsingService = new LinkParsingService();
