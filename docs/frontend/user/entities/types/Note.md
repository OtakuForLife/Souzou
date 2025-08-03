# Note Entities User Guide

## Overview

Note entities are the core building blocks of the Souzou application. They provide a powerful, flexible system for creating, organizing, and connecting your thoughts, ideas, and information. Notes in Souzou go beyond simple text documents - they support advanced features like wiki-style linking, dynamic queries, hierarchical organization, and semantic search.

## Getting Started

### Creating Your First Note

1. **From the Main Interface**: If no note is open, click the "Create a Note" button in the center of the screen
2. **From the Tree View**: Right-click on any note in the left sidebar and select "New" → "Note"
3. **As a Child Note**: Right-click on a parent note to create a child note underneath it

When you create a note, it starts with the default title "New Note" and empty content. You can immediately start editing both the title and content.

### Basic Note Structure

Every note has the following properties:
- **Title**: A descriptive name (up to 200 characters)
- **Content**: The main body text supporting full markdown
- **Parent**: Optional parent note for hierarchical organization
- **Tags**: Labels for categorization and filtering
- **Metadata**: Custom properties stored as key-value pairs
- **Timestamps**: Automatic creation and modification dates


## Editor Features

### Wiki Linking

Connect your notes using wiki-style links with double brackets:
```markdown
This links to another note: [[note-id-here]]
```

**Auto-completing**:
1. Type `[[` to trigger auto-completion
2. Start typing a note title to see suggestions
3. Select a note from the dropdown or press enter

**Link Behavior**:
- Wiki-Links always display the note title
- Click any link to open a new tab to that note
- Broken links (to deleted notes) are highlighted differently

### Markdown Linking

Link to notes using markdown syntax:
```markdown
This links to another note: [Link Text](note-id-here)
```

**Link Behavior**:
- Markdown links display the provided link text
- Click any link to open a new tab to that note
- Broken links (to deleted notes) are highlighted differently

### Dynamic Query Language

Embed live, updating content in your notes using the query language syntax:

#### Basic Query Structure
```markdown
{{{
query:
  type: note
  tag: [meeting]
render:
  format: list
  fields: [title, created_at]
}}}
```

#### Filter Options

**type (Optional)**:
- `note`: Regular notes
- `view`: Dashboard views
- `ai_chat_history`: AI conversation history
- `media`: Media files

```markdown
{{{
query:
  type: note
}}}
```

**tag (Optional)**:

Filter by one or more tags.
```markdown
{{{
query:
  tag: [project, urgent]
}}}
```

**parent (Optional)**:

```markdown
{{{
query:
  parent: $current.id
}}}
```

**updated (Optional)**:

Filter by last updated date. Options:
- `within_days`: Number of days
- `after`: Specific date
- `before`: Specific date


```markdown
{{{
query:
  updated:
    within_days: 7
}}}
```

```markdown
{{{
query:
  updated:
    after: 2025-01-01
    before: 2025-06-30
}}}
```

**created (Optional)**:

Filter by creation date. Options:
- `within_days`: Number of days
- `after`: Specific date
- `before`: Specific date

```markdown
{{{
query:
  created:
    before: 2025-01-01
}}}
```

**sort (Optional)**:

Sort the results. Options:
- `created_at`: Sort by creation date
- `updated_at`: Sort by last updated date
- `title`: Sort by title
- `random`: Random order

```markdown
{{{
query:
  sort: updated_at
}}}
```

**limit (Optional)**:

Limit the number of results returned.
```markdown
{{{
query:
  limit: 10
}}}
```


**Rendering Formats**:

*List Format*:
```markdown
{{{
query:
  type: note
  tag: [meeting]
render:
  format: list
  fields: [title, created_at]
}}}
```
Produces:
- Meeting Notes (2025-01-15)
- Weekly Standup (2025-01-14)
- Project Review (2025-01-10)

*Table Format*:
```markdown
{{{
query:
  type: note
  updated:
    within_days: 7
render:
  format: table
  fields: [title, updated_at]
}}}
```

*Full Format* (notes only):
```markdown
{{{
query:
  type: note
  tag: [summary]
  limit: 3
render:
  format: full
}}}
```
Embeds the complete markdown content of matching notes.

#### Context Variables
Use special variables in queries:
- `$current.id`: ID of the current note
- `$entity.id`: ID of the current entity (context-aware)

### Hierarchical Organization

#### Creating Note Hierarchies
1. **Drag and Drop**: Drag notes in the tree view to reorganize them
2. **Context Menu**: Right-click a note and select "New" → "Note" to create a child
3. **During Creation**: Specify a parent when creating a new note

#### Benefits of Hierarchies
- **Logical Organization**: Group related notes together
- **Context Queries**: Query child notes using `parent: $current.id`
- **Visual Structure**: See relationships in the tree view
- **Navigation**: Expand/collapse sections in the sidebar

#### Example Hierarchy
```
📁 Project Alpha
  📄 Meeting Notes
  📄 Requirements
  📁 Development
    📄 Technical Specs
    📄 Code Review Notes
  📄 Final Report
```

### Tagging System

#### Adding Tags to Notes
Tags help categorize and filter your notes:

1. **Through the Interface**: Use the tag manager to assign tags
2. **Programmatically**: Tags are managed through the application's tagging system
3. **In Queries**: Filter notes by tags using the query language

#### Tag Features
- **Hierarchical Tags**: Tags can have parent-child relationships
- **Color Coding**: Assign colors to tags for visual organization
- **Descriptions**: Add descriptions to explain tag purposes
- **Aliases**: Create alternative names for tags

#### Using Tags Effectively
- **Projects**: Tag notes by project (`project-alpha`, `project-beta`)
- **Types**: Categorize by content type (`meeting`, `idea`, `task`)
- **Status**: Track progress (`draft`, `review`, `complete`)
- **Priority**: Mark importance (`urgent`, `important`, `low-priority`)


## Troubleshooting

### Common Issues

#### Links Not Working
- **Check Note ID**: Ensure you're using the correct note ID in `[[]]` brackets
- **Verify Note Exists**: Broken links appear differently - the target note may have been deleted
- **Auto-completion**: Use the auto-completion feature to avoid typos

#### Queries Not Updating
- **Syntax Check**: Verify your query syntax matches the examples
- **Field Names**: Ensure field names in `render.fields` are correct
- **Tag Names**: Check that tag names in queries match actual tags

#### Performance Issues
- **Large Notes**: Very large notes may load slowly
- **Complex Queries**: Queries with many results may take time to render
- **Many Links**: Notes with hundreds of links may affect performance

#### Saving Problems
- **Network Issues**: Check your connection to the server
- **Validation Errors**: Ensure titles are within length limits

