/**
 * LinkedAccountWidget - Public API exports
 *
 * This module exports the LinkedAccountWidget component and its public types.
 * Internal components, hooks, and utilities are not exported to maintain
 * encapsulation and prevent breaking changes in the public API.
 *
 * @packageDocumentation
 */

// Main component export
export { LinkedAccountWidget } from './LinkedAccountWidget';

// Table view component export (alternate view)
export { LinkedAccountsTableView } from './components/LinkedAccountsTableView';
export type { LinkedAccountsTableViewProps } from './components/LinkedAccountsTableView';

// Public type exports
export type { LinkedAccountWidgetProps } from './LinkedAccountWidget.types';
