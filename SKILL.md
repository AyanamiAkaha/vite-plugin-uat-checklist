---
name: uat-checklist
description: "Use this skill whenever the user wants to create, update, or generate a UAT (User Acceptance Testing) checklist for a web application. Trigger when the user mentions 'UAT', 'acceptance testing', 'QA checklist', 'test checklist', 'release checklist', or asks to generate a list of things to manually verify before a release. Also trigger when the user describes features and wants them turned into testable items, or when they ask to update an existing uat-checklist.yaml file. This skill produces YAML files compatible with @akaha/vite-plugin-uat-checklist. Even if the user doesn't mention the plugin by name, use this skill whenever the output is a UAT or QA checklist for a web app — the YAML format is useful standalone too."
---

# UAT Checklist Generator

Generate structured UAT checklists as YAML files compatible with `@akaha/vite-plugin-uat-checklist`. The plugin renders checklists as an overlay panel in Vite dev mode, so items should be concrete, manually verifiable, and tied to specific routes where possible.

## Output format

Always produce a file named `uat-checklist.yaml` (or the filename the user specifies) with this structure:

```yaml
release: "1.0.0"
title: "App Name UAT"

sections:
  - name: Section Name
    items:
      - text: A single testable assertion
        route: /relevant-route
        notes: Optional extra context for the tester
```

### Field rules

- **release** — the version being tested. Ask the user if not obvious. Defaults to `"0.1.0"`.
- **title** — short name for the checklist. Derive from project name or ask.
- **sections** — group items by feature area, page, or domain concept. Use 3–8 sections for a typical app. Don't create sections with only one item — merge small sections together.
- **text** — a single, specific, pass/fail assertion. Write from the tester's perspective: "X happens when I do Y." Avoid vague items like "Dashboard works" — instead write "Dashboard loads within 3 seconds and shows at least one chart."
- **route** — the app route where this item is tested. Always include when the route is known or inferrable. Use the path only (e.g., `/admin/users`), not the full URL.
- **notes** — optional. Use for edge cases, prerequisites ("requires admin role"), or specific data to use ("try with email longer than 255 chars").

## Writing good checklist items

Each item should be:

1. **Specific** — one thing to verify, not a category
2. **Observable** — the tester can see the result (UI change, redirect, message, network response)
3. **Independent** — ideally testable without completing other items first (note prerequisites in `notes` if unavoidable)
4. **Concise** — one sentence, under 80 characters when possible

Bad: `Login works`
Good: `Login with valid credentials redirects to /dashboard`

Bad: `Check error handling`
Good: `Submitting empty form shows validation errors on all required fields`

Bad: `API responses are correct`
Good: `User list endpoint returns paginated results matching the UI count`

## Generating from source code or descriptions

When the user provides source code (Vue components, Scala routes, API definitions), extract testable behavior:

- **Vue components / pages** → derive routes from vue-router config, identify user interactions (forms, buttons, modals), check loading/empty/error states
- **Scala backend routes** → identify endpoints, map to frontend pages, consider auth requirements and error responses
- **Feature descriptions** → break each feature into 2–5 specific verifiable items

When generating from code, ask the user to confirm the checklist before saving — generated items may reference internal implementation details that don't match the user-facing behavior.

## Updating an existing checklist

When the user has an existing `uat-checklist.yaml`:

1. Read the file first
2. Preserve the existing structure, section names, and items
3. Add new items to existing sections where they fit, or create new sections
4. Bump the `release` field if the user mentions a new version
5. Never remove items without the user asking — they may represent regression tests

## Section ordering convention

Order sections by user flow when possible:

1. Authentication / onboarding
2. Core features (in order of importance or typical usage)
3. Admin / settings
4. Error handling / edge cases
5. Cross-cutting concerns (accessibility, performance, responsive)

This ordering matches how most manual UAT sessions naturally proceed.
