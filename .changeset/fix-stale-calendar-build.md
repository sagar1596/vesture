---
"@vesture/react": patch
---

Republish with a correct build. The 0.2.0 release on npm was missing Calendar, DatePicker, and DateRangePicker despite the changelog listing them — a stale build artifact was published instead of a fresh one. This release contains no source changes beyond the previous patch (DataGrid filtering) and Calendar/DatePicker/DateRangePicker addition, just a corrected build output.
