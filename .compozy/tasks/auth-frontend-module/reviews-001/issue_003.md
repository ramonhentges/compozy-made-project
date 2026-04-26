---
status: resolved
file: frontend/src/routes/register.tsx
line: 46
severity: medium
author: claude-code
provider_ref:
---

# Issue 003: Registration success message lost on redirect

## Review Comment

Register page (line 46) navigates to login with state message:
```typescript
navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
```

However, login.tsx (line 34) only reads `returnUrl` from location.state:
```typescript
const returnUrl = (location.state as { returnUrl?: string })?.returnUrl || '/home';
```

The `message` property in state is never displayed on the login page. Users registering won't see any confirmation that registration succeeded.

**Suggested fix**: Read and display the message from state in login.tsx:
```typescript
const [successMessage, setSuccessMessage] = useState<string | null>(null);

useEffect(() => {
  const state = location.state as { message?: string };
  if (state?.message) {
    setSuccessMessage(state.message);
  }
}, [location.state]);
```

Then render the message in the form card content:
```tsx
{successMessage && (
  <div className="rounded-md bg-green-100 p-3 text-sm text-green-800">
    {successMessage}
  </div>
)}
```

Note: Use useEffect to handle React Router's location.state properly.

## Triage

- Decision: `valid`
- Notes: The issue is valid. register.tsx at line 46 uses `search` instead of `state`, but regardless, login.tsx does not read or display any success message from navigation params. Users registering see no confirmation of success.