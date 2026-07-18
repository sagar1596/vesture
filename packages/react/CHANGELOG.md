# @vesture/react

## 0.2.1

### Patch Changes

- 4824fb6: Republish with a correct build. The 0.2.0 release on npm was missing Calendar, DatePicker, and DateRangePicker despite the changelog listing them — a stale build artifact was published instead of a fresh one. This release contains no source changes beyond the previous patch (DataGrid filtering) and Calendar/DatePicker/DateRangePicker addition, just a corrected build output.

## 0.2.0

### Minor Changes

- 590ae52: Add Calendar, DatePicker, and DateRangePicker components. Calendar also gains an optional `rangeEnd` prop for visually highlighting a date range, used by DateRangePicker but backward compatible with existing single-date usage.

## 0.1.1

### Patch Changes

- 6646436: Verify npm Trusted Publishing (OIDC) end-to-end. No functional changes.
- Updated dependencies [6646436]
  - @vesture/tokens@0.1.1
