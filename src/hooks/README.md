# Custom Hooks

This directory contains custom React hooks that can be reused throughout the application.

## Available Hooks

### `useBranchChangeRefresh`

This hook handles refreshing data when the active branch changes.

#### Usage

```tsx
import useBranchChangeRefresh from '../hooks/useBranchChangeRefresh';

const MyComponent = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Define your data fetching function
  const fetchData = useCallback(async () => {
    // Your data fetching logic here
    // e.g., fetch customers, products, orders, etc.
  }, [page, rowsPerPage, otherDependencies]);
  
  // Use the hook - it will automatically refresh data when the branch changes
  useBranchChangeRefresh(fetchData, [page, rowsPerPage, otherDependencies], setPage);
  
  // Load data initially
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Rest of your component...
}
```

#### Parameters

- `refreshFunction`: The function to call when the branch changes
- `dependencies`: Additional dependencies for the refresh function
- `setPage`: (Optional) Function to reset page to 0 when branch changes

#### Returns

- `{ loading, refresh }`: An object containing loading state and a manual refresh function

#### How It Works

The hook:

1. Listens for changes to the active branch using the `BranchContext`
2. Listens for the `branch-id-updated` custom event
3. When a branch change is detected, it:
   - Resets the page to 0 (if `setPage` is provided)
   - Calls the provided refresh function to fetch new data
   - Manages loading state automatically

By using this hook across all data listing pages, you ensure consistent behavior when switching branches. 