# Formiq SDK

Embed Formiq board components (e.g. `/b/[boardId]`) inside existing React applications.

**Prerequisite**

1. Create a Formiq account at `formiq-steel.vercel.app`.
2. Open **Settings** in the Formiq app.
3. Generate a Personal Access Token (PAT).

## Install

```bash
pnpm add @francistinao/formiq-sdk
# or
npm install @francistinao/formiq-sdk
# or
yarn add @francistinao/formiq-sdk
```

## Usage

```tsx
'use client'

import { FormiqProvider, BoardEditor } from '@francistinao/formiq-sdk'
import '@francistinao/formiq-sdk/styles.css'

function App() {
  return (
    <FormiqProvider
      token="formiq_3dc..."
      apiBaseUrl="https://api.francistinao.com/api/v1"
    >
      <BoardEditor boardId="YOUR_BOARD_ID" />
    </FormiqProvider>
  )
}
```

## Notes

- The PAT is required to load board data and generate PDFs.
- Wrap your editor components with `FormiqProvider` so API requests include the PAT automatically.
- Set `apiBaseUrl` on `FormiqProvider` (or call `setApiBaseUrl`) to target your API host.

---

By Francis Tin-ao
