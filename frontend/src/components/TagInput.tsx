import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAppDispatch } from '@/hooks';
import { addTagsToEntity, removeTagsFromEntity } from '@/store/slices/entitySlice';
import { fetchTags } from '@/store/slices/tagSlice';
import { TagBadge } from './TagBadge';
import { Input } from '@/components/ui/input';
import { Tag } from '@/models/Tag';

interface TagInputProps {
  entityId: string;
  currentTags: Tag[]; // Still receives Tag objects for display
}

interface TagSuggestion {
  tag: Tag;
  matchType: 'name';
  matchText: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  entityId,
  currentTags,
}) => {
  const dispatch = useAppDispatch();
  const { allTags } = useSelector((state: RootState) => state.tags);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load tags if not already loaded
  useEffect(() => {
    if (Object.keys(allTags).length === 0) {
      dispatch(fetchTags());
    }
  }, [dispatch, allTags]);

  // Get current tag IDs for easy lookup (memoized to prevent infinite re-renders)
  const currentTagIds = useMemo(() => new Set(currentTags.map(tag => tag.id)), [currentTags]);

  // Search for tag suggestions (memoized to prevent unnecessary recalculations)
  const searchTags = useCallback((query: string): TagSuggestion[] => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const results: TagSuggestion[] = [];

    Object.values(allTags).forEach(tag => {
      // Skip tags already assigned to this entity
      if (currentTagIds.has(tag.id)) return;

      // Check name match
      if (tag.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          tag,
          matchType: 'name',
          matchText: tag.name
        });
      }
    });

    // Sort by relevance: exact matches first, then starts-with, then contains
    return results.sort((a, b) => {
      const aText = a.matchText.toLowerCase();
      const bText = b.matchText.toLowerCase();

      if (aText === lowerQuery && bText !== lowerQuery) return -1;
      if (bText === lowerQuery && aText !== lowerQuery) return 1;
      if (aText.startsWith(lowerQuery) && !bText.startsWith(lowerQuery)) return -1;
      if (bText.startsWith(lowerQuery) && !aText.startsWith(lowerQuery)) return 1;

      return aText.localeCompare(bText);
    }).slice(0, 10); // Limit to 10 suggestions
  }, [allTags, currentTagIds]);

  // Update suggestions when input changes
  useEffect(() => {
    const newSuggestions = searchTags(inputValue);
    setSuggestions(newSuggestions);
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(newSuggestions.length > 0 && inputValue.trim().length > 0);
  }, [inputValue, searchTags]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle tag selection
  const handleTagSelect = async (tag: Tag) => {
    try {
      await dispatch(addTagsToEntity({ entityId, tagIds: [tag.id] }));
      setInputValue('');
      setShowSuggestions(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  // Handle tag removal
  const handleTagRemove = async (tagId: string) => {
    try {
      await dispatch(removeTagsFromEntity({ entityId, tagIds: [tagId] }));
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleTagSelect(suggestions[selectedSuggestionIndex].tag);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      {/* Tag Input Container */}
      <div className="flex flex-wrap gap-2 items-center border-none bg-background">
          {/* Current Tags */}
          {currentTags.map(tag => (
            <TagBadge
              key={tag.id}
              tag={tag}
              size="sm"
              onRemove={handleTagRemove}
              className="cursor-pointer"
            />
          ))}
          
          {/* Input Field */}
          <div className="flex items-center flex-1 min-w-[120px] h-full">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Add tags..."
              className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus bg-transparent"
              onFocus={() => {
                setShowSuggestions(true);
              }}
            />
          </div>
        </div>
      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.tag.id}-${suggestion.matchType}`}
              className={`px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground ${
                index === selectedSuggestionIndex ? 'bg-accent text-accent-foreground' : ''
              }`}
              onClick={() => handleTagSelect(suggestion.tag)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: `${suggestion.tag.color}30`, borderColor: suggestion.tag.color }}
                />
                <span className="font-medium">{suggestion.tag.name}</span>
              </div>
              {suggestion.tag.description && (
                <div className="text-xs text-muted-foreground mt-1 ml-5">
                  {suggestion.tag.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
