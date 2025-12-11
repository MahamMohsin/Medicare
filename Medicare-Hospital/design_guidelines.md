# Medicare Hospital Management System - Design Guidelines

## Design Approach
**System-Based Approach:** Material Design principles adapted for healthcare enterprise software. Prioritizing clarity, efficiency, and data-dense interfaces for multi-role workflows.

### Core Design Principles
1. **Functional Clarity:** Every element serves a clear purpose in clinical workflows
2. **Information Hierarchy:** Critical patient data and actions immediately visible
3. **Role-Based Consistency:** Each user role maintains familiar patterns while accessing different features
4. **Trust & Professionalism:** Clean, medical-grade interface that inspires confidence

## Typography System

**Font Family:** 
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for patient IDs, timestamps, medical codes)

**Hierarchy:**
- Page Headers: text-3xl font-semibold
- Section Headers: text-xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Labels: text-sm font-medium
- Helper Text/Metadata: text-xs font-normal
- Table Headers: text-sm font-semibold uppercase tracking-wide

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section spacing: mb-6, mb-8
- Card gaps: gap-4, gap-6
- Form field spacing: space-y-4

**Grid Structure:**
- Sidebar: Fixed 64 (16rem) width
- Main content: flex-1 with max-w-7xl container
- Dashboard cards: Grid system (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4)
- Data tables: Full-width responsive with horizontal scroll on mobile

## Component Library

### Navigation
**Sidebar Navigation:**
- Fixed left sidebar with hospital logo at top
- Role-based menu items with Lucide icons
- Active state indication with background treatment
- Collapsible on mobile (hamburger menu)
- User profile section at bottom with role badge

**Top Bar:**
- Hospital name "Medicare Hospital" prominently displayed
- Breadcrumb navigation for deep pages
- Notification bell with badge counter
- User avatar dropdown (profile, settings, logout)

### Dashboard Components
**Metric Cards:**
- Icon (Lucide) in corner with relevant medical iconography
- Large number display (text-3xl font-bold)
- Label below (text-sm)
- Optional trend indicator (arrow up/down with percentage)
- Subtle border treatment, rounded-lg corners

**Quick Actions Panel:**
- Prominent action buttons (Register Patient, Book Appointment, etc.)
- Icon + text button style
- Grid layout: 2 columns on mobile, 4 on desktop

**Recent Activity Feed:**
- Chronological list with timestamps
- Status badges (color-coded per status type)
- Avatar + action description format
- "View All" link at bottom

### Data Tables
**Structure:**
- Sticky header row
- Alternating row background for readability
- Hover state on rows
- Actions column with icon buttons (View, Edit, Delete)
- Pagination footer (10/25/50/100 per page options)
- Search/filter bar above table
- Status badges within cells (Scheduled, Completed, Pending, etc.)

**Column Specifications:**
- Left-aligned text content
- Right-aligned numerical data
- Center-aligned status badges
- Monospace font for IDs and codes

### Forms
**Input Fields:**
- Label above input (font-medium text-sm)
- Full-width inputs with consistent height (h-10)
- Border treatment with focus state
- Error states with text-red-500 message below
- Required field indicator (*)
- Helper text in text-xs below input

**Form Layout:**
- Multi-column on desktop (grid-cols-2 for patient registration)
- Single column on mobile
- Logical grouping with section dividers
- Action buttons at bottom-right (Cancel + Submit)

**Special Inputs:**
- Date/time pickers with calendar icon
- Dropdown selects with chevron icon
- Radio groups for gender, blood group
- Checkboxes for multi-select (e.g., symptoms)

### Cards & Panels
**Patient Profile Card:**
- Header with patient name + ID
- Avatar/initials circle
- Key demographics in grid layout
- Medical alerts (allergies, conditions) as badges
- Action buttons (Edit Profile, View History)

**Appointment Card:**
- Doctor info with avatar
- Date/time prominent display
- Department badge
- Patient name + ID
- Status indicator
- Quick actions (Reschedule, Cancel)

**Bill Invoice:**
- Header with Medicare Hospital branding
- Bill number + date
- Patient details section
- Itemized table (Service, Quantity, Rate, Amount)
- Subtotal, tax, total calculations
- Payment status badge
- Print button

### Status System
**Badge Components:**
- Rounded-full px-3 py-1 text-xs font-medium
- Scheduled: Blue treatment
- Completed: Green treatment
- Cancelled: Red treatment
- Pending: Yellow treatment
- Available/Paid: Green treatment
- Occupied/Partial: Orange treatment
- Under Maintenance: Gray treatment

### Modals & Dialogs
**Structure:**
- Centered overlay with backdrop blur
- Max-width based on content (max-w-md for confirmations, max-w-4xl for forms)
- Header with title + close button
- Content area with appropriate padding
- Footer with action buttons (right-aligned)

**Types:**
- Confirmation dialogs (Delete patient, Cancel appointment)
- Form modals (Quick appointment booking)
- Detail views (Lab report preview)
- Image/report viewers (full-screen overlay)

### Icons
**Library:** Lucide React (CDN)
**Usage:**
- Navigation: Home, Users, Calendar, FileText, Clipboard, Bed, DollarSign, Settings
- Actions: Plus, Edit, Trash2, Eye, Download, Print, Search
- Status: CheckCircle, XCircle, Clock, AlertTriangle
- Medical: Activity, Heart, Pill, TestTube, Stethoscope

### Charts & Visualizations
**Library:** Recharts
**Chart Types:**
- Line charts: Patient registration trends
- Bar charts: Revenue by department, Appointment volume
- Pie charts: Bed occupancy, Payment methods
- Area charts: Monthly revenue trends

**Chart Styling:**
- Consistent axis labels (text-xs)
- Grid lines for readability
- Tooltips on hover
- Legend positioned appropriately
- Responsive sizing

## Page-Specific Layouts

### Login Page
- Centered card (max-w-md)
- Medicare Hospital logo at top
- Role selection dropdown
- Email + password fields
- "Remember me" checkbox
- Login button (full-width)
- Demo credentials displayed clearly

### Dashboard
- 4-column metric cards at top
- 2-column layout below: Recent appointments (left) + Quick actions (right)
- Patient activity feed
- Occupancy chart

### Patient Management
- Search/filter bar at top
- Patient table with sorting
- "Add Patient" button (top-right)
- Patient detail modal on row click

### Appointments Calendar
- Month/week/day view switcher
- Calendar grid with appointment cards
- Color-coded by department
- Click to view/edit appointment details

### Lab Management
- Test catalog grid (3-4 columns)
- Status workflow visualization
- Test request form
- Report generation interface

### Ward Management
- Ward tabs (General, ICU, Private, Semi-private)
- Bed grid visualization (Available/Occupied color states)
- Bed allocation form
- Patient admission/discharge forms

## Animations
**Minimal Usage:**
- Button hover: subtle scale (scale-105)
- Modal entry: fade-in
- Notification toast: slide-in from top-right
- No scroll animations or parallax effects

## Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus states clearly visible
- Color contrast meeting WCAG AA standards
- Form validation with clear error messages

## Responsive Breakpoints
- Mobile: Base styles
- Tablet: md: (768px)
- Desktop: lg: (1024px)
- Large Desktop: xl: (1280px)

This design system ensures Medicare Hospital's management platform is professional, efficient, and trustworthy while handling complex healthcare workflows across all user roles.