# @midday/hooks

Shared React hooks for dashboard applications.

## Installation

```bash
pnpm add @midday/hooks
```

## Usage

```typescript
import { useDebounce, useLocalStorage, useMediaQuery } from '@midday/hooks';

function MyComponent() {
  // Debounce a value
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Persist state to localStorage
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  // Responsive design
  const isMobile = useMediaQuery('(max-width: 768px)');
}
```

## Available Hooks

### State Management

#### `useDebounce`
Debounces a value with configurable delay.
```typescript
const debouncedValue = useDebounce(value, delay);
```

#### `useLocalStorage`
Syncs state with localStorage.
```typescript
const [value, setValue] = useLocalStorage<T>(key: string, defaultValue: T);
```

#### `useSessionStorage`
Syncs state with sessionStorage.
```typescript
const [value, setValue] = useSessionStorage<T>(key: string, defaultValue: T);
```

### UI/UX Hooks

#### `useMediaQuery`
Responsive design helper.
```typescript
const matches = useMediaQuery('(min-width: 1024px)');
```

#### `useClipboard`
Copy to clipboard functionality.
```typescript
const { copy, copied } = useClipboard();
copy('text to copy');
```

#### `useClickOutside`
Detect clicks outside an element.
```typescript
const ref = useClickOutside<HTMLDivElement>(() => {
  console.log('Clicked outside');
});
```

### Lifecycle Hooks

#### `useMounted`
Check if component is mounted.
```typescript
const isMounted = useMounted();
```

#### `useEventListener`
Add event listeners with cleanup.
```typescript
useEventListener('keydown', handleKeyDown);
```

#### `useInterval`
Set up intervals with cleanup.
```typescript
useInterval(() => {
  console.log('Tick');
}, 1000);
```

### Data Fetching

#### `useAsync`
Handle async operations with loading states.
```typescript
const { data, error, loading, execute } = useAsync(asyncFunction);
```

#### `useFetch`
Simplified data fetching.
```typescript
const { data, error, loading } = useFetch('/api/data');
```

### Performance Hooks

#### `useThrottle`
Throttle value updates.
```typescript
const throttledValue = useThrottle(value, 1000);
```

#### `usePrevious`
Track previous value.
```typescript
const previousValue = usePrevious(currentValue);
```

## Hook Structure

```
src/
├── state/
│   ├── use-debounce.ts
│   ├── use-local-storage.ts
│   └── use-session-storage.ts
├── ui/
│   ├── use-media-query.ts
│   ├── use-clipboard.ts
│   └── use-click-outside.ts
├── lifecycle/
│   ├── use-mounted.ts
│   ├── use-event-listener.ts
│   └── use-interval.ts
├── data/
│   ├── use-async.ts
│   └── use-fetch.ts
└── index.ts
```

## Examples

### Debounced Search
```typescript
function SearchBox() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (debouncedSearch) {
      // Perform search
      fetchResults(debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  );
}
```

### Dark Mode Toggle
```typescript
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

  useEffect(() => {
    if (!theme) {
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, [prefersDark]);

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  );
}
```

## Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch
```

## Migration Status

- [ ] State hooks (0/3)
- [ ] UI hooks (0/3)
- [ ] Lifecycle hooks (0/3)
- [ ] Data hooks (0/2)
- [ ] Performance hooks (0/2)

Total: 0/13 hooks to be migrated

## Dependencies

- `react` - React library