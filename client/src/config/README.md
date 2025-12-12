# Sidebar Configuration

## Single Source of Truth

This directory contains the **single source of truth** for all sidebar navigation in the application.

### Files

- **`sidebarMenu.ts`** - The ONLY file that defines all menu items, routes, icons, and submenus

### Usage

The `Sidebar` component (`client/src/components/sidebar/Sidebar.tsx`) imports and renders this configuration.

### Adding Menu Items

To add or modify menu items:

1. Edit **ONLY** `sidebarMenu.ts`
2. Add your menu item to the `sidebarMenu` array
3. The Sidebar component will automatically render it

### Structure

```typescript
{
  label: string           // Display name
  to?: string            // Route path (optional for parent items)
  icon: LucideIcon       // Icon component from lucide-react
  children?: MenuItem[]  // Submenu items (optional)
  roles?: string[]       // Restrict to specific roles (optional)
}
```

### Important Notes

- **DO NOT** duplicate menu items in other files
- **DO NOT** create alternative sidebar components
- **DO NOT** hardcode menu items in components
- **ALWAYS** use this configuration file

