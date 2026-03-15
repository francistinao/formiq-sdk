# Formiq SDK

Embed Formiq board components (e.g. `/b/[boardId]`) inside existing React applications.

**Prerequisite**

1. Create a Formiq account at `formiq-steel.vercel.app`.
2. Open **Settings** in the Formiq app.
3. Generate a Personal Access Token (PAT).

## Install

```bash
pnpm add @formiq/formiq-sdk
# or
npm install @formiq/formiq-sdk
# or
yarn add @formiq/formiq-sdk
```

## Usage

```tsx
import { FormiqProvider, BoardEditor } from '@formiq/formiq-sdk'
import '@formiq/formiq-sdk/styles.css'

function App() {
  return (
    <FormiqProvider token="formiq_3dc...">
      <BoardEditor boardId="YOUR_BOARD_ID" />
    </FormiqProvider>
  )
}
```

## Notes

- The PAT is required to load board data and generate PDFs.
- Wrap your editor components with `FormiqProvider` so API requests include the PAT automatically.
