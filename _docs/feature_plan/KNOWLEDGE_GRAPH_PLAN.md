# KNOWLEDGE GRAPH IMPLEMENTATION PLAN

---

# 1. SYSTEM GOAL

Build a knowledge graph system on top of an entity-based note platform where:

### Core principles

- UX is instant (client-owned parsing + rendering)
- Graph is globally consistent (server-owned persistence)
- Meaning evolves over time (inference layer)

---

# 2. GRAPH LAYERS

You now have **three explicit graph layers**:

---

## 2.1 Structural Graph (SERVER AUTHORITY)

```text
Entity.parent → Entity.child
```

### Purpose

- Hierarchy
    
- Organization
    
- Navigation tree
    

### Source

- Direct user assignment
    
- Fully persisted
    

---

## 2.2 Associative Graph (WIKILINKS → EXPLICIT EDGES)

```text
Entity (note) → Entity (linked entity)
```

### Source

- Client parses `[[...]]`
    
- Client resolves entity IDs
    
- Server persists as explicit edges
    

### Stored as:

```python
EntityEdge(
    type="wikilink",
    source="explicit"
)
```

---

## 2.3 Semantic Graph (INFERRED)

```text
Entity ↔ Entity (conceptual relationships)
```

### Source

- server-side NLP
    
- embeddings
    
- mention extraction
    

### Stored as:

```python
EntityEdge(
    type="inferred",
    source="ai"
)
```

---

# 3. DATA MODEL (FINAL v1)

---

## 3.1 EntityEdge (NEW CORE MODEL)

```python
class EntityEdge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    from_entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name="out_edges")
    to_entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name="in_edges")

    type = models.CharField(max_length=50)
    source = models.CharField(max_length=20)  # explicit | ai

    confidence = models.FloatField(default=1.0)

    created_at = models.DateTimeField(auto_now_add=True)
```

---

## 3.2 Entity (existing, unchanged except concept type)

Add:

```python
CONCEPT = "concept"
```

---

## 3.3 Keep existing:

- Entity
    
- Tag
    
- Parent-child field
    

No breaking changes required.

---

# 4. CLIENT ARCHITECTURE (CRITICAL FOR UX)

---

## 4.1 Wikilink parsing (CodeMirror plugin)

### Responsibility

- Detect `[[Text]]`
    
- Resolve entity ID
    
- Render inline
    

### Output (NOT persisted):

```json
{
  "wikilinks": [
    {
      "text": "Postgres",
      "to_entity_id": "uuid"
    }
  ]
}
```

---

## 4.2 Rendering pipeline

On typing:

1. Parse markdown
    
2. Detect wikilinks
    
3. Resolve entity IDs (cache-first)
    
4. Render immediately
    

NO server roundtrip required for display.

---

## 4.3 Optimistic UX rule

Client ALWAYS assumes:

- link is valid
    
- entity exists or is creatable
    

---

# 5. SERVER API DESIGN

---

## 5.1 Save entity endpoint

```http
POST /api/entity/update
```

### Payload:

```json
{
  "entity_id": "...",
  "content": "...",
  "wikilinks": [
    { "to_entity_id": "..." }
  ]
}
```

---

## 5.2 Server behavior

### Step 1: Save entity content

---

### Step 2: Replace wikilink edges

```python
EntityEdge.objects.filter(
    from_entity_id=entity_id,
    type="wikilink",
    source="explicit"
).delete()
```

---

### Step 3: Insert new edges

```python
for link in wikilinks:
    EntityEdge.objects.create(
        from_entity_id=entity_id,
        to_entity_id=link["to_entity_id"],
        type="wikilink",
        source="explicit",
        confidence=1.0
    )
```

---

### Step 4: trigger async processing

- mention extraction
    
- concept linking
    
- embedding updates
    

---

# 6. BACKEND PROCESSING PIPELINE

---

## 6.1 Entity update trigger

```text
Entity updated → queue job
```

---

## 6.2 Mention extraction

### Input:

Entity.content

### Output:

Mention records (ephemeral semantic units)

---

## 6.3 Concept resolution

- map mentions → concepts (Entity(type=CONCEPT))
    
- create or reuse concepts
    

---

## 6.4 Inferred edges

```text
Concept ↔ Concept relationships
Entity ↔ Concept relationships
```

---

# 7. QUERY SYSTEM

---

## 7.1 Backlinks (IMPORTANT FEATURE)

To find all incoming links:

```python
EntityEdge.objects.filter(to_entity_id=entity_id)
```

Includes:

- wikilinks (explicit)
    
- inferred edges
    
- structural edges (optional separate query)
    

---

## 7.2 Related entities

Weighted combination:

- explicit links (high weight)
    
- inferred links (medium weight)
    
- structural proximity (low weight)
    

---

# 8. UX DESIGN RULES

---

## 8.1 Wikilinks (client-side only behavior)

- instant highlight
    
- hover preview
    
- click navigation
    
- no loading delay
    

---

## 8.2 Graph view

Edge styling:

|Type|Visual|
|---|---|
|parent-child|solid bold|
|wikilink|solid normal|
|inferred|dashed|

---

## 8.3 No user friction rule

Never ask user:

- “confirm link”
    
- “resolve entity”
    

Everything is automatic.

---

# 9. CRITICAL SYSTEM RULES

---

## 9.1 Wikilinks rule

> Wikilinks are ALWAYS converted into explicit edges on save

They are NOT:

- inferred
    
- optional
    
- temporary in backend
    

---

## 9.2 Graph truth rule

Server graph = source of truth for:

- all edges
    
- all relationships
    
- all queries
    

Client graph = ephemeral view only

---

## 9.3 Inference rule

AI NEVER modifies:

- explicit wikilinks
    
- parent-child relations
    

It only adds:

- inferred edges
    
- concepts
    

---

# 10. PERFORMANCE STRATEGY

---

## 10.1 Client performance

- zero server calls for rendering links
    
- local cache for entity resolution
    
- instant UI updates
    

---

## 10.2 Server performance

- async processing pipeline
    
- batch edge replacement
    
- indexed EntityEdge table
    

---

# 11. WHY THIS DESIGN WORKS

---

## 11.1 UX-first

- wikilinks are instant
    
- no latency in writing flow
    

---

## 11.2 Graph correctness

- all links are persisted
    
- full queryability
    

---

## 11.3 Clean separation

- client = perception layer
    
- server = truth layer
    
- AI = inference layer
    

---

## 11.4 No semantic pollution

- UI constructs never contaminate inference
    
- inference never overwrites user intent
    

---

# 12. FINAL SYSTEM SUMMARY

```text
CLIENT
  - parses wikilinks
  - renders instantly
  - sends resolved edges

SERVER
  - stores entities
  - persists wikilink edges (explicit)
  - maintains parent-child graph
  - computes inferred graph

AI LAYER
  - builds concepts
  - generates inferred relationships
```

---

# FINAL TAKEAWAY

> Wikilinks are a client-side parsing mechanism, but their meaning is a **first-class persistent graph edge in the server**, forming the explicit associative layer of your knowledge graph.

---

If you want next, I can turn this into:

- a production-ready Django app structure (files, services, tasks)
    
- or a sync protocol spec (how client diffing + edge reconciliation works efficiently)