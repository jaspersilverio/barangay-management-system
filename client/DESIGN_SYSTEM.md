# Barangay Management System - Design System

## 🎨 Color Palette

### Primary Colors

- **Emerald Green (#059669)** - Primary brand color for growth, community, and health
- **Light Gray (#F9FAFB)** - Clean background color, easy on the eyes
- **Amber (#F59E0B)** - Accent color for warnings, alerts, and important notices
- **Dark Gray (#374151)** - Primary text color for readability

### Semantic Colors

- **Success**: Green variants for positive actions
- **Warning**: Amber variants for caution states
- **Danger**: Red variants for errors and emergencies
- **Info**: Blue variants for informational content

## 📐 Layout System

### Grid System

- **12-column responsive grid** using Bootstrap classes
- **Breakpoints**: xs, sm, md, lg, xl
- **Gutters**: Consistent spacing with `g-4`, `g-6` classes

### Spacing Scale

- **4px** - Extra small spacing
- **8px** - Small spacing
- **16px** - Medium spacing
- **24px** - Large spacing
- **32px** - Extra large spacing

## 🧩 Component Library

### Buttons

```tsx
import { Button, SaveButton, CancelButton, DeleteButton } from '../components/ui'

// Primary button
<Button variant="primary">Save Changes</Button>

// Predefined action buttons
<SaveButton>Save</SaveButton>
<CancelButton>Cancel</CancelButton>
<DeleteButton>Delete</DeleteButton>
```

### Cards

```tsx
import { Card, StatsCard, EventCard } from '../components/ui'

// Basic card
<Card title="Card Title" subtitle="Card subtitle">
  Content here
</Card>

// Stats card
<StatsCard
  title="Total Residents"
  value="1,234"
  change="+5 this month"
  icon={<Users />}
  color="primary"
/>

// Event card
<EventCard
  title="Community Meeting"
  date="Dec 15, 2024"
  type="Barangay-wide"
  description="Monthly community meeting"
  status="upcoming"
/>
```

### Badges

```tsx
import { Badge, StatusBadge, EventTypeBadge } from '../components/ui'

// Basic badge
<Badge variant="success">Active</Badge>

// Status badge (auto-detects status)
<StatusBadge status="Active" />
<StatusBadge status="Pending" />
<StatusBadge status="Completed" />

// Event type badge
<EventTypeBadge type="Barangay-wide" />
<EventTypeBadge type="Purok-level" />
<EventTypeBadge type="Emergency" />
```

### Tables

```tsx
import { Table, DataTable } from '../components/ui'

// Basic table
<Table striped hover>
  <thead>
    <tr>
      <th>Name</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td><StatusBadge status="Active" /></td>
    </tr>
  </tbody>
</Table>

// Data table with columns
<DataTable
  data={residents}
  columns={[
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status', render: (value) => <StatusBadge status={value} /> }
  ]}
  onRowClick={(row) => handleRowClick(row)}
/>
```

### Loading States

```tsx
import { LoadingSkeleton, CardSkeleton, TableSkeleton } from '../components/ui'

// Basic skeleton
<LoadingSkeleton type="text" />

// Card skeleton
<CardSkeleton />

// Table skeleton
<TableSkeleton rows={5} />
```

## 🎯 Usage Guidelines

### Color Usage

- **Minimal bright colors** - Use sparingly, mainly for alerts and emergencies
- **Consistent color application** - Use semantic colors for their intended purposes
- **Accessibility** - Ensure sufficient contrast ratios

### Typography

- **Font**: Inter (primary), Roboto (fallback)
- **Weights**: 300, 400, 500, 600, 700
- **Hierarchy**: Use consistent heading sizes and weights

### Icons

- **Lucide React** - Primary icon library
- **Consistent sizing** - 16px, 18px, 20px, 24px
- **Semantic usage** - Icons should enhance meaning, not just decoration

### Forms

- **Clean input fields** - `border-gray-300` with `focus:border-blue-500`
- **Consistent validation** - Use semantic colors for success/error states
- **Accessible labels** - Always provide proper labels and descriptions

### Responsive Design

- **Mobile-first** - Design for mobile, enhance for desktop
- **Consistent breakpoints** - Use Bootstrap's responsive utilities
- **Touch-friendly** - Ensure adequate touch targets (44px minimum)

## 🌙 Dark Mode

The system includes optional dark mode support:

- **Toggle**: Available in the top navigation
- **Persistent**: Saves user preference
- **System preference**: Respects OS dark mode setting

## 📱 Component States

### Loading States

- **Skeleton loaders** - Show content structure while loading
- **Spinner indicators** - For button actions and form submissions
- **Progressive loading** - Load critical content first

### Interactive States

- **Hover effects** - Subtle transitions and color changes
- **Focus states** - Clear focus indicators for accessibility
- **Active states** - Visual feedback for user interactions

### Error States

- **Form validation** - Clear error messages with semantic colors
- **Network errors** - User-friendly error handling
- **Empty states** - Helpful messages when no data is available

## 🚀 Best Practices

1. **Consistency** - Use the design system components consistently
2. **Accessibility** - Ensure all components meet WCAG guidelines
3. **Performance** - Optimize for fast loading and smooth interactions
4. **Maintainability** - Use semantic class names and proper component structure
5. **Scalability** - Design components to work across different screen sizes

## 📚 Resources

- **Tailwind CSS**: Utility-first CSS framework
- **Bootstrap**: Component library for layout and basic components
- **Lucide React**: Icon library
- **Inter Font**: Typography
- **Color Palette**: Custom color system for barangay management
