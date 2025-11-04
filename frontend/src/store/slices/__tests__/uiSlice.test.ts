// ABOUTME: Comprehensive tests for uiSlice Redux slice - sidebar, theme, notifications, loading states, modals

import { configureStore, EnhancedStore } from '@reduxjs/toolkit';
import uiReducer, {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  setGlobalLoading,
  openModal,
  closeModal,
  toggleModal
} from '../uiSlice';

describe('uiSlice', () => {
  let store: EnhancedStore;

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    store = configureStore({
      reducer: {
        ui: uiReducer,
      },
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    localStorageMock.clear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().ui;

      expect(state).toEqual({
        sidebarOpen: true,
        theme: 'light',
        notifications: [],
        loading: {
          global: false,
        },
        modals: {},
      });
    });
  });

  describe('Sidebar Actions', () => {
    describe('toggleSidebar', () => {
      it('should toggle sidebar from open to closed', () => {
        store.dispatch(toggleSidebar());

        const state = store.getState().ui;
        expect(state.sidebarOpen).toBe(false);
      });

      it('should toggle sidebar from closed to open', () => {
        store.dispatch(toggleSidebar());
        store.dispatch(toggleSidebar());

        const state = store.getState().ui;
        expect(state.sidebarOpen).toBe(true);
      });
    });

    describe('setSidebarOpen', () => {
      it('should set sidebar to open', () => {
        store.dispatch(setSidebarOpen(false));
        store.dispatch(setSidebarOpen(true));

        const state = store.getState().ui;
        expect(state.sidebarOpen).toBe(true);
      });

      it('should set sidebar to closed', () => {
        store.dispatch(setSidebarOpen(false));

        const state = store.getState().ui;
        expect(state.sidebarOpen).toBe(false);
      });
    });
  });

  describe('Theme Actions', () => {
    describe('setTheme', () => {
      it('should set theme to dark', () => {
        store.dispatch(setTheme('dark'));

        const state = store.getState().ui;
        expect(state.theme).toBe('dark');
        expect(localStorageMock.getItem('hospital_theme')).toBe('dark');
      });

      it('should set theme to light', () => {
        store.dispatch(setTheme('dark'));
        store.dispatch(setTheme('light'));

        const state = store.getState().ui;
        expect(state.theme).toBe('light');
        expect(localStorageMock.getItem('hospital_theme')).toBe('light');
      });
    });
  });

  describe('Notification Actions', () => {
    describe('addNotification', () => {
      it('should add success notification', () => {
        store.dispatch(
          addNotification({
            type: 'success',
            title: 'Operación exitosa',
            message: 'El paciente fue creado correctamente',
          })
        );

        const state = store.getState().ui;
        expect(state.notifications).toHaveLength(1);
        expect(state.notifications[0]).toMatchObject({
          type: 'success',
          title: 'Operación exitosa',
          message: 'El paciente fue creado correctamente',
        });
        expect(state.notifications[0].id).toBeDefined();
        expect(state.notifications[0].timestamp).toBeDefined();
      });

      it('should add error notification', () => {
        store.dispatch(
          addNotification({
            type: 'error',
            title: 'Error',
            message: 'No se pudo guardar',
          })
        );

        const state = store.getState().ui;
        expect(state.notifications[0].type).toBe('error');
      });

      it('should add notification without message', () => {
        store.dispatch(
          addNotification({
            type: 'info',
            title: 'Información',
          })
        );

        const state = store.getState().ui;
        expect(state.notifications[0].message).toBeUndefined();
      });

      it('should add multiple notifications', () => {
        store.dispatch(
          addNotification({ type: 'success', title: 'Notificación 1' })
        );
        store.dispatch(
          addNotification({ type: 'info', title: 'Notificación 2' })
        );
        store.dispatch(
          addNotification({ type: 'warning', title: 'Notificación 3' })
        );

        const state = store.getState().ui;
        expect(state.notifications).toHaveLength(3);
      });

      it('should limit notifications to 5', () => {
        for (let i = 1; i <= 7; i++) {
          store.dispatch(
            addNotification({ type: 'info', title: `Notificación ${i}` })
          );
        }

        const state = store.getState().ui;
        expect(state.notifications).toHaveLength(5);
        expect(state.notifications[0].title).toBe('Notificación 7');
        expect(state.notifications[4].title).toBe('Notificación 3');
      });

      it('should generate unique IDs for notifications', () => {
        store.dispatch(
          addNotification({ type: 'info', title: 'Notificación 1' })
        );
        store.dispatch(
          addNotification({ type: 'info', title: 'Notificación 2' })
        );

        const state = store.getState().ui;
        expect(state.notifications[0].id).not.toBe(state.notifications[1].id);
      });
    });

    describe('removeNotification', () => {
      it('should remove notification by ID', () => {
        store.dispatch(
          addNotification({ type: 'info', title: 'Notificación 1' })
        );
        store.dispatch(
          addNotification({ type: 'info', title: 'Notificación 2' })
        );

        // Notifications are added with unshift, so Notificación 2 is at [0]
        const notificationId = store.getState().ui.notifications[0].id;
        store.dispatch(removeNotification(notificationId));

        const state = store.getState().ui;
        expect(state.notifications).toHaveLength(1);
        expect(state.notifications[0].title).toBe('Notificación 1');
      });

      it('should not affect other notifications when removing one', () => {
        store.dispatch(
          addNotification({ type: 'info', title: 'Notificación 1' })
        );
        store.dispatch(
          addNotification({ type: 'info', title: 'Notificación 2' })
        );
        store.dispatch(
          addNotification({ type: 'info', title: 'Notificación 3' })
        );

        const notificationId = store.getState().ui.notifications[1].id;
        store.dispatch(removeNotification(notificationId));

        const state = store.getState().ui;
        expect(state.notifications).toHaveLength(2);
        expect(state.notifications[0].title).toBe('Notificación 3');
        expect(state.notifications[1].title).toBe('Notificación 1');
      });
    });

    describe('clearNotifications', () => {
      it('should clear all notifications', () => {
        store.dispatch(
          addNotification({ type: 'info', title: 'Notificación 1' })
        );
        store.dispatch(
          addNotification({ type: 'info', title: 'Notificación 2' })
        );
        store.dispatch(
          addNotification({ type: 'info', title: 'Notificación 3' })
        );

        store.dispatch(clearNotifications());

        const state = store.getState().ui;
        expect(state.notifications).toHaveLength(0);
      });
    });
  });

  describe('Loading Actions', () => {
    describe('setLoading', () => {
      it('should set loading state for specific key', () => {
        store.dispatch(setLoading({ key: 'patients', loading: true }));

        const state = store.getState().ui;
        expect(state.loading.patients).toBe(true);
        expect(state.loading.global).toBe(false);
      });

      it('should set multiple loading keys independently', () => {
        store.dispatch(setLoading({ key: 'patients', loading: true }));
        store.dispatch(setLoading({ key: 'employees', loading: true }));
        store.dispatch(setLoading({ key: 'inventory', loading: false }));

        const state = store.getState().ui;
        expect(state.loading.patients).toBe(true);
        expect(state.loading.employees).toBe(true);
        expect(state.loading.inventory).toBe(false);
      });
    });

    describe('setGlobalLoading', () => {
      it('should set global loading to true', () => {
        store.dispatch(setGlobalLoading(true));

        const state = store.getState().ui;
        expect(state.loading.global).toBe(true);
      });

      it('should set global loading to false', () => {
        store.dispatch(setGlobalLoading(true));
        store.dispatch(setGlobalLoading(false));

        const state = store.getState().ui;
        expect(state.loading.global).toBe(false);
      });
    });
  });

  describe('Modal Actions', () => {
    describe('openModal', () => {
      it('should open a modal', () => {
        store.dispatch(openModal('patientForm'));

        const state = store.getState().ui;
        expect(state.modals.patientForm).toBe(true);
      });

      it('should open multiple modals independently', () => {
        store.dispatch(openModal('patientForm'));
        store.dispatch(openModal('employeeForm'));

        const state = store.getState().ui;
        expect(state.modals.patientForm).toBe(true);
        expect(state.modals.employeeForm).toBe(true);
      });
    });

    describe('closeModal', () => {
      it('should close a modal', () => {
        store.dispatch(openModal('patientForm'));
        store.dispatch(closeModal('patientForm'));

        const state = store.getState().ui;
        expect(state.modals.patientForm).toBe(false);
      });

      it('should close specific modal without affecting others', () => {
        store.dispatch(openModal('patientForm'));
        store.dispatch(openModal('employeeForm'));
        store.dispatch(closeModal('patientForm'));

        const state = store.getState().ui;
        expect(state.modals.patientForm).toBe(false);
        expect(state.modals.employeeForm).toBe(true);
      });
    });

    describe('toggleModal', () => {
      it('should toggle modal from closed to open', () => {
        store.dispatch(toggleModal('patientForm'));

        const state = store.getState().ui;
        expect(state.modals.patientForm).toBe(true);
      });

      it('should toggle modal from open to closed', () => {
        store.dispatch(openModal('patientForm'));
        store.dispatch(toggleModal('patientForm'));

        const state = store.getState().ui;
        expect(state.modals.patientForm).toBe(false);
      });

      it('should toggle modal multiple times', () => {
        store.dispatch(toggleModal('patientForm'));
        store.dispatch(toggleModal('patientForm'));
        store.dispatch(toggleModal('patientForm'));

        const state = store.getState().ui;
        expect(state.modals.patientForm).toBe(true);
      });
    });
  });
});
