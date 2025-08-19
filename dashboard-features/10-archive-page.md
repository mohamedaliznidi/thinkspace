# Archive Page - Features & User Stories

## Page Overview
The Archive page (`/archive`) manages completed, cancelled, and inactive items from the PARA methodology, providing restoration capabilities, bulk operations, and organized viewing of historical content.

## Core Features

### 1. Archive Management Header
- **Feature**: Clear archive identification with bulk operation support
- **User Story**: As a user, I want to understand I'm viewing archived content and perform bulk operations
- **Implementation**: Title, description, and dynamic bulk action toolbar

### 2. Dual Content Tabs

#### Projects Tab
- **Feature**: Manage archived projects (completed and cancelled)
- **User Story**: As a user, I want to see my completed and cancelled projects separately from active ones
- **Content**: Projects with COMPLETED or CANCELLED status
- **Count Display**: Shows number of archived projects in tab label

#### Areas Tab
- **Feature**: Manage inactive areas of responsibility
- **User Story**: As a user, I want to see areas I'm no longer actively maintaining
- **Content**: Areas with isActive = false
- **Count Display**: Shows number of inactive areas in tab label

### 3. Advanced Filtering System

#### Search Functionality
- **Feature**: Search across archived items by title and description
- **User Story**: As a user, I want to find specific archived items quickly
- **Implementation**: Real-time search with debounced API calls

#### Status Filtering (Projects)
- **Feature**: Filter archived projects by completion status
- **User Story**: As a user, I want to see only completed or only cancelled projects
- **Options**: All Status, Completed, Cancelled
- **Visual Indicators**: Color-coded status badges (green for completed, red for cancelled)

### 4. Bulk Selection System

#### Multi-Select Interface
- **Feature**: Select multiple items for batch operations
- **User Story**: As a user, I want to restore multiple archived items at once
- **Implementation**: 
  - Checkbox on each item card
  - Visual selection feedback
  - Selected count in header

#### Bulk Actions Toolbar
- **Feature**: Perform actions on multiple selected items
- **User Story**: As a user, I want to efficiently manage multiple archived items
- **Actions**: 
  - **Bulk Restore**: Restore all selected items to active status
  - **Selection Count**: Shows "Restore Selected (X)" with count

### 5. Archived Project Cards

#### Project Information Display
- **Status Badge**: Color-coded completion status (green/red)
- **Project Title**: Non-clickable title (archived items are read-only)
- **Description**: Truncated project description
- **Area Association**: Color-coded area badge if project was linked to area
- **Archive Timestamp**: Relative time since archival ("Archived 2w ago")

#### Project Actions Menu
- **Restore Project**: Return project to active status
- **Delete Permanently**: Irreversible deletion with confirmation
- **Menu Access**: Three-dot menu for individual actions

### 6. Archived Area Cards

#### Area Information Display
- **Color Indicator**: Visual color dot for area identification
- **Type Badge**: Area type (Responsibility, Interest, etc.)
- **Area Title**: Non-clickable title (archived items are read-only)
- **Description**: Truncated area description
- **Project Count**: Number of projects that were associated with this area
- **Archive Timestamp**: Relative time since archival

#### Area Actions Menu
- **Restore Area**: Return area to active status
- **Delete Permanently**: Irreversible deletion with confirmation
- **Menu Access**: Three-dot menu for individual actions

### 7. Restoration System

#### Individual Restoration
- **Feature**: Restore single items back to active status
- **User Story**: As a user, I want to reactivate archived items when needed
- **Implementation**: 
  - Confirmation modal for restoration
  - Status change (projects: ACTIVE, areas: isActive = true)
  - Success notification with confirmation

#### Bulk Restoration
- **Feature**: Restore multiple items simultaneously
- **User Story**: As a user, I want to efficiently reactivate multiple archived items
- **Implementation**: 
  - Batch API calls for selected items
  - Progress feedback during bulk operations
  - Success notification with count

#### Restoration Confirmation
- **Feature**: Confirm restoration actions to prevent accidents
- **User Story**: As a user, I want confirmation before reactivating archived items
- **Implementation**: Modal dialog explaining restoration effects

### 8. Time-based Information

#### Relative Time Display
- **Feature**: Human-readable time since archival
- **User Story**: As a user, I want to understand how long items have been archived
- **Implementation**: 
  - "today" for same-day archival
  - "Xd ago" for days (up to 7 days)
  - "Xw ago" for weeks (up to 4 weeks)
  - "Xmo ago" for months

#### Archive Date Tracking
- **Feature**: Track when items were archived
- **User Story**: As a user, I want to know the archival history of my items
- **Implementation**: archivedAt timestamp storage and display

### 9. Empty States

#### No Archived Projects
- **Feature**: Clear empty state for projects tab
- **User Story**: As a user, I want to understand when I have no archived projects
- **Implementation**: 
  - Centered target icon
  - "No archived projects" message
  - Explanation that completed/cancelled projects appear here

#### No Archived Areas
- **Feature**: Clear empty state for areas tab
- **User Story**: As a user, I want to understand when I have no inactive areas
- **Implementation**: 
  - Centered map icon
  - "No archived areas" message
  - Explanation that inactive areas appear here

### 10. Safety and Confirmation Features

#### Restoration Confirmation Modal
- **Feature**: Prevent accidental restoration
- **User Story**: As a user, I want to confirm restoration actions
- **Implementation**: 
  - Modal with item title
  - Clear explanation of restoration effects
  - Cancel and confirm buttons

#### Permanent Deletion Warning
- **Feature**: Warn about irreversible deletion
- **User Story**: As a user, I want clear warning before permanently deleting items
- **Implementation**: 
  - Strong warning language
  - Confirmation requirement
  - No accidental deletion protection

## User Interaction Flows

### Archive Browsing Flow
1. User enters archive page
2. Views tabs for projects and areas
3. Switches between tabs to see different archived content
4. Uses search and filters to find specific items
5. Reviews archived items with timestamps

### Individual Restoration Flow
1. User finds archived item to restore
2. Uses action menu to select "Restore"
3. Confirms restoration in modal dialog
4. Sees success notification
5. Item disappears from archive (now active)

### Bulk Restoration Flow
1. User selects multiple archived items using checkboxes
2. Bulk action toolbar appears with selected count
3. Clicks "Restore Selected" button
4. Confirms bulk restoration action
5. Sees progress and success notification
6. Selected items disappear from archive

### Archive Management Flow
1. User reviews archived content periodically
2. Identifies items to restore or permanently delete
3. Uses individual or bulk operations as needed
4. Maintains clean archive with relevant historical items

## Performance Considerations

### Efficient Loading
- **Feature**: Optimized loading of archived content
- **Implementation**: 
  - Pagination with 12 items per page
  - Separate API calls for projects and areas
  - Lazy loading of tab content

### Bulk Operation Optimization
- **Feature**: Efficient bulk operations
- **Implementation**: 
  - Batch API calls for multiple items
  - Progress feedback for long operations
  - Error handling for partial failures

## Integration Points
- **Projects System**: Manages completed and cancelled projects
- **Areas System**: Manages inactive areas
- **Notification System**: Success and error notifications
- **Search System**: Archived items can be searched
- **Audit System**: Tracks restoration and deletion actions
