import { useUserStore } from '../userStore';
import { User } from '@/models/User';

const createMockUser = (overrides?: Partial<User>): User => ({
  userId: 1,
  username: 'johndoe',
  firstName: 'John',
  lastName: 'Doe',
  createdOn: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('userStore', () => {
  beforeEach(() => {
    useUserStore.setState({
      user: null,
      isLoading: false,
      error: null,
    });
  });

  describe('initial state', () => {
    it('should have null user initially', () => {
      const state = useUserStore.getState();
      expect(state.user).toBeNull();
    });

    it('should have isLoading as false initially', () => {
      const state = useUserStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should have null error initially', () => {
      const state = useUserStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should set user correctly', () => {
      const mockUser = createMockUser();

      useUserStore.getState().setUser(mockUser);

      const state = useUserStore.getState();
      expect(state.user).toEqual(mockUser);
    });

    it('should clear error when setting user', () => {
      useUserStore.setState({ error: 'Some error' });

      const mockUser = createMockUser();

      useUserStore.getState().setUser(mockUser);

      const state = useUserStore.getState();
      expect(state.error).toBeNull();
    });

    it('should set user to null', () => {
      const mockUser = createMockUser();

      useUserStore.getState().setUser(mockUser);
      expect(useUserStore.getState().user).not.toBeNull();

      useUserStore.getState().setUser(null);
      expect(useUserStore.getState().user).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set isLoading to true', () => {
      useUserStore.getState().setLoading(true);

      const state = useUserStore.getState();
      expect(state.isLoading).toBe(true);
    });

    it('should set isLoading to false', () => {
      useUserStore.setState({ isLoading: true });

      useUserStore.getState().setLoading(false);

      const state = useUserStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const errorMessage = 'Something went wrong';

      useUserStore.getState().setError(errorMessage);

      const state = useUserStore.getState();
      expect(state.error).toBe(errorMessage);
    });

    it('should clear error by setting null', () => {
      useUserStore.setState({ error: 'Previous error' });

      useUserStore.getState().setError(null);

      const state = useUserStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('clearUser', () => {
    it('should clear user', () => {
      const mockUser = createMockUser();

      useUserStore.setState({ user: mockUser });

      useUserStore.getState().clearUser();

      const state = useUserStore.getState();
      expect(state.user).toBeNull();
    });

    it('should clear error when clearing user', () => {
      useUserStore.setState({
        user: createMockUser({ username: 'testuser' }),
        error: 'Some error',
      });

      useUserStore.getState().clearUser();

      const state = useUserStore.getState();
      expect(state.error).toBeNull();
    });

    it('should not affect isLoading when clearing user', () => {
      useUserStore.setState({
        user: createMockUser({ username: 'testuser' }),
        isLoading: true,
      });

      useUserStore.getState().clearUser();

      const state = useUserStore.getState();
      expect(state.isLoading).toBe(true);
    });
  });

  describe('state persistence', () => {
    it('should maintain other state when setting user', () => {
      useUserStore.setState({ isLoading: true });

      const mockUser = createMockUser();

      useUserStore.getState().setUser(mockUser);

      const state = useUserStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isLoading).toBe(true);
    });

    it('should maintain user when setting loading', () => {
      const mockUser = createMockUser();

      useUserStore.setState({ user: mockUser });
      useUserStore.getState().setLoading(true);

      const state = useUserStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isLoading).toBe(true);
    });
  });
});
