# Testing Requirements & Strategy

**Status**: 🟡 **Medium Priority**  
**Estimated Effort**: 1 week  
**Current Coverage**: 0%  

---

## 📊 Testing Goals

### Target Coverage
- **Unit Tests**: 80% code coverage
- **Integration Tests**: 60% of critical paths
- **E2E Tests**: 40% of user workflows
- **Accessibility**: WCAG 2.1 AA compliance

---

## 🧪 Testing Stack

### Recommended Tools

```bash
# Unit & Integration Testing
npm install --save-dev @testing-library/react
npm install --save-dev @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
npm install --save-dev vitest
npm install --save-dev @vitest/ui

# Mocking
npm install --save-dev msw

# E2E Testing
npm install --save-dev @playwright/test

# Accessibility Testing
npm install --save-dev @axe-core/react
npm install --save-dev jest-axe
```

---

## 🎯 Unit Testing Strategy

### Setup Vitest Configuration

**File**: `vitest.config.ts` (NEW)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**File**: `src/test/setup.ts` (NEW)

```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

### Component Test Examples

**File**: `src/pages/receipts/__tests__/ReceiptsPage.test.tsx` (NEW)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ReceiptsPage from '../ReceiptsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </BrowserRouter>
)

describe('ReceiptsPage', () => {
  it('renders page title', () => {
    render(<ReceiptsPage />, { wrapper })
    expect(screen.getByText('Stock Receipts')).toBeInTheDocument()
  })

  it('displays search input', () => {
    render(<ReceiptsPage />, { wrapper })
    expect(screen.getByPlaceholderText(/search receipts/i)).toBeInTheDocument()
  })

  it('filters receipts by search term', async () => {
    render(<ReceiptsPage />, { wrapper })
    const searchInput = screen.getByPlaceholderText(/search receipts/i)
    
    fireEvent.change(searchInput, { target: { value: 'Laptop' } })
    
    await waitFor(() => {
      expect(screen.getByText(/laptop/i)).toBeInTheDocument()
    })
  })

  it('opens filter panel when filter button clicked', () => {
    render(<ReceiptsPage />, { wrapper })
    const filterButton = screen.getByText('Filters')
    
    fireEvent.click(filterButton)
    
    expect(screen.getByText('Status')).toBeInTheDocument()
  })
})
```

**File**: `src/components/ui/__tests__/Button.test.tsx` (NEW)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const Button = ({ onClick, children, disabled }: any) => (
  <button onClick={onClick} disabled={disabled}>
    {children}
  </button>
)

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick} disabled>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    
    expect(handleClick).not.toHaveBeenCalled()
  })
})
```

---

## 🔗 Integration Testing with MSW

### Setup Mock Service Worker

**File**: `src/test/mocks/handlers.ts` (NEW)

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock receipts API
  http.get('/rest/v1/stock_receipts', () => {
    return HttpResponse.json([
      {
        id: '1',
        receipt_id: 'REC-001',
        item_name: 'Test Item',
        quantity: 5,
        unit: 'units',
        status: 'approved',
      },
    ])
  }),

  // Mock receipt creation
  http.post('/rest/v1/stock_receipts', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: '2',
      ...body,
      receipt_id: 'REC-002',
    })
  }),
]
```

**File**: `src/test/mocks/server.ts` (NEW)

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

**Update `src/test/setup.ts`**:

```typescript
import { server } from './mocks/server'

// Start server before tests
beforeAll(() => server.listen())

// Reset handlers after each test
afterEach(() => server.resetHandlers())

// Clean up after tests
afterAll(() => server.close())
```

### Integration Test Example

**File**: `src/pages/receipts/__tests__/CreateReceipt.integration.test.tsx` (NEW)

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateReceiptPage from '../CreateReceiptPage'

describe('CreateReceiptPage Integration', () => {
  it('completes full receipt creation flow', async () => {
    const user = userEvent.setup()
    render(<CreateReceiptPage />, { wrapper })

    // Step 1: Fill basic info
    await user.type(screen.getByLabelText(/item name/i), 'Test Laptop')
    await user.type(screen.getByLabelText(/quantity/i), '10')
    await user.selectOptions(screen.getByLabelText(/unit/i), 'units')
    
    fireEvent.click(screen.getByText('Next'))

    // Step 2: Fill additional details
    await waitFor(() => {
      expect(screen.getByText('Additional Details')).toBeInTheDocument()
    })
    
    await user.type(screen.getByLabelText(/unit price/i), '999.99')
    await user.type(screen.getByLabelText(/supplier/i), 'Dell')
    
    fireEvent.click(screen.getByText('Next'))

    // Step 3: Review and submit
    await waitFor(() => {
      expect(screen.getByText('Review & Submit')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Test Laptop')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Submit for Verification'))

    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/submitted successfully/i)).toBeInTheDocument()
    })
  })
})
```

---

## 🎭 E2E Testing with Playwright

### Setup Playwright

```bash
npx playwright install
```

**File**: `playwright.config.ts` (NEW)

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Test Examples

**File**: `e2e/auth.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/auth/login')

    await page.fill('[name="email"]', 'user@quartermaster.dev')
    await page.fill('[name="password"]', 'demo123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')

    await page.fill('[name="email"]', 'wrong@email.com')
    await page.fill('[name="password"]', 'wrongpass')
    await page.click('button[type="submit"]')

    await expect(page.locator('[role="alert"]')).toContainText('Invalid')
  })
})
```

**File**: `e2e/receipt-workflow.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Receipt Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'user@quartermaster.dev')
    await page.fill('[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should create and submit receipt', async ({ page }) => {
    // Navigate to create page
    await page.goto('/receipts/create')

    // Fill step 1
    await page.fill('[name="item_name"]', 'E2E Test Item')
    await page.fill('[name="quantity"]', '5')
    await page.selectOption('[name="unit"]', 'units')
    await page.click('button:has-text("Next")')

    // Fill step 2
    await page.fill('[name="unit_price"]', '100')
    await page.click('button:has-text("Next")')

    // Submit
    await page.click('button:has-text("Submit")')

    // Verify redirect to receipts list
    await expect(page).toHaveURL('/receipts')
    await expect(page.locator('text=E2E Test Item')).toBeVisible()
  })

  test('should filter receipts', async ({ page }) => {
    await page.goto('/receipts')

    // Open filters
    await page.click('button:has-text("Filters")')

    // Select status
    await page.check('input[value="approved"]')

    // Verify filtered results
    const badges = page.locator('.status-badge')
    const count = await badges.count()
    for (let i = 0; i < count; i++) {
      await expect(badges.nth(i)).toContainText('Approved')
    }
  })

  test('should verify receipt', async ({ page }) => {
    // Navigate to a submitted receipt
    await page.goto('/receipts')
    await page.click('a:has-text("REC-")')

    // Click verify button
    await page.click('button:has-text("Verify")')

    // Add comments
    await page.fill('textarea', 'Verified by E2E test')
    await page.click('button:has-text("Confirm")')

    // Verify status updated
    await expect(page.locator('.status-badge')).toContainText('Verified')
  })
})
```

---

## ♿ Accessibility Testing

**File**: `src/test/a11y.test.tsx` (NEW)

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import ReceiptsPage from '@/pages/receipts/ReceiptsPage'

expect.extend(toHaveNoViolations)

describe('Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<ReceiptsPage />, { wrapper })
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

---

## 📋 Test Coverage Requirements

### Critical Paths (Must Have 90%+ Coverage)

1. **Authentication Flow**
   - Login
   - Logout
   - Password reset
   - Session management

2. **Receipt Creation**
   - Form validation
   - Multi-step navigation
   - Draft saving
   - Submission

3. **Workflow Actions**
   - Verify receipt
   - Approve receipt
   - Reject with reason

4. **Permissions**
   - Role-based UI rendering
   - Action button visibility
   - API access control

### Important Paths (Target 70%+ Coverage)

5. **Receipt List**
   - Search and filter
   - Sorting
   - Pagination

6. **Receipt Detail**
   - View details
   - Timeline display
   - Action buttons

7. **Approvals**
   - Pending list
   - Bulk actions
   - History view

---

## 🚀 Running Tests

**Add to `package.json`**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:report": "playwright show-report"
  }
}
```

**Commands**:

```bash
# Unit tests (watch mode)
npm run test

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui
```

---

## 📊 Test Metrics Dashboard

**File**: `.github/workflows/test.yml` (NEW - for CI/CD)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload E2E report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## ✅ Testing Checklist

### Before Production
- [ ] All unit tests passing
- [ ] 80%+ code coverage
- [ ] All E2E tests passing
- [ ] No accessibility violations
- [ ] Performance tests pass
- [ ] Security tests pass
- [ ] All critical paths tested
- [ ] Edge cases covered
- [ ] Error handling tested
- [ ] Cross-browser testing done

---

**Estimated Time**: 40 hours (1 week)  
**Priority**: 🟡 **Medium** - Critical before production  
**Dependencies**: All features implemented  

---

**Last Updated**: 2025-10-04
