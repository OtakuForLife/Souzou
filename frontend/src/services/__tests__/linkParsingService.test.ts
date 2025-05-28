/**
 * Tests for the link parsing service
 */

import { describe, it, expect } from 'vitest';
import { linkParsingService } from '../linkParsingService';
import { Note } from '@/models/Note';

// Mock notes for testing
const mockNotes: Record<string, Note> = {
  'note-1': {
    id: 'note-1',
    title: 'First Note',
    content: 'This is the first note',
    created_at: '2023-01-01T00:00:00Z',
    parent: null,
    children: []
  },
  'note-2': {
    id: 'note-2',
    title: 'Second Note',
    content: 'This is the second note',
    created_at: '2023-01-02T00:00:00Z',
    parent: null,
    children: []
  },
  'note-3': {
    id: 'note-3',
    title: 'Project Ideas',
    content: 'Various project ideas',
    created_at: '2023-01-03T00:00:00Z',
    parent: null,
    children: []
  }
};

describe('LinkParsingService', () => {
  describe('parseLinks', () => {
    it('should parse wiki-style links correctly', () => {
      const content = 'Check out [[First Note]] and [[Second Note]] for more info.';
      const result = linkParsingService.parseLinks(content, mockNotes);
      
      expect(result.links).toHaveLength(2);
      expect(result.links[0]).toMatchObject({
        type: 'wiki',
        displayText: 'First Note',
        targetIdentifier: 'First Note',
        targetNoteId: 'note-1',
        isValid: true
      });
      expect(result.links[1]).toMatchObject({
        type: 'wiki',
        displayText: 'Second Note',
        targetIdentifier: 'Second Note',
        targetNoteId: 'note-2',
        isValid: true
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
      const content = 'This links to [[Nonexistent Note]] and [broken](invalid-id).';
      const result = linkParsingService.parseLinks(content, mockNotes);
      
      expect(result.links).toHaveLength(0);
      expect(result.brokenLinks).toHaveLength(2);
      expect(result.brokenLinks[0]).toMatchObject({
        type: 'wiki',
        displayText: 'Nonexistent Note',
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
      const noteWithLinks: Note = {
        id: 'note-with-links',
        title: 'Note with Links',
        content: 'See [[First Note]] and [Second](note-2) for more.',
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
      const noteWithLinks1: Note = {
        id: 'note-with-links-1',
        title: 'Note with Links 1',
        content: 'See [[First Note]] for details.',
        created_at: '2023-01-04T00:00:00Z',
        parent: null,
        children: []
      };
      
      const noteWithLinks2: Note = {
        id: 'note-with-links-2',
        title: 'Note with Links 2',
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
});
