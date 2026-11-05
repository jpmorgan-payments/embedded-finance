import { isDetailFieldId, type DetailFieldId } from './details';
import { setCellValue, setDetailValue, setGridValue } from './grid-values';
import {
  createClient,
  createPerson,
  isClientBlank,
  type ClientDraft,
  type GridColumnKey,
  type PersonField,
  type PersonRoleFlag,
} from './model';
import { cleanCell } from './normalize';
import type { ColumnId } from './sheet-columns';
import type { IssueFix } from './validate';

export interface BuilderState {
  clients: ClientDraft[];
  /** Show errors on untouched rows too (after a download attempt). */
  showAllErrors: boolean;
  /** Unsaved changes since the last download. */
  dirty: boolean;
}

export type BuilderAction =
  | { type: 'addClients'; count: number }
  | { type: 'appendClient'; client: ClientDraft }
  | { type: 'removeClient'; clientId: string }
  | {
      type: 'setGridValue';
      clientId: string;
      key: GridColumnKey;
      value: string;
    }
  | {
      type: 'setPersonField';
      clientId: string;
      personIndex: number;
      field: PersonField;
      value: string;
    }
  | {
      type: 'setPersonRole';
      clientId: string;
      personIndex: number;
      role: PersonRoleFlag;
      value: boolean;
    }
  | {
      type: 'setDetail';
      clientId: string;
      /** null for the business, otherwise the person's index. */
      personIndex: number | null;
      field: DetailFieldId;
      value: string;
    }
  | { type: 'addPerson'; clientId: string }
  | { type: 'removePerson'; clientId: string; personIndex: number }
  | { type: 'applyFixes'; fixes: { clientId: string; fix: IssueFix }[] }
  | {
      type: 'paste';
      /** Existing rows to fill, in on-screen order, starting at the focused row. */
      targetClientIds: string[];
      /** Visible columns from the focused cell to the right. */
      columns: ColumnId[];
      rows: string[][];
    }
  | { type: 'import'; clients: ClientDraft[]; mode: 'append' | 'replace' }
  | { type: 'removeBlankClients' }
  | { type: 'clearAll' }
  | { type: 'revealAllErrors' }
  | { type: 'markSaved' };

export function createInitialState(): BuilderState {
  return { clients: [createClient()], showAllErrors: false, dirty: false };
}

function updateClient(
  state: BuilderState,
  clientId: string,
  update: (client: ClientDraft) => ClientDraft
): BuilderState {
  let changed = false;
  const clients = state.clients.map((client) => {
    if (client.id !== clientId) return client;
    const next = update(client);
    if (next === client) return client;
    changed = true;
    return { ...next, touched: true };
  });
  return changed ? { ...state, clients, dirty: true } : state;
}

function withoutTrailingBlanks(clients: ClientDraft[]): ClientDraft[] {
  let end = clients.length;
  while (end > 0 && isClientBlank(clients[end - 1])) end -= 1;
  return clients.slice(0, end);
}

export function builderReducer(
  state: BuilderState,
  action: BuilderAction
): BuilderState {
  switch (action.type) {
    case 'addClients':
      return {
        ...state,
        clients: [
          ...state.clients,
          ...Array.from({ length: action.count }, () => createClient()),
        ],
      };

    case 'appendClient':
      return { ...state, clients: [...state.clients, action.client] };

    case 'removeClient': {
      const clients = state.clients.filter((c) => c.id !== action.clientId);
      return {
        ...state,
        clients: clients.length > 0 ? clients : [createClient()],
        dirty: true,
      };
    }

    case 'setGridValue':
      return updateClient(state, action.clientId, (client) =>
        setGridValue(client, action.key, action.value)
      );

    case 'setPersonField':
      return updateClient(state, action.clientId, (client) => {
        const person = client.people[action.personIndex];
        const value = cleanCell(action.value);
        if (!person || person[action.field] === value) return client;
        const people = [...client.people];
        people[action.personIndex] = { ...person, [action.field]: value };
        return { ...client, people };
      });

    case 'setPersonRole':
      return updateClient(state, action.clientId, (client) => {
        const person = client.people[action.personIndex];
        if (!person || person[action.role] === action.value) return client;
        const people = [...client.people];
        people[action.personIndex] = { ...person, [action.role]: action.value };
        return { ...client, people };
      });

    case 'setDetail':
      return updateClient(state, action.clientId, (client) =>
        setDetailValue(client, action.personIndex, action.field, action.value)
      );

    case 'addPerson':
      return updateClient(state, action.clientId, (client) => ({
        ...client,
        people: [...client.people, createPerson()],
      }));

    case 'removePerson':
      if (action.personIndex === 0) return state;
      return updateClient(state, action.clientId, (client) => ({
        ...client,
        people: client.people.filter((_, i) => i !== action.personIndex),
      }));

    case 'applyFixes': {
      let next = state;
      for (const { clientId, fix } of action.fixes) {
        next = isDetailFieldId(fix.field)
          ? builderReducer(next, {
              type: 'setDetail',
              clientId,
              personIndex: fix.personIndex,
              field: fix.field,
              value: fix.value,
            })
          : fix.personIndex === null
            ? next
            : builderReducer(next, {
                type: 'setPersonField',
                clientId,
                personIndex: fix.personIndex,
                field: fix.field,
                value: fix.value,
              });
      }
      return next;
    }

    case 'paste': {
      const columns = action.columns;
      if (columns.length === 0 || action.rows.length === 0) return state;
      const byId = new Map(state.clients.map((c) => [c.id, c]));
      const updates = new Map<string, ClientDraft>();
      const appended: ClientDraft[] = [];

      action.rows.forEach((cells, rowIndex) => {
        const targetId = action.targetClientIds[rowIndex];
        let client =
          (targetId && byId.get(targetId)) || createClient({ touched: true });
        columns.forEach((column, columnIndex) => {
          if (columnIndex < cells.length) {
            client = setCellValue(client, column, cells[columnIndex]);
          }
        });
        client = { ...client, touched: true };
        if (targetId && byId.has(targetId)) updates.set(targetId, client);
        else appended.push(client);
      });

      return {
        ...state,
        clients: [
          ...state.clients.map((c) => updates.get(c.id) ?? c),
          ...appended,
        ],
        dirty: true,
      };
    }

    case 'import': {
      const base =
        action.mode === 'replace' ? [] : withoutTrailingBlanks(state.clients);
      const clients = [...base, ...action.clients];
      return {
        ...state,
        clients: clients.length > 0 ? clients : [createClient()],
        dirty: true,
      };
    }

    case 'removeBlankClients': {
      const clients = state.clients.filter((c) => !isClientBlank(c));
      return {
        ...state,
        clients: clients.length > 0 ? clients : [createClient()],
      };
    }

    case 'clearAll':
      return createInitialState();

    case 'revealAllErrors':
      return state.showAllErrors ? state : { ...state, showAllErrors: true };

    case 'markSaved':
      return state.dirty ? { ...state, dirty: false } : state;
  }
}
