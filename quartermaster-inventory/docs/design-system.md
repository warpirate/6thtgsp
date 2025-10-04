# 🎨 Design System - Quarter Master Inventory

A comprehensive design system ensuring consistent, professional, and user-friendly interface across the application.

## 🎨 Visual Identity

### Theme Philosophy
- **Minimal**: Clean, uncluttered interfaces
- **Secure**: Professional, trustworthy appearance
- **Disciplined**: Military-grade precision and order

### Color Palette

```css
:root {
  /* Primary Colors */
  --color-primary: #1E3A8A;      /* Navy blue - trust, authority */
  --color-primary-light: #3B82F6; /* Lighter blue for hover states */
  --color-primary-dark: #1E40AF;  /* Darker blue for active states */
  
  /* Secondary Colors */
  --color-secondary: #CBD5E1;     /* Neutral gray - clarity */
  --color-secondary-light: #E2E8F0;
  --color-secondary-dark: #94A3B8;
  
  /* Accent Colors */
  --color-accent: #22C55E;        /* Green - success/verified states */
  --color-accent-light: #4ADE80;
  --color-accent-dark: #16A34A;
  
  /* Background Colors */
  --bg-primary: #F8FAFC;          /* Clean white-gray */
  --bg-secondary: #FFFFFF;        /* Pure white for cards */
  --bg-tertiary: #F1F5F9;         /* Subtle gray for sections */
  
  /* Status Colors */
  --color-success: #22C55E;       /* Green - approved, verified */
  --color-warning: #F59E0B;       /* Amber - pending, review */
  --color-error: #EF4444;         /* Red - rejected, error */
  --color-info: #3B82F6;          /* Blue - information, draft */
  
  /* Text Colors */
  --text-primary: #1F2937;        /* Dark gray for headings */
  --text-secondary: #6B7280;      /* Medium gray for body text */
  --text-tertiary: #9CA3AF;       /* Light gray for subtle text */
}
```

### Color Usage Guidelines

| Color | Usage | Examples |
|-------|-------|----------|
| Primary Navy | Main actions, navigation, headers | Login button, active nav items |
| Secondary Gray | Borders, disabled states, subtle backgrounds | Input borders, disabled buttons |
| Accent Green | Success states, approved items | Approved status, success messages |
| Warning Amber | Pending states, caution | Pending approval, review required |
| Error Red | Errors, rejected items | Validation errors, rejected status |

## 📝 Typography

### Font Family
- **Primary**: "Inter" (Google Fonts)
- **Fallback**: "Poppins", system-ui, sans-serif
- **Monospace**: "JetBrains Mono" for code/IDs

### Type Scale

```css
/* Headings */
.text-4xl { font-size: 2.25rem; font-weight: 700; } /* Page titles */
.text-3xl { font-size: 1.875rem; font-weight: 600; } /* Section headers */
.text-2xl { font-size: 1.5rem; font-weight: 600; }   /* Card titles */
.text-xl { font-size: 1.25rem; font-weight: 500; }   /* Subsection headers */

/* Body Text */
.text-lg { font-size: 1.125rem; font-weight: 400; }  /* Large body text */
.text-base { font-size: 1rem; font-weight: 400; }    /* Standard body text */
.text-sm { font-size: 0.875rem; font-weight: 400; }  /* Small text, captions */
.text-xs { font-size: 0.75rem; font-weight: 400; }   /* Very small text, labels */
```

### Typography Usage

| Class | Usage | Line Height |
|-------|-------|-------------|
| `text-4xl` | Page titles, main headings | 1.2 |
| `text-3xl` | Section headers | 1.3 |
| `text-2xl` | Card titles, subsections | 1.4 |
| `text-xl` | Important labels | 1.5 |
| `text-lg` | Emphasized body text | 1.6 |
| `text-base` | Standard body text | 1.6 |
| `text-sm` | Secondary information | 1.5 |
| `text-xs` | Labels, metadata | 1.4 |

## 🏗️ Layout System

### Grid System
- **Base unit**: 4px (0.25rem)
- **Standard spacing**: 16px (4 units) and 24px (6 units)
- **Container max-width**: 1200px
- **Responsive breakpoints**: sm:640px, md:768px, lg:1024px, xl:1280px

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│                Top Header Bar                        │
│  Logo + Breadcrumbs + User Profile                  │
├─────────────┬───────────────────────────────────────┤
│             │                                       │
│  Left Nav   │         Main Content Area            │
│  Sidebar    │                                       │
│             │  ┌─────────────────────────────────┐  │
│             │  │         Card Container          │  │
│             │  │                                 │  │
│             │  └─────────────────────────────────┘  │
│             │                                       │
└─────────────┴───────────────────────────────────────┘
```

### Spacing Scale

```css
/* Tailwind spacing classes used throughout */
.space-1  { margin/padding: 0.25rem; } /* 4px  - tight spacing */
.space-2  { margin/padding: 0.5rem; }  /* 8px  - small spacing */
.space-4  { margin/padding: 1rem; }    /* 16px - standard spacing */
.space-6  { margin/padding: 1.5rem; }  /* 24px - medium spacing */
.space-8  { margin/padding: 2rem; }    /* 32px - large spacing */
.space-12 { margin/padding: 3rem; }    /* 48px - extra large spacing */
```

## 🧩 Component Library

### Button System

```css
/* Primary Button */
.btn-primary {
  @apply bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-md;
  @apply transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}

/* Secondary Button */
.btn-secondary {
  @apply bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md;
  @apply transition-colors duration-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
}

/* Success Button */
.btn-success {
  @apply bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md;
  @apply transition-colors duration-200 focus:ring-2 focus:ring-green-500 focus:ring-offset-2;
}

/* Danger Button */
.btn-danger {
  @apply bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md;
  @apply transition-colors duration-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2;
}
```

### Card System

```css
/* Base Card */
.card {
  @apply bg-white rounded-lg border border-gray-200 shadow-sm;
}

/* Card with hover effect */
.card-hover {
  @apply card hover:shadow-md transition-shadow duration-200;
}

/* Card header */
.card-header {
  @apply px-6 py-4 border-b border-gray-200;
}

/* Card body */
.card-body {
  @apply px-6 py-4;
}

/* Card footer */
.card-footer {
  @apply px-6 py-4 border-t border-gray-200 bg-gray-50;
}
```

### Status Indicators

```css
/* Status badges */
.status-draft { @apply bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium; }
.status-submitted { @apply bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium; }
.status-verified { @apply bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium; }
.status-approved { @apply bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium; }
.status-rejected { @apply bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium; }
```

## 🎭 Icons

### Icon Library: Lucide React
- **Style**: Simple line icons (no filled styles)
- **Size**: Consistent 16px, 20px, 24px sizes
- **Stroke width**: 2px for better visibility

### Common Icons Usage

| Icon | Usage | Context |
|------|-------|---------|
| `User` | User profiles, authentication | User management, login |
| `Package` | Inventory items, stock | Receipt items, inventory |
| `CheckCircle` | Success states, approved | Approved receipts |
| `Clock` | Pending states, time | Pending approvals |
| `AlertCircle` | Warnings, attention needed | Validation errors |
| `FileText` | Documents, reports | File uploads, exports |
| `Settings` | Configuration, preferences | User settings |
| `LogOut` | Sign out functionality | Authentication |

## 📱 Responsive Design

### Breakpoint Strategy

```css
/* Mobile First Approach */
.container {
  @apply px-4;                    /* Mobile: 16px padding */
}

@media (min-width: 640px) {
  .container {
    @apply px-6;                  /* Tablet: 24px padding */
  }
}

@media (min-width: 1024px) {
  .container {
    @apply px-8;                  /* Desktop: 32px padding */
  }
}
```

### Mobile Adaptations
- **Navigation**: Collapsible sidebar becomes bottom navigation
- **Tables**: Horizontal scroll with sticky columns
- **Forms**: Full-width inputs with better touch targets
- **Cards**: Stacked layout instead of grid

## 🎯 Accessibility

### Color Contrast
- **Text on background**: Minimum 4.5:1 ratio
- **Interactive elements**: Minimum 3:1 ratio
- **Focus indicators**: High contrast, visible borders

### Keyboard Navigation
- **Tab order**: Logical, predictable flow
- **Focus indicators**: Clear visual feedback
- **Skip links**: Allow bypassing navigation

### Screen Reader Support
- **Semantic HTML**: Proper heading hierarchy
- **ARIA labels**: Descriptive labels for complex components
- **Alt text**: Meaningful descriptions for images

## 🔧 Implementation Guidelines

### CSS Architecture
```css
/* globals.css structure */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom CSS variables */
:root { /* color variables */ }

/* Component styles */
@layer components {
  .btn { /* button base styles */ }
  .card { /* card base styles */ }
}

/* Utility styles */
@layer utilities {
  .text-balance { text-wrap: balance; }
}
```

### Component Naming Convention
- **BEM methodology**: `.block__element--modifier`
- **Tailwind utilities**: Primary styling method
- **Custom components**: Only when Tailwind isn't sufficient

---

This design system ensures consistent, professional, and accessible user interfaces throughout the Quarter Master application.
