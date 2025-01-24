# Contributing to Embedded Finance Components

Please read our [organization-wide contribution guidelines](https://github.com/jpmorganchase/.github/blob/main/CONTRIBUTING.md) first.

## Project Structure

```
embedded-components/ 
├── src/ # Source code 
├── .storybook/ # Storybook configuration 
├── dist/ # Built files (not in repo) 
└── public/ # Static assets and MSW worker
```

## Technology Stack

### Core

- React 18.x with TypeScript
- Shadcn/UI components with Radix UI primitives 
- Tailwind CSS
- Vite & TypeScript

### Development Tools

- Storybook 8.x for component development
- MSW for API mocking
- React Query for data management
  - where most of the API hooks are being generated using Orval with types based on the OpenAPI specification
- Zod/Yup for schema validation

### Testing

- Vitest + React Testing Library
- MSW for API mocking
- Storybook interactions

## Getting Started

### 1. Fork and clone:

```bash
git clone [your-fork-url]
cd embedded-components
```

### 2. Install dependencies:

```bash
yarn install
```

### 3. Configure VSCode (optional)

  - Recommended plugins:
    - ESLint
    - Prettier
    - Tailwind CSS Intellisense
   
  - Recommended settings
    - Use the `files.associations` setting to tell VS Code to always open .css files in Tailwind CSS mode:
      
      ```json
      "files.associations": {
        "*.css": "tailwindcss"
      }
      ```

    - By default VS Code will not trigger completions when editing "string" content, for example within JSX attribute values. Updating the `editor.quickSuggestions`  setting may improve your experience:
      
      ```json
      "editor.quickSuggestions": {
        "strings": "on"
      }
      ```

    - Allow Tailwind CSS Intellisense to autocomplete class names in `clsx`, `cva`, and `cx`:
      
      ```json
      "tailwindCSS.experimental.classRegex": [
        [
          "(?:clsx|cva|cx)\\(([^)(]*(?:\\([^)(]*(?:\\([^)(]*(?:\\([^)(]*\\)[^)(]*)*\\)[^)(]*)*\\)[^)(]*)*)\\)",
          "'([^']*)'"
        ],
        [
          "(?:clsx|cva|cx)\\(([^)(]*(?:\\([^)(]*(?:\\([^)(]*(?:\\([^)(]*\\)[^)(]*)*\\)[^)(]*)*\\)[^)(]*)*)\\)",
          "\"([^\"]*)\""
        ],
        [
          "(?:clsx|cva|cx)\\(([^)(]*(?:\\([^)(]*(?:\\([^)(]*(?:\\([^)(]*\\)[^)(]*)*\\)[^)(]*)*\\)[^)(]*)*)\\)",
          "`([^`]*)`"
        ]
      ]
      ```


### 4. Start development:

```bash
yarn storybook    # Component development
yarn vitest      # Run tests
```

## Development Workflow

1. Create feature branch:

```bash
git checkout -b feature/your-feature
```

2. Run quality checks:

```bash
yarn typecheck   # TypeScript check
yarn lint        # ESLint
yarn prettier    # Code formatting
yarn test        # Full test suite
```

3. Submit PR with:

    - Clear description
    - Storybook stories
    - Unit tests
    - Documentation updates

## Code Standards

- Use TypeScript strict mode
- Follow React 18 best practices:
  - Functional components with hooks
  - Proper error boundaries
  - React Query for data fetching
- Include Storybook stories
- Write tests using React Testing Library
- Follow accessibility guidelines
- Use provided Radix UI components
- Follow TailwindCSS class conventions

## Testing Requirements

- Unit tests for components
- Integration tests for complex flows
- Accessibility testing
- Visual regression tests via Storybook
- Mock API calls using MSW

## Documentation

- Include Storybook stories
- Update README if needed
- Document props and variants

## Getting Help

- Check existing stories in Storybook
- Review test files
- Open GitHub issues
- Reference component documentation
