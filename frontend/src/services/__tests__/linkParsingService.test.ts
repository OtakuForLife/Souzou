/**
 * Comprehensive tests for the link parsing service
 * Tests cover all link parsing functionality, edge cases, and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { linkParsingService } from '../linkParsingService';
import { Entity, EntityType } from '@/models/Entity';

// Mock notes for testing
const mockNotes: Record<string, Entity> = {
  'note-1': {
    id: 'note-1',
    title: 'First Note',
    type: EntityType.NOTE,
    content: 'This is the first note',
    created_at: '2023-01-01T00:00:00Z',
    parent: null,
    children: []
  },
  'note-2': {
    id: 'note-2',
    title: 'Second Note',
    type: EntityType.NOTE,
    content: 'This is the second note',
    created_at: '2023-01-02T00:00:00Z',
    parent: null,
    children: []
  },
  'note-3': {
    id: 'note-3',
    title: 'Project Ideas',
    type: EntityType.NOTE,
    content: 'Various project ideas',
    created_at: '2023-01-03T00:00:00Z',
    parent: null,
    children: []
  }
};

describe('LinkParsingService', () => {
  describe('parseLinks', () => {
    it('should parse ID-based wiki-style links correctly', () => {
      const content = 'Check out [[note-1]] and [[note-2]] for more info.';
      const result = linkParsingService.parseLinks(content, mockNotes);

      expect(result.links).toHaveLength(2);
      expect(result.links[0]).toMatchObject({
        type: 'wiki',
        displayText: 'First Note', // Should display the note title
        targetIdentifier: 'note-1', // Should store the note ID
        targetNoteId: 'note-1',
        isValid: true
      });
      expect(result.links[1]).toMatchObject({
        type: 'wiki',
        displayText: 'Second Note', // Should display the note title
        targetIdentifier: 'note-2', // Should store the note ID
        targetNoteId: 'note-2',
        isValid: true
      });
    });

    it('should handle broken ID-based wiki links', () => {
      const content = 'This links to [[invalid-id]] which does not exist.';
      const result = linkParsingService.parseLinks(content, mockNotes);

      expect(result.links).toHaveLength(0);
      expect(result.brokenLinks).toHaveLength(1);
      expect(result.brokenLinks[0]).toMatchObject({
        type: 'wiki',
        displayText: 'Unknown Note (invalid-id)', // Should show formatted message for broken links
        targetIdentifier: 'invalid-id',
        isValid: false
      });
    });

    it('should parse markdown-style links with IDs correctly', () => {
      const content = 'See [my first note](note-1) and [another note](note-2).';
      const result = linkParsingService.parseLinks(content, mockNotes);
      
      expect(result.links).toHaveLength(2);
      expect(result.links[0]).toMatchObject({
        type: 'markdown-id',
        displayText: 'my first note',
        targetIdentifier: 'note-1',
        targetNoteId: 'note-1',
        isValid: true
      });
    });

    it('should parse markdown-style links with titles correctly', () => {
      const content = 'Check [this link](First Note) for details.';
      const result = linkParsingService.parseLinks(content, mockNotes);
      
      expect(result.links).toHaveLength(1);
      expect(result.links[0]).toMatchObject({
        type: 'markdown-title',
        displayText: 'this link',
        targetIdentifier: 'First Note',
        targetNoteId: 'note-1',
        isValid: true
      });
    });

    it('should identify broken links', () => {
      const content = 'This links to [[invalid-note-id]] and [broken](invalid-id).';
      const result = linkParsingService.parseLinks(content, mockNotes);

      expect(result.links).toHaveLength(0);
      expect(result.brokenLinks).toHaveLength(2);
      expect(result.brokenLinks[0]).toMatchObject({
        type: 'wiki',
        displayText: 'Unknown Note (invalid-note-id)',
        targetIdentifier: 'invalid-note-id',
        isValid: false
      });
      expect(result.brokenLinks[1]).toMatchObject({
        type: 'markdown-id',
        displayText: 'broken',
        isValid: false
      });
    });
  });

  describe('searchNotesForSuggestions', () => {
    it('should return matching notes for search query', () => {
      const suggestions = linkParsingService.searchNotesForSuggestions('Note', mockNotes);
      
      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].title).toBe('First Note');
      expect(suggestions[1].title).toBe('Second Note');
    });

    it('should prioritize exact matches', () => {
      const suggestions = linkParsingService.searchNotesForSuggestions('First', mockNotes);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].title).toBe('First Note');
    });

    it('should exclude current note from suggestions', () => {
      const suggestions = linkParsingService.searchNotesForSuggestions('Note', mockNotes, 'note-1');
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].title).toBe('Second Note');
    });

    it('should return empty array for no matches', () => {
      const suggestions = linkParsingService.searchNotesForSuggestions('xyz', mockNotes);
      
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('findNoteByTitle', () => {
    it('should find note by exact title match', () => {
      const note = linkParsingService.findNoteByTitle('First Note', mockNotes);
      
      expect(note).toBeTruthy();
      expect(note?.id).toBe('note-1');
    });

    it('should find note by fuzzy title match', () => {
      const note = linkParsingService.findNoteByTitle('Project', mockNotes);
      
      expect(note).toBeTruthy();
      expect(note?.id).toBe('note-3');
    });

    it('should return null for no match', () => {
      const note = linkParsingService.findNoteByTitle('Nonexistent', mockNotes);
      
      expect(note).toBeNull();
    });
  });

  describe('getOutgoingLinks', () => {
    it('should return outgoing links from a note', () => {
      // Add a note with links
      const noteWithLinks: Entity = {
        id: 'note-with-links',
        title: 'Note with Links',
        type: EntityType.NOTE,
        content: 'See [[note-1]] and [Second](note-2) for more.',
        created_at: '2023-01-04T00:00:00Z',
        parent: null,
        children: []
      };
      
      const notesWithLinks = { ...mockNotes, 'note-with-links': noteWithLinks };
      const outgoingLinks = linkParsingService.getOutgoingLinks('note-with-links', notesWithLinks);
      
      expect(outgoingLinks).toHaveLength(2);
      expect(outgoingLinks[0].targetNoteId).toBe('note-1');
      expect(outgoingLinks[1].targetNoteId).toBe('note-2');
    });
  });

  describe('getIncomingLinks', () => {
    it('should return incoming links to a note', () => {
      // Add notes with links pointing to note-1
      const noteWithLinks1: Entity = {
        id: 'note-with-links-1',
        title: 'Note with Links 1',
        type: EntityType.NOTE,
        content: 'See [[note-1]] for details.',
        created_at: '2023-01-04T00:00:00Z',
        parent: null,
        children: []
      };
      
      const noteWithLinks2: Entity = {
        id: 'note-with-links-2',
        title: 'Note with Links 2',
        type: EntityType.NOTE,
        content: 'Check [this](note-1) out.',
        created_at: '2023-01-05T00:00:00Z',
        parent: null,
        children: []
      };
      
      const notesWithLinks = { 
        ...mockNotes, 
        'note-with-links-1': noteWithLinks1,
        'note-with-links-2': noteWithLinks2
      };
      
      const incomingLinks = linkParsingService.getIncomingLinks('note-1', notesWithLinks);
      
      expect(incomingLinks).toHaveLength(2);
      expect(incomingLinks[0].sourceNote.id).toBe('note-with-links-1');
      expect(incomingLinks[1].sourceNote.id).toBe('note-with-links-2');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty content', () => {
      const result = linkParsingService.parseLinks('', mockNotes);
      expect(result.links).toHaveLength(0);
      expect(result.brokenLinks).toHaveLength(0);
    });

    it('should handle content with no links', () => {
      const content = 'This is just plain text with no links at all.';
      const result = linkParsingService.parseLinks(content, mockNotes);
      expect(result.links).toHaveLength(0);
      expect(result.brokenLinks).toHaveLength(0);
    });

    it('should handle malformed wiki links', () => {
      const content = 'This has [[incomplete link and [malformed] syntax.';
      const result = linkParsingService.parseLinks(content, mockNotes);
      expect(result.links).toHaveLength(0);
    });

    it('should handle malformed markdown links', () => {
      const content = 'This has [incomplete](link and [malformed syntax.';
      const result = linkParsingService.parseLinks(content, mockNotes);
      expect(result.links).toHaveLength(0);
    });

    it('should handle very long content', () => {
      const longContent = 'Start ' + 'x'.repeat(10000) + ' [[note-1]] end.';
      const result = linkParsingService.parseLinks(longContent, mockNotes);
      expect(result.links).toHaveLength(1);
      expect(result.links[0].from).toBeGreaterThan(10000);
    });

    it('should handle multiple links to same note', () => {
      const content = '[[note-1]] and [[note-1]] again and [link](note-1).';
      const result = linkParsingService.parseLinks(content, mockNotes);
      expect(result.links).toHaveLength(3);
      expect(result.links.every(link => link.targetNoteId === 'note-1')).toBe(true);
    });

    it('should handle empty entities object', () => {
      const content = 'This has [[some-id]] and [another](link).';
      const result = linkParsingService.parseLinks(content, {});
      expect(result.links).toHaveLength(0);
      expect(result.brokenLinks).toHaveLength(2);
    });

    it('should handle special characters in note IDs', () => {
      const specialNotes = {
        ...mockNotes,
        'special-note-id': {
          id: 'special-note-id',
          title: 'Note with (special) chars & symbols!',
          type: EntityType.NOTE,
          content: 'Special content',
          created_at: '2023-01-01T00:00:00Z',
          parent: null,
          children: []
        }
      };

      const content = '[[special-note-id]]';
      const result = linkParsingService.parseLinks(content, specialNotes);
      expect(result.links).toHaveLength(1);
      expect(result.links[0].targetNoteId).toBe('special-note-id');
      expect(result.links[0].displayText).toBe('Note with (special) chars & symbols!');
    });

    it('should handle whitespace in links', () => {
      const content = '[[ note-1 ]] and [ link ]( note-1 ).';
      const result = linkParsingService.parseLinks(content, mockNotes);
      // Should handle trimmed whitespace - both links should work
      expect(result.links).toHaveLength(2); // Both wiki and markdown links should work after trimming
    });
  });

  describe('Link position tracking', () => {
    it('should track correct positions for wiki links', () => {
      const content = 'Start [[note-1]] middle [[note-2]] end.';
      const result = linkParsingService.parseLinks(content, mockNotes);

      expect(result.links).toHaveLength(2);
      expect(result.links[0].from).toBe(6);
      expect(result.links[0].to).toBe(16); // [[note-1]]
      expect(result.links[1].from).toBe(24); // [[note-2]]
      expect(result.links[1].to).toBe(34);
    });

    it('should track correct positions for markdown links', () => {
      const content = 'Start [first](note-1) middle [second](note-2) end.';
      const result = linkParsingService.parseLinks(content, mockNotes);

      expect(result.links).toHaveLength(2);
      expect(result.links[0].from).toBe(6);
      expect(result.links[0].to).toBe(21);
      expect(result.links[1].from).toBe(29);
      expect(result.links[1].to).toBe(45); // Corrected position
    });
  });

  describe('Link creation methods', () => {
    it('should create ID-based wiki links', () => {
      const wikiLink = linkParsingService.createWikiLink('note-1');
      expect(wikiLink).toBe('[[note-1]]');
    });

    it('should create markdown links with IDs', () => {
      const markdownLink = linkParsingService.createMarkdownLink('Display Text', 'note-1');
      expect(markdownLink).toBe('[Display Text](note-1)');
    });
  });

  describe('Performance and stress tests', () => {
    it('should handle many links efficiently', () => {
      const manyLinks = Array.from({ length: 100 }, (_, i) => `[[note-1]]`).join(' ');
      const start = performance.now();
      const result = linkParsingService.parseLinks(manyLinks, mockNotes);
      const end = performance.now();

      expect(result.links).toHaveLength(100);
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle large note collections', () => {
      const largeNoteCollection: Record<string, Entity> = {};
      for (let i = 0; i < 1000; i++) {
        largeNoteCollection[`note-${i}`] = {
          id: `note-${i}`,
          title: `Note ${i}`,
          type: EntityType.NOTE,
          content: `Content ${i}`,
          created_at: '2023-01-01T00:00:00Z',
          parent: null,
          children: []
        };
      }

      const content = '[[note-500]] and [link](note-750)';
      const start = performance.now();
      const result = linkParsingService.parseLinks(content, largeNoteCollection);
      const end = performance.now();

      expect(result.links).toHaveLength(2);
      expect(end - start).toBeLessThan(50); // Should be fast even with many notes
    });
  });
});
