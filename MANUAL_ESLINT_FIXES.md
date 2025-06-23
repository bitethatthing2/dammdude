# Manual ESLint Fixes Required

## 1. Replace 'any' types in these files:

### Firebase Admin (lib/firebase/admin.ts)
Change:
```typescript
const serviceAccount = require(...)
```
To:
```typescript
import serviceAccount from './path-to-service-account.json';
```

### Event Handlers
Change: `(e: any) => ...`
To: `(e: React.ChangeEvent<HTMLInputElement>) => ...`

### API Responses
Change: `response: any`
To: `response: unknown` or specific type

## 2. Remove Unused Variables
Either delete them or prefix with underscore: `_unusedVar`

## 3. Remove Unused Imports
Delete the import statement if the import is not used

## Commands to run after fixes:
1. npm run lint -- --fix
2. npm run lint (to see remaining issues)
