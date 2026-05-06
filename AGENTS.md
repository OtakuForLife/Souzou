# AGENTS.md

This document defines rules and workflows for automated agents working in this repository.

Agents must follow these guidelines when modifying the project.

Reference documents:
- `_docs/VISION.md`
- `_docs/REQUIREMENTS.md`

---

## 1. Purpose

Automated agents serve as intelligent assistants that help maintain and extend the Souzou platform. They operate within defined boundaries to ensure code quality, architectural integrity, and product alignment.

Agents may:

- Implement features aligned with the product vision of empowering users to create, grow, and evolve with clarity
- Refactor code to improve maintainability while preserving functionality
- Fix bugs while maintaining the minimalist, calming user experience
- Update documentation to reflect system changes and new capabilities
- Optimize performance for the Entity-based architecture
- Extend theming capabilities and customization options

---

## 2. Product Alignment

Agents must ensure changes align with the product vision defined in `_docs/VISION.md`. Souzou is designed as a life management platform that bridges the gap between simple and overwhelming PKM tools, providing powerful features in a minimalist interface.

Before implementing features:

- Confirm alignment with the core mission of helping users live and think more intentionally
- Ensure features support the "Everything is an Entity" paradigm
- Avoid features that add unnecessary complexity or clutter to the user interface
- Consider the impact on the calm, focused user experience
- Verify that new features integrate well with existing Entity types (Markdown Notes, Views)
- Maintain compatibility with the dashboard and widget system

---

## 3. Architecture Compliance

All changes must respect the architecture defined in `_docs/ARCHITECTURE.md`. Souzou follows a clear separation between frontend and backend with an Entity-centric data model.

Agents must:

- Follow the Entity abstraction pattern consistently across all features
- Maintain clear separation between the React frontend and Django backend
- Respect the REST API boundaries defined by Django REST Framework
- Preserve the Entity-inside-Entity hierarchy implementation
- Keep widget implementations modular and independent
- Follow established patterns for Markdown processing with CodeMirror
- Maintain PostgreSQL database schema integrity
- Ensure theme customizations remain isolated and non-invasive

---

## 4. Development Workflow

Standard workflow:

1. **Understand the relevant module** - Review existing code, understand Entity relationships, and study how the feature interacts with existing Views and Widgets
2. **Implement minimal necessary change** - Focus on the smallest change that delivers value while maintaining the calm, minimalist aesthetic
3. **Add or update tests** - Write Vitest tests for frontend, Pytest tests for backend
4. **Update documentation if needed** - Keep `_docs/VISION.md` and related docs current
5. **Verify theming compatibility** - Ensure changes work across different themes
6. **Test Entity interactions** - Confirm new features work with the Entity hierarchy system

---

## 5. Repository Structure

Key directories and their purposes:

```
/frontend          # React + Vite + TypeScript frontend application
  /src
    /components    # React components including Shadcn UI customizations
    /editor        # CodeMirror-based Markdown editor implementation
  /electron        # electron entrypoints

/backend           # Django backend application
  /api
	/tests         # Pytest test files
  /backend         # 

/_docs             # Project documentation
  /backend         # Backend documentation  
	  /api.md      # API documentation
	  /model.md    # database structure
  /VISION.md       # Product vision and goals
```

Frontend unit tests are located in a `__test__` subdirectory inside the same directory of the unit file.

---

## 6. Coding Standards

General rules:

- Write clear and maintainable code
- Avoid unnecessary complexity; prefer simple, elegant solutions if possible
- Follow project naming conventions consistently
- Document Entity relationships and hierarchies clearly
- Ensure code is accessible to contributors of varying experience levels
- Write self-documenting code with meaningful variable and function names
- Keep functions focused on a single responsibility

### Language-specific conventions:

**TypeScript/React (Frontend):**

- Use functional components with hooks
- Follow Shadcn UI component patterns
- Use Tailwind CSS for styling; avoid inline styles
- Implement proper TypeScript typing; avoid `any` when possible
- Use React context sparingly; prefer prop drilling for simple cases
- Follow the established Entity component patterns

**Python/Django (Backend):**

- Follow PEP 8 style guidelines
- Use Django REST Framework serializers for all API endpoints
- Implement proper model validation in Django models
- Use type hints for better code clarity
- Follow Django best practices for query optimization
- Keep views thin; move logic to services or models

---

## 7. Testing Requirements

Agents must ensure comprehensive test coverage to maintain the reliability users expect from a life management platform.

Agents must:

- Ensure all existing tests pass before submitting changes
- Add tests for new functionality, especially Entity operations
- Update tests when behavior changes
- Test theme compatibility for UI components
- Verify widget functionality in isolation and within Views

Test types:

- **Unit tests**: Test individual functions, components, and Entity operations
- **Integration tests**: Test API endpoints, Entity hierarchy operations, and View rendering
- **Component tests**: Test React components with Vitest
- **E2E tests**: Test critical user flows like note creation, linking, and dashboard customization

Testing commands:

```bash
# Frontend tests
cd frontend && npm run test

# Backend tests
cd backend && pytest
```

---

## 8. Dependency Management

Rules for dependencies:

- Avoid unnecessary dependencies; each addition should be justified
- Prefer existing libraries in the repository
- Document new dependencies in the relevant README or documentation
- Consider the impact on bundle size for frontend dependencies
- Ensure Python dependencies are added to requirements.txt with version pins
- Evaluate whether a dependency aligns with the minimalist philosophy

Current approved dependencies include core technologies listed in the tech stack. Any additions should enhance the Entity system, improve the editing experience, or support the platform's extensibility.

---

## 9. Documentation Requirements

Agents must update documentation when:

- APIs change or new endpoints are added
- Entity models or relationships are modified
- Configuration changes affect deployment or development
- Workflows change for users or developers
- New features are implemented that users need to understand
- Theme customization options are added or modified

Files commonly updated:

- `README.md` - Project overview and quick start
- `_docs/VISION.md` - Product vision and feature alignment
- `_docs/backend/api.md` for backend API documentation
- `_docs/backend/model.md` for backend model documentation
- Component documentation in the frontend

---

## 10. Allowed Changes

Agents may:

- Implement features defined in `_docs/VISION.md` that support the life management platform goals
- Improve internal code quality without changing external behavior
- Add tests to increase coverage and reliability
- Update documentation to improve clarity and completeness
- Enhance theme customization capabilities
- Improve the Markdown editor functionality
- Add new widget types that integrate with the View system
- Optimize Entity queries and operations

---

## 11. Restricted Changes

Agents must not:

- Introduce breaking API changes without explicit approval and documentation
- Modify security-critical components (authentication, authorization) without comprehensive tests
- Remove existing functionality without documentation and migration paths
- Add features that clutter the interface or conflict with the philosophy
- Change the core Entity abstraction without architectural review
- Introduce dependencies that significantly impact performance or security
- Change the fundamental user experience paradigm without vision alignment review

---

## 12. Performance Guidelines

Souzou should feel responsive and lightweight, supporting users in their daily workflows.

Agents should:

- Avoid inefficient algorithms, especially in Entity traversal and hierarchy operations
- Minimize unnecessary database queries; use Django's `select_related` and `prefetch_related`
- Implement proper pagination for lists of Entities
- Use caching when appropriate for theme data and frequently accessed Entities
- Optimize React rendering with proper memoization
- Keep bundle sizes small; code-split where appropriate
- Ensure the Markdown editor remains performant with large documents
- Monitor and optimize Widget rendering in complex Views

---

## 13. Security Requirements

As a platform for personal knowledge and life management, Souzou must protect user data.

Agents must:

- Validate all external inputs at API boundaries
- Never expose secrets, API keys, or sensitive configuration
- Follow secure coding practices for authentication and authorization
- Sanitize Markdown content to prevent XSS vulnerabilities
- Use parameterized queries to prevent SQL injection
- Follow Django security best practices
- Ensure theme customizations cannot execute arbitrary code

---

## 14. CI/CD Requirements

Before completing changes:

- Code must compile without errors (TypeScript for frontend, Python for backend)
- Tests must pass (Vitest for frontend, Pytest for backend)
- Linting must pass (ESLint for frontend, flake8/black for backend)
- Docker builds must succeed
- No regression in existing functionality

CI/CD Pipeline:

```bash
# Run all checks locally before pushing
npm run lint && npm run test     # Frontend
pytest && flake8                 # Backend
docker-compose build             # Docker build verification
```

---

## 15. Agent Execution Checklist

Before finalizing work, verify all items are complete:

- [ ] Implementation aligns with `_docs/VISION.md`
- [ ] Architecture boundaries respected (Entity system, frontend/backend separation)
- [ ] Tests added or updated (Vitest for frontend, Pytest for backend)
- [ ] Documentation updated (API changes, new features, configuration updates)
- [ ] No unnecessary dependencies added
- [ ] Changes maintain the user experience
- [ ] Entity hierarchy and relationships properly implemented
- [ ] Theme compatibility verified for UI changes
- [ ] Security considerations addressed
- [ ] Performance impact assessed for Entity operations
