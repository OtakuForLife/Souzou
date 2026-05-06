# AI Integration & Knowledge Graph Analysis Plan

## Executive Summary

This document outlines a comprehensive plan to integrate AI-powered features and Infranodus-style network analysis into Souzou. The goal is to transform Souzou from a personal knowledge management system into an intelligent knowledge companion that helps users discover insights, uncover connections, and think more intentionally about their knowledge.

---

## 1. Vision & Alignment

### 1.1 Product Vision Alignment

**Core Mission:** Empower users to live and think more intentionally through a comprehensive life management platform.

**How AI Integration Supports This:**
- **Discovery:** Help users discover connections they might miss
- **Insight Generation:** Surface patterns and themes across their knowledge base
- **Enhanced Recall:** Semantic search to find relevant notes beyond keyword matching
- **Conversation:** Natural language interface to query and interact with knowledge
- **Growth:** Suggest new directions and connections to explore

### 1.2 Design Philosophy Constraints

- **Simplicity First:** AI features must be optional, non-intrusive
- **User Sovereignty:** AI assists but never decides; users maintain full control
- **Privacy First:** All AI processing should ideally run locally or with explicit consent
- **Progressive Disclosure:** Basic PKM works without AI; AI enhances when activated
- **Minimal Dependency:** AI features should gracefully degrade if unavailable

---

## 2. Core Concepts

### 2.1 Infranodus-Style Analysis

Infranodus provides network text analysis that helps users understand:
- **Structure:** How concepts connect in a graph
- **Gaps:** Missing connections between related concepts
- **Communities:** Clusters of related content
- **Centrality:** Which notes/topics are most important
- **Evolution:** How the network changes over time

**Adaptation for Souzou:**
1. **Entity-First Graph:** Everything in Souzou is an Entity; the graph reflects the Entity structure
2. **Multi-Modal Relationships:** Capture links, hierarchy, tags, and semantic similarity
3. **Interactive Exploration:** Users can click, filter, and explore the graph
4. **Contextual Insights:** AI explains what the graph reveals about their knowledge

### 2.2 AI Integration Types

| Type | Purpose | Privacy | Complexity |
|------|---------|---------|------------|
| **Semantic Search** | Find relevant notes by meaning | High (embeddings local) | Low |
| **AI Chat Assistant** | Natural language queries | Medium (local or configured) | Medium |
| **Network Analysis** | Graph insights and pattern detection | High (local algorithms) | Medium |
| **Content Enhancement** | Summarization, tagging suggestions | Low (content sent to AI) | Low |
| **Connection Suggestion** | Recommend links between notes | Medium (embeddings local) | Medium |

---

## 3. Architecture Design

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Souzou Frontend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Markdown   │  │   Views &    │  │   AI Widget  │          │
│  │    Editor    │  │   Widgets    │  │   Component  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                │                │                    │
│         └────────────────┴────────────────┘                    │
│                          │                                     │
│                  ┌───────▼────────┐                            │
│                  │  Redux Store   │                            │
│                  │ (Entity State) │                            │
│                  └───────┬────────┘                            │
└──────────────────────────┼────────────────────────────────────┘
                           │
                           │ HTTP / WebSocket
                           │
┌──────────────────────────▼────────────────────────────────────┐
│                        Souzou Backend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Django     │  │  PostgreSQL  │  │  Celery      │          │
│  │    Views     │  │   Database   │  │  Workers     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                 │
│  ┌──────▼──────────────────▼──────┐         │                 │
│  │     Vector Service             │         │                 │
│  │  (Embeddings & Similarity)      │         │                 │
│  └──────┬──────────────────────────┘         │                 │
└─────────┼────────────────────────────────────┘
          │
          │ Configurable Provider
          │
    ┌─────▼──────────────────────┐
    │  AI/Embedding Provider      │
    │  (Ollama, OpenAI, Local)   │
    │  - User Configurable       │
    │  - Graceful Fallback       │
    └────────────────────────────┘
```

### 3.2 Data Flow

**Semantic Search Flow:**
```
1. User performs search query
   ↓
2. Query is embedded → vector
   ↓
3. Compare with stored embeddings (cosine similarity)
   ↓
4. Return most similar entities
   ↓
5. Display results with relevance scores
```

**AI Chat with Context Flow:**
```
1. User sends message to AI widget
   ↓
2. Vector Service finds semantically relevant notes
   ↓
3. Relevant notes formatted as context
   ↓
4. Context + user message sent to AI
   ↓
5. AI response displayed
   ↓
6. (Optional) Response saved to AI Chat History Entity
```

**Network Analysis Flow:**
```
1. User opens knowledge graph widget
   ↓
2. Frontend builds graph from Entity state
   ↓
3. Graph algorithms run (centrality, communities, gaps)
   ↓
4. Visualization rendered with Cytoscape
   ↓
5. User explores interactive graph
   ↓
6. AI can explain insights when requested
```

### 3.3 Entity Integration

**Existing Entity Types:**
- `NOTE` - Markdown notes
- `VIEW` - Dashboard views
- `MEDIA` - Uploaded files
- `TEMPLATE` - Note templates
- `AI_CHAT_HISTORY` - Stores AI conversations

**New Entity Fields (Already Exist):**
- `embedding` - JSON array of vector embeddings
- `embedding_model` - Which model generated the embedding
- `embedding_updated_at` - Timestamp for staleness tracking

**New Entity Relations:**
- AI Chat History Entity references the notes discussed
- Tags can be AI-suggested with confidence scores
- Links can be AI-suggested with similarity scores

---

## 4. Feature Specifications

### 4.1 Phase 1: Foundation (Weeks 1-4)

#### 4.1.1 Semantic Search Infrastructure
**Goal:** Enable meaning-based search across entities

**Components:**
- ✅ Vector Service (exists: `backend/api/services/vector_service.py`)
- ✅ Embedding fields on Entity model (exists)
- ✅ Celery tasks for batch embedding generation (exists)
- 🆕 Frontend semantic search UI component
- 🆕 Search results with relevance scores

**API Endpoints:**
```
POST /api/entities/semantic-search
  Body: { query: string, filters: {...}, limit: number }
  Response: { results: Entity[], scores: number[] }

GET /api/entities/{id}/embedding-status
  Response: { has_embedding: bool, is_stale: bool }

POST /api/embeddings/generate-batch
  Body: { entity_ids: string[] }
  Response: { task_id: string }
```

**UI Components:**
- Semantic search input field (extends existing search)
- Results panel with relevance indicators
- "Why this result?" explanation feature

**Success Criteria:**
- User can search by meaning, not just keywords
- Results ranked by semantic similarity
- Search works with 10,000+ entities

#### 4.1.2 Embedding Management
**Goal:** Efficiently maintain vector embeddings

**Features:**
- Lazy embedding generation (already implemented)
- Batch regeneration via Celery (already implemented)
- Stale embedding detection (already implemented)
- Progress tracking for batch operations

**Admin Features:**
- Embedding statistics dashboard
- Manual trigger for embedding updates
- Configuration of embedding model

---

### 4.2 Phase 2: AI Chat Assistant (Weeks 5-8)

#### 4.2.1 AI Widget Component
**Widget Type:** `AI_CHAT`

**Features:**
- Conversation interface with message history
- Context-aware responses (using semantic search)
- Configurable AI provider (Ollama, OpenAI, etc.)
- Auto-save to AI Chat History Entity
- Reference linking to mentioned notes

**Configuration:**
```typescript
{
  model: string;              // e.g., "llama2", "gpt-4"
  temperature: number;        // 0.0 - 2.0
  maxTokens: number;
  maxContextNotes: number;    // Notes to include as context
  showContextPreview: boolean;
  autoSaveChats: boolean;
  chatHistoryEntityId?: string;
  baseUrl?: string;          // Custom AI API endpoint
  apiKey?: string;           // Encrypted storage
}
```

**UI Layout:**
```
┌─────────────────────────────────┐
│  💬 Chat | 🔗 Graph | 📊 Insights│
├─────────────────────────────────┤
│  [Chat History Area]            │
│  • Message bubbles              │
│  • Referenced note previews     │
│  • Typing indicator             │
├─────────────────────────────────┤
│  [Input: Ask about your notes] │
│  [Send]                         │
│  Using 5 notes as context      │
└─────────────────────────────────┘
```

#### 4.2.2 Context Retrieval
**Goal:** Provide AI with relevant knowledge base context

**Process:**
1. Parse user message
2. Create embedding of message
3. Find top-k semantically similar notes
4. Format notes as context
5. Send context + message to AI
6. Display AI response with note references

**Context Format:**
```
Relevant context from your knowledge base:

Note: "Project Ideas"
This project aims to combine personal knowledge management...

Note: "AI Integration Research"
Exploring different approaches to integrating AI...

Note: "Network Analysis Basics"
Understanding graph theory concepts...
```

#### 4.2.3 Chat History Entity
**Entity Type:** `AI_CHAT_HISTORY`

**Content Structure:**
```json
{
  "conversation": [
    {
      "role": "user",
      "content": "What connections exist between my project notes?",
      "timestamp": "2026-04-15T10:30:00Z",
      "referencedEntities": ["uuid1", "uuid2"]
    },
    {
      "role": "assistant",
      "content": "Based on your notes, I found several connections...",
      "timestamp": "2026-04-15T10:30:05Z",
      "context": ["uuid1", "uuid2", "uuid3"]
    }
  ],
  "metadata": {
    "model": "llama2",
    "messageCount": 24,
    "lastMessage": "2026-04-15T10:30:05Z"
  }
}
```

**Features:**
- Conversations can be searched and linked
- Can be referenced in other notes
- Supports export/import
- Version history via sync system

---

### 4.3 Phase 3: Knowledge Graph & Network Analysis (Weeks 9-12)

#### 4.3.1 Enhanced Graph Widget
**Existing:** `GRAPH_WIDGET` already exists

**New Features:**
- Multiple relationship types (links, hierarchy, semantic similarity, AI suggestions)
- Node clustering by community detection
- Centrality-based node sizing
- Gap visualization (potential connections)
- Time-based filtering (evolution view)

**Node Data Enhancement:**
```typescript
{
  id: string;
  label: string;
  type: Entity.Type;
  centrality: number;        // Betweenness/degree centrality
  community: number;        // Community ID
  gapNode: boolean;         // Part of structural gap
  conceptCount: number;     // Extracted concept density
  lastModified: timestamp;
}
```

**Edge Types:**
```
- Markdown links (solid blue)
- Parent-child hierarchy (dashed green)
- Semantic similarity (dotted purple)
- AI-suggested connections (orange, dashed)
```

#### 4.3.2 Network Analysis Algorithms

**Algorithms to Implement:**

1. **Centrality Metrics**
   - Degree centrality (number of connections)
   - Betweenness centrality (bridge nodes)
   - PageRank (importance based on connections)

2. **Community Detection**
   - Label propagation (fast, simple)
   - Louvain method (higher quality)
   - Hierarchical clustering

3. **Structural Gap Detection**
   - Find nodes in same community but unconnected
   - Identify orphaned nodes
   - Find weak bridges between communities

4. **Concept Extraction**
   - Extract key terms from content
   - TF-IDF for importance scoring
   - N-phrase extraction for multi-word concepts

5. **Similarity Calculation**
   - Cosine similarity on embeddings
   - Jaccard similarity for tags
   - Content overlap analysis

#### 4.3.3 Insights Panel
**Tab:** "📊 Insights" in AI widget

**Metrics Displayed:**
```
┌─────────────────────────────────┐
│  📈 Network Overview            │
│  • Total Nodes: 247             │
│  • Total Edges: 512             │
│  • Avg Degree: 4.14             │
│  • Density: 1.7%                │
├─────────────────────────────────┤
│  🎯 Most Central Entities       │
│  1. Project Ideas (23 conn.)    │
│  2. Research Notes (18 conn.)   │
│  3. Daily Journal (15 conn.)     │
├─────────────────────────────────┤
│  👥 Topic Communities           │
│  📁 Community 0 (42 entities)   │
│  📁 Community 1 (28 entities)   │
├─────────────────────────────────┤
│  🔍 Structural Gaps             │
│  ⚠️ "Project Ideas" ↔ "Goals"   │
│     Similar content, unlinked    │
│  ⚠️ "Research" ↔ "Implementation"│
│     Likely related, no link     │
├─────────────────────────────────┤
│  💡 Top Concepts                │
│  #ai #project #knowledge #graph │
└─────────────────────────────────┘
```

**Interactive Features:**
- Click entity to open in sidebar
- Click gap to create suggested link
- Filter by community
- Export insights as markdown

#### 4.3.4 AI-Enhanced Explanations
**Feature:** Ask AI to explain the graph

**Examples:**
- "What does the gap between these nodes mean?"
- "Why is this note so central?"
- "What themes are in community 2?"
- "Suggest links to strengthen my network"

**AI Context:**
- Graph metrics and statistics
- Node/edge details
- Content from relevant entities
- User's stated goals/intentions

---

### 4.4 Phase 4: Advanced Features (Weeks 13-16)

#### 4.4.1 Connection Suggestions
**Goal:** Proactively suggest meaningful connections

**Triggers:**
- When saving a new note
- Periodic background analysis
- On-demand from insights panel

**Suggestion Types:**
- Semantic similarity above threshold
- Shared tags but no direct link
- References to same third-party notes
- AI-detected thematic overlap

**UI:**
```
┌─────────────────────────────────┐
│  💡 Suggested Connections       │
│                                 │
│  "Meeting Notes"               │
│    ──> "Project Goals"         │
│         Both discuss Q2 targets │
│         Confidence: 92%         │
│         [Link] [Dismiss]        │
└─────────────────────────────────┘
```

#### 4.4.2 Content Enhancement
**Optional AI features for content creation:**

1. **Auto-Tagging**
   - Extract relevant tags from content
   - Use semantic similarity to existing tags
   - Confidence scores for each suggestion

2. **Summary Generation**
   - Generate executive summaries
   - Extract key points from long notes
   - Create TL;DR versions

3. **Title Suggestions**
   - Suggest better titles based on content
   - Consistency with similar notes

4. **Related Notes Sidebar**
   - Show semantically similar notes
   - Update in real-time as user types

#### 4.4.3 Temporal Analysis
**Goal:** Track how knowledge network evolves

**Features:**
- Time slider for historical graph states
- Diff view showing connections added/removed
- Growth metrics over time
- Trend analysis for concepts

**Implementation:**
- Store graph snapshots (periodic)
- Use entity `updated_at` timestamps
- Animate transitions between states

---

## 5. Technical Implementation

### 5.1 Backend Components

#### 5.1.1 Vector Service (Exists)
**Location:** `backend/api/services/vector_service.py`

**Current Capabilities:**
- ✅ Generate embeddings using sentence-transformers
- ✅ Store embeddings in Entity model
- ✅ Find similar notes via cosine similarity
- ✅ Find relevant context for conversations

**Enhancements Needed:**
- Batch embedding optimization
- Cached embedding results
- Hybrid search (semantic + keyword)
- Model versioning

#### 5.1.2 Celery Tasks (Exist)
**Location:** `backend/api/tasks.py`

**Current Tasks:**
- ✅ `generate_embedding_for_entity`
- ✅ `generate_embeddings_batch`
- ✅ `regenerate_all_embeddings`
- ✅ `update_stale_embeddings`

**Additional Tasks:**
- `analyze_network_structure` - Run network analysis
- `detect_structural_gaps` - Find missing connections
- `extract_concepts_batch` - Process multiple entities
- `calculate_centrality` - Update centrality scores

#### 5.1.3 New API Endpoints

```python
# Network Analysis
POST /api/network/analyze
  Body: { entity_ids?: string[], filters?: {...} }
  Response: NetworkInsights

POST /api/network/detect-gaps
  Body: { threshold?: number, max_results?: number }
  Response: Gap[]

POST /api/network/find-communities
  Body: { algorithm: 'louvain' | 'label-prop' }
  Response: Community[]

# AI Chat
POST /api/ai/chat
  Body: { messages: Message[], context?: Entity[], config: ChatConfig }
  Response: { response: string, referenced: string[] }

POST /api/ai/suggest-connections
  Body: { entity_id: string, limit: number }
  Response: Suggestion[]

POST /api/ai/extract-concepts
  Body: { entity_id: string }
  Response: { concepts: Concept[] }

# Embedding Management
GET /api/embeddings/stats
  Response: EmbeddingStats

POST /api/embeddings/sync-model
  Body: { new_model: string }
  Response: { task_id: string }
```

### 5.2 Frontend Components

#### 5.2.1 AI Knowledge Widget
**Location:** `frontend/src/components/render/view/widgets/ai/AIKnowledgeWidget.tsx`

**Responsibilities:**
- Render chat interface
- Display knowledge graph with analysis
- Show network insights
- Handle user interactions

**Dependencies:**
- `ReactCytoscape` for graph visualization
- Entity store for data
- API service for AI calls
- Vector service for context retrieval

#### 5.2.2 Graph Analysis Utilities
**Location:** `frontend/src/utils/graphAnalysis.ts`

**Functions:**
```typescript
function calculateCentrality(nodes: Node[], edges: Edge[]): Map<string, number>;
function detectCommunities(nodes: Node[], edges: Edge[]): Map<string, number>;
function findStructuralGaps(nodes: Node[], edges: Edge[]): Gap[];
function calculateNetworkMetrics(nodes: Node[], edges: Edge[]): NetworkMetrics;
function extractConcepts(text: string): Concept[];
```

#### 5.2.3 AI Service
**Location:** `frontend/src/services/aiService.ts`

**Functions:**
```typescript
async function chatAI(config: AIConfig, messages: Message[]): Promise<Response>;
async function getContext(query: string, limit: number): Promise<Entity[]>;
async function suggestConnections(entityId: string): Promise<Suggestion[]>;
async function explainInsight(insight: Insight): Promise<string>;
```

### 5.3 Configuration Management

#### 5.3.1 AI Settings
**Storage:** User preferences in localStorage + Entity metadata

**Configurable Settings:**
```typescript
interface AISettings {
  // Provider
  provider: 'ollama' | 'openai' | 'anthropic' | 'local';
  baseUrl?: string;
  apiKey?: string;  // Encrypted

  // Model Settings
  chatModel: string;
  embeddingModel: string;
  temperature: number;
  maxTokens: number;

  // Context Settings
  maxContextNotes: number;
  contextThreshold: number;
  includeHierarchy: boolean;

  // Feature Flags
  enableAutoTagging: boolean;
  enableConnectionSuggestions: boolean;
  enableContentSummarization: boolean;

  // Privacy
  allowCloudAI: boolean;
  dataRetentionDays: number;
}
```

#### 5.3.2 Embedding Configuration
**Settings:**
- Model selection (`all-MiniLM-L6-v2` default)
- Batch size for generation
- Staleness threshold (hours)
- Auto-regenerate policy

---

## 6. Privacy & Security Considerations

### 6.1 Data Privacy

**Local-First Approach:**
- Embeddings generated and stored locally (PostgreSQL JSON)
- Vector similarity calculated server-side (self-hosted)
- AI provider configurable (Ollama recommended for privacy)

**When Cloud AI is Used:**
- Only relevant content sent (not entire database)
- Clear disclosure of what data is transmitted
- Opt-in consent required
- Data not stored by provider (when possible)

### 6.2 AI Provider Options

| Provider | Privacy | Cost | Quality | Setup |
|----------|---------|------|---------|-------|
| **Ollama (Local)** | ⭐⭐⭐⭐⭐ | Free | Good | Medium |
| **OpenAI** | ⭐⭐ | Paid | Excellent | Easy |
| **Anthropic** | ⭐⭐⭐ | Paid | Excellent | Easy |
| **LocalLM** | ⭐⭐⭐⭐⭐ | Free | Fair | Hard |
| **Together AI** | ⭐⭐⭐ | Paid | Good | Easy |

### 6.3 Security Measures

1. **API Key Storage**
   - Encrypt at rest
   - Never expose in client code
   - Rotate regularly

2. **Input Validation**
   - Sanitize all AI-generated content
   - Limit output length
   - Rate limiting

3. **Content Sanitization**
   - Sanitize markdown from AI
   - Prevent XSS injection
   - Validate suggested links

---

## 7. Performance Considerations

### 7.1 Scalability Targets

| Metric | Target | Approach |
|--------|--------|----------|
| Entity count | 100,000+ | Efficient similarity search |
| Embedding generation | 1000/minute | Batch processing with Celery |
| Search response | <200ms | Indexed vectors |
| Graph rendering | <500ms | Incremental loading |
| Chat response | <5s | Streaming responses |

### 7.2 Optimization Strategies

**Embedding Generation:**
- Batch processing (100 entities at a time)
- Queue-based with progress tracking
- Lazy generation on first access

**Vector Search:**
- Cosine similarity pre-computed where possible
- Cache frequent queries
- Hybrid search for better performance

**Graph Rendering:**
- Virtual scrolling for large graphs
- Progressive loading by depth
- LOD (Level of Detail) for zoom

**AI Chat:**
- Stream responses (show as they arrive)
- Pre-fetch context in background
- Cache common queries

### 7.3 Database Indexes

**Existing:**
- Entity type, parent, updated_at indexes

**New Indexes:**
```sql
-- For embedding-related queries
CREATE INDEX idx_entity_embedding_updated ON api_entity(embedding_updated_at);
CREATE INDEX idx_entity_has_embedding ON api_entity(id) WHERE embedding IS NOT NULL;

-- For tag-based similarity
CREATE INDEX idx_entity_tags ON api_entitytag(entity_id, tag_id);
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

**Backend:**
- Vector service embedding generation
- Similarity calculation accuracy
- Network analysis algorithms
- API endpoint responses
- Celery task execution

**Frontend:**
- Component rendering
- State management
- Graph analysis functions
- AI service integration

### 8.2 Integration Tests

- End-to-end semantic search flow
- AI chat with context retrieval
- Graph generation and rendering
- Suggestion generation
- Widget configuration persistence

### 8.3 Performance Tests

- Embedding batch generation speed
- Search response times at scale
- Graph rendering with 10,000 nodes
- Concurrent AI chat sessions

### 8.4 User Acceptance Testing

- AI accuracy and usefulness
- Graph insights relevance
- Connection suggestion quality
- Overall UX and discoverability

---

## 9. Documentation Requirements

### 9.1 User Documentation

**User Guide:**
- Setting up AI (Ollama, OpenAI, etc.)
- Using semantic search
- AI chat best practices
- Understanding network insights
- Interpreting structural gaps
- Privacy controls

**Tutorials:**
- "Getting started with AI in Souzou"
- "Exploring your knowledge graph"
- "Finding connections with AI help"

### 9.2 Developer Documentation

**API Documentation:**
- All new endpoints with examples
- Request/response schemas
- Error handling
- Rate limits

**Architecture Docs:**
- Vector service internals
- Network analysis algorithms
- Widget component patterns
- Integration points

### 9.3 Decision Records (ADRs)

**Key Decisions to Document:**
- Choice of embedding model
- AI provider architecture
- Privacy vs. functionality tradeoffs
- Graph algorithm selections
- Feature prioritization rationale

---

## 10. Dependencies & Risks

### 10.1 Technical Dependencies

**Backend:**
- `sentence-transformers` (already installed)
- `numpy` (already installed)
- `celery` (already installed)
- `cytoscape.js` (frontend, already used)

**AI Providers:**
- Ollama (optional, local)
- OpenAI API (optional)
- Anthropic API (optional)

### 10.2 Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| AI provider downtime | High | Medium | Multiple providers, graceful fallback |
| Embedding generation slow | Medium | High | Async processing, progress indicators |
| Low-quality suggestions | Medium | Medium | User feedback loop, confidence thresholds |
| Privacy concerns | High | Low | Local-first, clear consent |
| Performance degradation | High | Medium | Caching, lazy loading, pagination |
| Large model storage | Medium | High | Configurable models, model swapping |

### 10.3 Contingency Plans

**If AI provider is unavailable:**
- Show helpful error message
- Fall back to keyword search
- Disable AI features gracefully
- Maintain graph visualization (local algorithms)

**If embeddings are slow to generate:**
- Show progress indicator
- Allow user to cancel
- Process in background
- Prioritize recent entities

---

## 11. Success Metrics

### 11.1 Adoption Metrics

- Percentage of users enabling AI features
- Frequency of semantic searches vs keyword
- Number of AI conversations per week
- Graph widget usage rate

### 11.2 Quality Metrics

- AI suggestion acceptance rate
- User satisfaction with AI responses
- Relevant context retrieval accuracy
- Useful connections found rate

### 11.3 Performance Metrics

- Average search response time
- Embedding generation throughput
- Graph render time (90th percentile)
- AI chat response time

### 11.4 Impact Metrics

- Notes discovered through semantic search
- Connections created from suggestions
- Time saved in finding relevant information
- User-reported "insights gained"

---

## 12. Future Enhancements (Post-MVP)

### 12.1 Advanced AI Features
- Multi-modal AI (image/text understanding)
- Voice input for AI chat
- AI-generated summaries for Views
- Personalized AI fine-tuning on user's notes

### 12.2 Collaboration Features
- Shared knowledge graphs
- Collaborative AI chats
- Team-wide connection suggestions
- Network comparison between users

### 12.3 Enhanced Visualizations
- 3D graph visualization
- Timeline view of network evolution
- Geospatial mapping of ideas
- Concept clustering visualization

### 12.4 Integration Ecosystem
- Browser extension for web clipping
- Mobile app for on-the-go access
- Calendar integration for temporal analysis
- Email integration for inbox processing

---

## 13. Implementation Timeline

### Phase 1: Foundation (Weeks 1-4)
- Week 1: Semantic search API + UI
- Week 2: Embedding management dashboard
- Week 3: Testing and optimization
- Week 4: Documentation and refinement

### Phase 2: AI Chat (Weeks 5-8)
- Week 5: AI widget component
- Week 6: Context retrieval integration
- Week 7: Chat history entity implementation
- Week 8: Testing and UX refinement

### Phase 3: Knowledge Graph (Weeks 9-12)
- Week 9: Enhanced graph widget
- Week 10: Network analysis algorithms
- Week 11: Insights panel
- Week 12: AI explanations integration

### Phase 4: Advanced Features (Weeks 13-16)
- Week 13: Connection suggestions
- Week 14: Content enhancement features
- Week 15: Temporal analysis
- Week 16: Final testing, docs, launch

---

## 14. Conclusion

This plan outlines a comprehensive, phased approach to integrating AI capabilities and Infranodus-style network analysis into Souzou. The design respects Souzou's core principles of simplicity, user sovereignty, and calm focus while adding powerful new capabilities for knowledge discovery and insight generation.

**Key Principles:**
- Privacy-first with optional local processing
- Progressive disclosure of advanced features
- AI as an assistant, not a replacement
- Seamless integration with existing Entity model
- Graceful degradation when AI is unavailable

The implementation leverages existing infrastructure (Vector Service, Celery, Cytoscape) and extends it in a modular, maintainable way. Each phase delivers value independently while building toward a comprehensive AI-enhanced knowledge management experience.

---

## Appendix: Quick Reference

### Entity Types
- `NOTE` - Standard markdown notes
- `VIEW` - Dashboard with widgets
- `AI_CHAT_HISTORY` - Stores AI conversations

### Widget Types
- `GRAPH` - Knowledge graph visualization
- `AI_CHAT` - AI chat assistant widget
- `NOTE` - Embedded note display

### Key Services
- `VectorService` - Embeddings and similarity
- `AIChatService` - Conversation management
- `GraphAnalysis` - Network metrics and insights

### Main Files
- `backend/api/services/vector_service.py` - Vector operations
- `backend/api/tasks.py` - Background tasks
- `frontend/src/components/render/view/widgets/ai/AIKnowledgeWidget.tsx` - AI widget
- `frontend/src/services/aiService.ts` - AI API client
