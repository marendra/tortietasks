# TortieTask Flutter App — Migration Plan

Align the Flutter mobile app with the updated web app architecture.

---

## Summary of Changes

| Area | Flutter (Current) | Web (Target) |
|------|-------------------|--------------|
| Task Status | 5 states: To Do, In Progress, Review, Approved - Ready to Send, Completed | 4 states: In Progress, Review, Approved, Completed |
| Default Status | "To Do" | "In Progress" |
| Participants | Not in task schema | Required for security rules |
| Task Delete | Not implemented | Admin-only delete |
| Security Rules | Basic overview | Complete rules with role-based access |
| Status Colors | Not defined | Blue, Amber, Green, Gray |
| Status Icons | Not defined | Clock, Eye, Check circle, Shield check |

---

## 1. Update Task Status Enum

**File**: `lib/models/models.dart`

### Current
```dart
enum TaskStatus {
  todo,
  inProgress,
  review,
  approvedReadyToSend,
  completed,
}
```

### Target
```dart
enum TaskStatus {
  inProgress,
  review,
  approved,
  completed,
}
```

### Changes
- Remove `todo` and `approvedReadyToSend`
- Rename `approvedReadyToSend` → `approved`
- Update all references throughout the app

---

## 2. Update Task Model

**File**: `lib/models/models.dart`

### Current
```dart
class TaskModel {
  final String id;
  final String title;
  final String description;
  final TaskStatus status;
  final TaskPriority priority;
  final bool isClosed;
  final String assignorId;
  final List<String> assigneeIds;
  final String? clientId;
  final DateTime createdAt;
  final DateTime? updatedAt;
}
```

### Target
```dart
class TaskModel {
  final String id;
  final String title;
  final String description;
  final TaskStatus status;
  final TaskPriority priority;
  final bool isClosed;
  final String assignorId;
  final List<String> assigneeIds;
  final List<String> participants;  // NEW: assignorId + assigneeIds (deduplicated)
  final String? clientId;
  final DateTime createdAt;
  final DateTime? updatedAt;
}
```

### Changes
- Add `participants` field to model
- Update `fromJson` and `toJson` methods
- Ensure `participants` is calculated as `[assignorId, ...assigneeIds].toSet().toList()`

---

## 3. Update Default Task Status

**File**: `lib/services/firebase_service.dart`

### Current
```dart
await FirebaseFirestore.instance.collection('tasks').add({
  'status': 'To Do',
  // ...
});
```

### Target
```dart
await FirebaseFirestore.instance.collection('tasks').add({
  'status': 'In Progress',
  // ...
});
```

### Changes
- Update `createTask()` method to use `'In Progress'` as default
- Ensure `participants` array is included in the document

---

## 4. Add Delete Task Functionality

**File**: `lib/services/firebase_service.dart`

### New Method
```dart
Future<void> deleteTask(String taskId) async {
  await FirebaseFirestore.instance.collection('tasks').doc(taskId).delete();
}
```

### UI Changes
- Add delete button to task cards (admin only)
- Add confirmation dialog before deletion
- Update admin dashboard to pass `isAdmin` flag to task cards

---

## 5. Update Status Workflow UI

**File**: `lib/screens/task_workspace/task_workspace_screen.dart`

### Status Flow
```
In Progress → Review → Approved → Completed
```

### Status Colors
| Status | Color |
|--------|-------|
| In Progress | Blue |
| Review | Amber |
| Approved | Green |
| Completed | Gray |

### Status Icons
| Status | Icon |
|--------|------|
| In Progress | `Icons.schedule` (clock) |
| Review | `Icons.visibility` (eye) |
| Approved | `Icons.check_circle` |
| Completed | `Icons.verified` (shield check) |

### Changes
- Update status dropdown to show only 4 options
- Update status badge colors and icons
- Remove "To Do" from all status selections
- Update rejection flow: admin rejects → status goes back to "In Progress"

---

## 6. Update Security Rules (Firestore)

**File**: `firestore.rules` (deploy from Firebase Console or CLI)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "Admin";
    }

    function getTaskParticipants(taskId) {
      return get(/databases/$(database)/documents/tasks/$(taskId)).data.participants;
    }

    function getTaskAssignorId(taskId) {
      return get(/databases/$(database)/documents/tasks/$(taskId)).data.assignorId;
    }

    // Users
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isAdmin() || (request.auth.uid == userId &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['name']));
      allow delete: if isAdmin();
    }

    // Clients
    match /clients/{clientId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Tasks
    match /tasks/{taskId} {
      allow read: if isAuthenticated() &&
        request.auth.uid in resource.data.participants;
      allow create: if isAdmin();
      allow update: if isAuthenticated() && (
        resource.data.assignorId == request.auth.uid ||
        (request.auth.uid in resource.data.assigneeIds &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly([
           'status', 'updatedAt'
         ]))
      );
      allow delete: if isAdmin();
    }

    // Task Messages
    match /tasks/{taskId}/messages/{messageId} {
      allow read: if isAuthenticated() &&
        request.auth.uid in getTaskParticipants(taskId);
      allow create: if isAuthenticated() &&
        request.auth.uid in getTaskParticipants(taskId) &&
        request.resource.data.senderId == request.auth.uid &&
        request.resource.data.taskId == taskId;
      allow update, delete: if isAuthenticated() && (
        resource.data.senderId == request.auth.uid || isAdmin()
      );
    }

    // Task Files
    match /tasks/{taskId}/files/{fileId} {
      allow read: if isAuthenticated() &&
        request.auth.uid in getTaskParticipants(taskId);
      allow create: if isAuthenticated() &&
        request.auth.uid in getTaskParticipants(taskId) &&
        request.resource.data.uploadedBy == request.auth.uid &&
        request.resource.data.taskId == taskId &&
        request.resource.data.status == "Pending";
      allow update: if isAuthenticated() && (
        isAdmin() || request.auth.uid == getTaskAssignorId(taskId)
      ) && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
        'status', 'approvedBy', 'approvedAt', 'rejectionReason'
      ]);
      allow delete: if isAuthenticated() && (
        isAdmin() || resource.data.uploadedBy == request.auth.uid
      );
    }
  }
}
```

---

## 7. Update Task Queries

**File**: `lib/services/firebase_service.dart` or `lib/providers/providers.dart`

### Current
```dart
// May not include participants filter
Stream<List<TaskModel>> getTasks(String userId) {
  return FirebaseFirestore.instance
    .collection('tasks')
    .where('assigneeIds', arrayContains: userId)
    .snapshots()
    // ...
}
```

### Target
```dart
Stream<List<TaskModel>> getTasks(String userId) {
  return FirebaseFirestore.instance
    .collection('tasks')
    .where('participants', arrayContains: userId)
    .snapshots()
    // ...
}
```

### Changes
- Update all task queries to use `participants` instead of `assigneeIds`
- This ensures compatibility with new security rules

---

## 8. Update Task Creation

**File**: `lib/services/firebase_service.dart`

### Current
```dart
Future<void> createTask({
  required String title,
  required String description,
  required List<String> assigneeIds,
  required String assignorId,
  required TaskPriority priority,
  String? clientId,
}) async {
  await FirebaseFirestore.instance.collection('tasks').add({
    'title': title,
    'description': description,
    'status': 'To Do',
    'priority': priority.name,
    'isClosed': false,
    'assignorId': assignorId,
    'assigneeIds': assigneeIds,
    'clientId': clientId,
    'createdAt': FieldValue.serverTimestamp(),
    'updatedAt': null,
  });
}
```

### Target
```dart
Future<void> createTask({
  required String title,
  required String description,
  required List<String> assigneeIds,
  required String assignorId,
  required TaskPriority priority,
  String? clientId,
}) async {
  final participants = [assignorId, ...assigneeIds].toSet().toList();
  
  await FirebaseFirestore.instance.collection('tasks').add({
    'title': title,
    'description': description,
    'status': 'In Progress',  // Changed from 'To Do'
    'priority': priority.name,
    'isClosed': false,
    'assignorId': assignorId,
    'assigneeIds': assigneeIds,
    'participants': participants,  // NEW: required for security rules
    'clientId': clientId,
    'createdAt': FieldValue.serverTimestamp(),
    'updatedAt': null,
  });
}
```

---

## 9. Update Task Update Methods

**File**: `lib/services/firebase_service.dart`

### When Updating assigneeIds
```dart
Future<void> updateTaskAssignees(String taskId, List<String> newAssigneeIds, String assignorId) async {
  final participants = [assignorId, ...newAssigneeIds].toSet().toList();
  
  await FirebaseFirestore.instance.collection('tasks').doc(taskId).update({
    'assigneeIds': newAssigneeIds,
    'participants': participants,
    'updatedAt': FieldValue.serverTimestamp(),
  });
}
```

### When Updating Status (Employee)
```dart
Future<void> updateTaskStatus(String taskId, TaskStatus newStatus) async {
  await FirebaseFirestore.instance.collection('tasks').doc(taskId).update({
    'status': newStatus.name,
    'updatedAt': FieldValue.serverTimestamp(),
  });
}
```

---

## 10. Update UI Components

### TaskCard Widget
- Add `isAdmin` parameter
- Add delete button (visible only for admins, shows on hover/long-press)
- Add status icon with color
- Update status badge styling

### TaskWorkspaceScreen
- Update status dropdown to 4 options
- Update rejection flow (back to "In Progress")
- Add delete task button for admins

### AdminDashboard
- Add delete task handler with confirmation dialog
- Pass `isAdmin: true` to task cards

### EmployeeDashboard
- No major changes needed
- Ensure status options are updated

---

## 11. Migration Checklist

### Models
- [ ] Update `TaskStatus` enum (remove `todo`, rename `approvedReadyToSend`)
- [ ] Add `participants` field to `TaskModel`
- [ ] Update `fromJson` and `toJson` methods

### Services
- [ ] Update `createTask()` to use `'In Progress'` default
- [ ] Add `participants` array to task creation
- [ ] Add `deleteTask()` method
- [ ] Update task queries to use `participants` field
- [ ] Update task update methods to maintain `participants` array

### UI
- [ ] Update status dropdown options
- [ ] Update status badge colors and icons
- [ ] Add delete button to task cards (admin only)
- [ ] Add confirmation dialog for task deletion
- [ ] Update rejection flow (back to "In Progress")

### Security
- [ ] Deploy updated Firestore rules
- [ ] Test with different user roles
- [ ] Verify participants-based access works

### Testing
- [ ] Test task creation with new default status
- [ ] Test task deletion (admin only)
- [ ] Test status workflow (4 states)
- [ ] Test rejection flow
- [ ] Test with existing tasks (may need manual migration)

---

## 12. Data Migration for Existing Tasks

For existing tasks in Firestore that have old status values:

### Option 1: Manual Migration (Recommended for small datasets)
1. Go to Firebase Console → Firestore
2. Manually update tasks with status "To Do" → "In Progress"
3. Manually update tasks with status "Approved - Ready to Send" → "Approved"
4. Add `participants` field to tasks that don't have it

### Option 2: Cloud Function Migration
```typescript
// Deploy as a one-time Cloud Function
export const migrateTaskStatuses = onCall(async (request) => {
  const tasksRef = admin.firestore().collection('tasks');
  const snapshot = await tasksRef.get();
  
  const batch = admin.firestore().batch();
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const updates: any = {};
    
    // Update status
    if (data.status === 'To Do') {
      updates.status = 'In Progress';
    } else if (data.status === 'Approved - Ready to Send') {
      updates.status = 'Approved';
    }
    
    // Add participants if missing
    if (!data.participants) {
      updates.participants = [data.assignorId, ...data.assigneeIds].toSet().toList();
    }
    
    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
    }
  });
  
  await batch.commit();
  return { success: true, migrated: snapshot.docs.length };
});
```

---

## 13. Timeline Estimate

| Task | Estimated Time |
|------|----------------|
| Update models | 1 hour |
| Update services | 2 hours |
| Update UI components | 3 hours |
| Deploy security rules | 30 minutes |
| Testing | 2 hours |
| Data migration | 1 hour |
| **Total** | **~9.5 hours** |

---

## 14. Risks & Considerations

1. **Breaking Changes**: Existing tasks with "To Do" status will need migration
2. **Security Rules**: Deploy rules before updating Flutter app to avoid access issues
3. **Participants Field**: Must be added to all existing tasks for security rules to work
4. **Offline Support**: Ensure `participants` field is synced properly
5. **Backward Compatibility**: Consider supporting both old and new status values during transition

---

*Plan created: 2026-05-02*
