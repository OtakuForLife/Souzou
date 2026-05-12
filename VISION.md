# Product Vision

## 1. Overview

**Project name:** Souzou

**Repository:** souzou

**Maintainers:** Open Source Community

Souzou, meaning "creation" or "imagination" in Japanese, is an open-source personal knowledge management (PKM) and life management platform designed to empower users to create, grow, and evolve with clarity. Unlike other PKM tools that are either too simple, overwhelming, or proprietary, Souzou gives you a space to work without leaving the system. It serves as more than a "second brain" — it is a comprehensive life management platform built to help users live and think more intentionally.

The platform centers around a unique "Everything is an Entity" paradigm, where all content — from simple notes to complex dashboards — exists as interconnected entities within a hierarchical structure. This approach allows for unprecedented flexibility while maintaining a familiar, intuitive user experience.

---

## 2. Problem Statement

### What problem exists?

Current personal knowledge management tools suffer from several critical limitations:


1. **Closed Source Limitations**: The majority of powerful PKM solutions are proprietary, closed-source products that lock users into specific ecosystems, limit customization options, and create concerns about data ownership and long-term accessibility.

2. **Fragmentation of Tools**: Users often need multiple disconnected tools for different aspects of life management — one for notes, another for tasks, a separate calendar application, and yet another for project tracking. This fragmentation creates cognitive overhead and makes it difficult to see the connections between different areas of life.


### Why is it important?

Effective knowledge and life management directly impacts personal growth, productivity, and well-being. When tools fail to support users effectively, the consequences include:

- Lost ideas and forgotten insights due to poor organization
- Increased stress from managing multiple disconnected systems
- Reduced creative output from friction in the capture and development process
- Limited personal growth due to lack of integrated reflection tools
- Dependency on proprietary platforms with uncertain futures

---


## 3. Product Vision

Souzou envisions becoming the definitive open-source platform for intentional life management — a space where users don't just store information, but actively engage with their knowledge to foster personal growth and creative development.

The platform should feel less like a tool and more like a thinking partner that grows alongside its users. It should be powerful enough to handle complex knowledge architectures while remaining simple enough that new users can be productive within minutes of their first use.

### Key Goals

1. **Empower Creation**: Remove friction from the creative process by providing intuitive tools for capturing, connecting, and developing ideas. Users should feel that Souzou enhances their natural thinking processes rather than constraining them.

2. **Support Growth**: Provide structure for reflection, goal-setting, and progress tracking without imposing rigid methodologies. Users should be able to adapt the platform to their personal growth journey.

3. **Enable Evolution**: Create a living system where knowledge and workflows can evolve naturally over time. The platform should support users through different phases of life and work without requiring painful migrations or reorganizations.

4. **Ensure Accessibility**: Maintain open source values, ensuring the platform remains free, transparent, and community-driven. Users should have complete control over their data and the ability to customize or extend the platform as needed.

---

## 4. Product Principles


### Reliability

Users trust Souzou with their most valuable thoughts and life management systems. The platform must be dependable, with robust data integrity, consistent behavior, and predictable performance. Open source transparency ensures users can verify this reliability themselves.

### Extensibility

While maintaining simplicity at its core, Souzou should be infinitely extensible through its Entity system, theming capabilities, and widget architecture. Users should be able to craft personalized workflows and views without requiring development skills, while developers can extend functionality through well-defined interfaces.

### Performance

A life management platform should feel instantaneous. Every interaction — from creating a note to navigating complex entity hierarchies — should be responsive and fluid. Performance is not a technical consideration but a user experience imperative.

### User Sovereignty

Users own their data and their experience. The platform provides powerful defaults but never locks users into specific methodologies or workflows. Open source guarantees that users always have the freedom to adapt, extend, or migrate their knowledge base.

### Principles Summary

1. **Reliability Always**: Robust data integrity and consistent, predictable behavior users can depend on
2. **Extensibility Throughout**: Flexible Entity system, custom themes, and modular widgets for personalization
3. **Performance in Every Interaction**: Instantaneous response times for a fluid, uninterrupted thinking experience

---

## 5. Core Capabilities

The system must provide the following fundamental capabilities:

- **Entity-Centric Data Model**: A unified abstraction where everything in the system — notes, views, widgets, tags — is an Entity with consistent behaviors for creation, linking, hierarchy, and search

- **Advanced Markdown Editing**: A full-featured Markdown editor with real-time preview, syntax highlighting, and seamless entity linking and tagging capabilities powered by CodeMirror

- **Entity Hierarchy Management**: Support for nesting entities within entities to any depth, enabling complex organizational structures while maintaining intuitive navigation

- **Custom Theme Engine**: A sophisticated theming system that allows users to create, share, and switch between visual themes, supporting both light and dark modes with extensive customization options

- **Dynamic View System**: Customizable dashboards composed of widgets that can display and interact with entity data in various formats, from simple note widgets to complex graph visualizations

- **Inter-Entity Linking**: Rich linking capabilities that connect entities across the hierarchy, with bi-directional references and graph visualization of relationships

- **Tag-Based Organization**: Flexible tagging system that works alongside hierarchy and linking for multiple organization paradigms

- **Search and Discovery**: Fast, comprehensive search across all entities with support for filtering by type, tags, and relationships

---

## 6. Feature Overview

### Core Entity System

- **Universal Entity Abstraction**: Consistent interface for all content types regardless of their specific nature
- **Entity Type System**: Two primary types — Markdown Notes and Views — with extensible architecture for future types
- **Hierarchical Organization**: Unlimited nesting depth with intuitive parent-child navigation
- **Entity Metadata**: Rich metadata support including creation dates, modification tracking, tags, and custom properties

### Markdown Notes

- **CodeMirror Integration**: Professional-grade text editing with syntax highlighting and auto-completion
- **Wiki-Style Linking**: Simple syntax for creating links between notes with automatic backlink generation
- **Tag Integration**: Inline tagging that integrates with the global tag system
- **Embed Support**: Ability to embed content from other entities within notes

### Views and Dashboards

- **Custom View Creation**: Build personalized dashboards for different workflows and contexts
- **Widget Library**: Pre-built widgets including Graph Widget for relationship visualization and Note Widget for content display
- **Layout Flexibility**: Arrange widgets freely to create optimal information layouts
- **View Templates**: Save and share view configurations for common use cases

### Theming and Customization

- **Visual Theme Engine**: Create custom color schemes, typography settings, and layout preferences
- **Theme Sharing**: Export and import themes for community sharing
- **Real-Time Preview**: See theme changes instantly before applying
- **System Integration**: Automatic detection of system light/dark mode preferences

---

## 7. Constraints

### Technology Constraints

- The frontend must be built with React, TypeScript, Vite, and Tailwind CSS to ensure maintainability and community support
- The backend must use Python with Django and Django REST Framework for mature, well-documented server-side capabilities
- PostgreSQL must be the primary database for its reliability, extensibility, and JSON support for flexible entity storage
- The system must remain deployable via Docker and Docker Compose for simplified self-hosting

### Design Constraints

- The interface must maintain a minimalist aesthetic regardless of feature additions
- Feature complexity must be layered, with simple workflows available by default
- The core Entity abstraction must remain consistent across all future development
- Breaking changes to user data structures require migration paths and clear documentation

### Operational Constraints

- The project must remain open source with a permissive license
- Community contributions must be welcomed and supported through clear documentation
- Self-hosting must be a first-class deployment option with complete documentation

### Resource Constraints

- Initial development is community-driven, requiring careful prioritization of features
- Documentation must be maintained alongside code to support contributor onboarding
- Dependencies should be minimized to reduce maintenance burden and security surface area
