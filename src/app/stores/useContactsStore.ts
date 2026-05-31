import { create } from 'zustand';
import { toggleContactController, getContactIdsController } from '../controllers/EmpresaController';

interface ContactsState {
  contactedIds: Set<string>;
  loadContacts: () => Promise<void>;
  toggleContact: (id: string) => Promise<void>;
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contactedIds: new Set(),

  loadContacts: async () => {
    try {
      const ids = await getContactIdsController();
      set({ contactedIds: new Set(ids) });
    } catch {
      set({ contactedIds: new Set() });
    }
  },

  toggleContact: async (id: string) => {
    try {
      const isContacted = await toggleContactController(id);
      set((state) => {
        const newSet = new Set(state.contactedIds);
        if (isContacted) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
        return { contactedIds: newSet };
      });
    } catch {
      // silently fail
    }
  },
}));
