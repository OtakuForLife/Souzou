# KNOWLEDGE_GRAPH.md

## 1. Overview

This document describes the architecture, data model, processing pipeline, and user experience for a knowledge graph system built on top of a personal note-taking / second-brain application.

The system is designed around the following principles:

* **Low-friction capture**: Users write notes without structural constraints
* **Post-hoc structuring**: Knowledge structure is derived asynchronously
* **Ambiguity tolerance**: Duplicate or inconsistent entities are allowed
* **Progressive resolution**: Entity normalization improves over time
* **Rebuildability**: All derived data can be recomputed

---

## 2. Core Architectural Concepts

### 2.1 Dual-Layer Graph

The system maintains two graph layers:

#### Layer 1: Mention Graph (L1)

* Immediate
* Derived directly from notes
* No deduplication
* Always consistent with source data
* Used for most queries

#### Layer 2: Canonical Graph (L2)

* Derived from mention graph
* Deduplicated and normalized
* Built asynchronously
* Used for higher-level reasoning

---

### 2.2 Data Flow

```
Notes → Change Events → Extraction → Mentions → Mention Graph
                                      ↓
                                Enrichment
                                      ↓
                           Entity Resolution
                                      ↓
                            Canonical Graph
```

---

## 3. Data Model

### 3.1 Notes

```sql
notes (
  id UUID PRIMARY KEY,
  content TEXT,
  version INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

### 3.2 Change Tracking

```sql
note_changes (
  id BIGSERIAL PRIMARY KEY,
  note_id UUID,
  version INT,
  operation TEXT, -- insert/update/delete
  created_at TIMESTAMP DEFAULT now(),
  processed BOOLEAN DEFAULT FALSE
)
```

---

### 3.3 Mentions (Core Primitive)

```sql
mentions (
  id UUID PRIMARY KEY,
  note_id UUID,
  surface_form TEXT,
  normalized_form TEXT,
  position INT,
  embedding VECTOR,
  created_at TIMESTAMP
)
```

**Notes:**
* Represents raw extracted entities from text
* No guarantee of uniqueness
* Multiple mentions may refer to the same real-world entity

---

### 3.4 Mention Edges (L1 Graph)

```sql
mention_edges (
  id UUID PRIMARY KEY,
  from_mention_id UUID,
  to_mention_id UUID,
  type TEXT,
  weight FLOAT,
  created_at TIMESTAMP
)
```

**Purpose:**

* Captures relationships as extracted
* Forms the primary graph for navigation

---

### 3.5 Canonical Entities (L2 Graph)

```sql
canonical_entities (
  id UUID PRIMARY KEY,
  canonical_name TEXT,
  type TEXT,
  embedding VECTOR,
  created_at TIMESTAMP
)
```

---

### 3.6 Entity Links (Mention → Entity Mapping)

```sql
entity_links (
  mention_id UUID,
  entity_id UUID,
  confidence FLOAT,
  is_primary BOOLEAN,
  created_at TIMESTAMP
)
```

**Important:**

* Many-to-many relationship
* Supports ambiguity
* Confidence-driven

---

### 3.7 Canonical Edges (Optional)

```sql
entity_edges (
  from_entity_id UUID,
  to_entity_id UUID,
  type TEXT,
  weight FLOAT
)
```

Derived from mention edges and entity links.

---

### 3.8 Entity Aliases

```sql
entity_aliases (
  entity_id UUID,
  alias TEXT
)
```

---

## 4. Processing Pipeline

### 4.1 Change Capture

Trigger or CDC system writes to `note_changes`.

---

### 4.2 Worker Model

Workers:

* Poll `note_changes`
* Use `FOR UPDATE SKIP LOCKED`
* Process in batches

---

### 4.3 Extraction Stage (Fast, Synchronous-ish)

For each note:
1. Parse content
2. Extract mentions
3. Extract relationships between mentions
4. Insert into:

   * `mentions`
   * `mention_edges`

**Constraints:**
* Must be fast
* No deduplication
* Idempotent (delete + reinsert per note)

---

### 4.4 Enrichment Stage (Async)

#### A. Normalization
* Lowercasing
* Punctuation stripping
* Basic cleanup

#### B. Embedding Generation
* Compute vector embeddings for mentions

#### C. Candidate Generation
* Find similar canonical entities
* Store potential matches

---

### 4.5 Entity Resolution Stage

For each mention:
1. Retrieve candidate entities via:
   * String similarity
   * Embedding similarity
2. Apply type filtering
3. Score candidates
4. Insert/update `entity_links`

Rules:
* Allow multiple candidates
* Assign confidence scores
* Mark best candidate as `is_primary`

---

### 4.6 Consolidation Jobs

Periodic background jobs:
* Merge duplicate canonical entities
* Update aliases
* Recompute embeddings
* Rebuild `entity_edges`

---

### 4.7 Reprocessing

System must support full rebuild:

```sql
UPDATE note_changes SET processed = FALSE;
```

---

## 5. Identity Resolution Strategy

### 5.1 Multi-Stage Matching

1. Normalization
2. String similarity (trigram, Levenshtein)
3. Embedding similarity
4. Type constraints
5. Confidence scoring

---

### 5.2 Confidence Model

Example:

```
score = w1 * string_similarity
      + w2 * embedding_similarity
      + w3 * contextual_overlap
```

---

### 5.3 Merge Policy

Merge entities only when:

* Confidence exceeds threshold OR
* User explicitly confirms

---

## 6. Query Layer

### 6.1 Note View

Primary UI surface.

Includes:

* Highlighted mentions
* Backlinks (via mention_edges)
* Related notes

---

### 6.2 Related Notes

Computed using:

* Graph proximity (mention graph)
* Embedding similarity
* Recency weighting

---

### 6.3 Entity View

Displays:

* Linked mentions
* Source notes
* Related entities
* Duplicate suggestions

---

### 6.4 Graph View

Constraints:

* Local only (1–2 hops)
* User-focused context
* Avoid global graph rendering

---

## 7. UX Design Principles

### 7.1 No Interruption During Writing

* No forced entity linking
* No validation prompts
* No schema requirements

---

### 7.2 Progressive Disclosure

* Show structure only when useful
* Reveal ambiguity, don’t hide it

---

### 7.3 Ambiguity Handling

UI should:

* Show multiple candidate entities
* Allow merge / ignore / defer
* Avoid forced decisions

---

### 7.4 Assistive Features

* Link suggestions (non-blocking)
* Related notes panel
* Backlinks with context
* “You’ve seen this before” signals

---

### 7.5 Maintenance UX

Provide optional tools:

* Duplicate detection view
* Entity merge interface
* Alias management

---

## 8. Performance & Indexing

### 8.1 Critical Indexes

```sql
CREATE INDEX ON mentions(note_id);
CREATE INDEX ON mentions(normalized_form);
CREATE INDEX ON entity_links(mention_id);
CREATE INDEX ON entity_links(entity_id);
CREATE INDEX ON mention_edges(from_mention_id);
CREATE INDEX ON mention_edges(to_mention_id);
```

---

### 8.2 Scaling Characteristics

* Write-heavy (append-oriented)
* Async processing reduces contention
* Suitable for moderate graph sizes

---

## 9. System Properties

### 9.1 Idempotency

All processing must be repeatable:

* Delete + reinsert per note
* No partial updates

---

### 9.2 Event-Driven

* Changes processed via queue/log
* No synchronous dependency on extraction

---

### 9.3 Eventually Consistent

* Graph may lag behind notes
* UI should reflect freshness

---

### 9.4 Rebuildable

* Entire graph derivable from notes
* No hidden state

---

## 10. Implementation Phases

### Phase 1 (MVP)

* Notes
* Mentions
* Mention edges
* Basic extraction
* Backlinks

### Phase 2

* Embeddings
* Related notes
* Candidate entities

### Phase 3

* Entity resolution
* Canonical entities
* Merge tools

### Phase 4

* Advanced ranking
* Temporal features
* Graph analytics

---

## 11. Key Tradeoffs

| Dimension     | Choice                           |
| ------------- | -------------------------------- |
| Consistency   | Eventual                         |
| Structure     | Emergent                         |
| Deduplication | Deferred                         |
| Complexity    | Backend > UI                     |
| UX Priority   | Writing flow > graph correctness |

---

## 12. Summary

This system treats the knowledge graph as:

* A **derived, evolving structure**
* Built from **messy real-world input**
* Optimized for **recall and exploration**, not perfection

The core idea:

> Capture first, structure later, resolve gradually.

This ensures the system remains usable, scalable, and aligned with how humans actually think and write.
