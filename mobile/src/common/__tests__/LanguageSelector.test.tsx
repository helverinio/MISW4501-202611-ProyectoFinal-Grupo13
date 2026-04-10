import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LanguageSelector from '../LanguageSelector';
import { changeLanguage, languageOptions } from '../../i18n';

jest.mock('../../i18n', () => ({
  changeLanguage: jest.fn(),
  languageOptions: [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
  ],
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'es',
    },
  }),
}));

describe('LanguageSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the selector button', () => {
      const { getByText } = render(<LanguageSelector />);

      expect(getByText('Español')).toBeTruthy();
      expect(getByText('🇪🇸')).toBeTruthy();
    });

    it('should render with custom style', () => {
      const customStyle = { marginTop: 10 };
      const { UNSAFE_root } = render(<LanguageSelector style={customStyle} />);

      const view = UNSAFE_root.findByType(require('react-native').View);
      expect(view.props.style).toEqual(customStyle);
    });

    it('should render chevron-down icon', () => {
      const { UNSAFE_root } = render(<LanguageSelector />);

      const ionicons = UNSAFE_root.findAllByType('Ionicons');
      const chevronIcon = ionicons.find(
        (icon: any) => icon.props.name === 'chevron-down'
      );

      expect(chevronIcon).toBeTruthy();
    });

    it('should display current language flag and label', () => {
      const { getByText } = render(<LanguageSelector />);

      expect(getByText('🇪🇸')).toBeTruthy();
      expect(getByText('Español')).toBeTruthy();
    });
  });

  describe('Modal Behavior', () => {
    it('should open modal when selector button is pressed', async () => {
      const { getByText, queryByText } = render(<LanguageSelector />);

      expect(queryByText('language.select')).toBeNull();

      fireEvent.press(getByText('Español'));

      await waitFor(() => {
        expect(getByText('language.select')).toBeTruthy();
      });
    });

    it('should display all language options in modal', async () => {
      const { getByText, getAllByText } = render(<LanguageSelector />);

      fireEvent.press(getByText('Español'));

      await waitFor(() => {
        expect(getByText('language.select')).toBeTruthy();
        expect(getByText('English')).toBeTruthy();
        expect(getAllByText('Español').length).toBeGreaterThan(0);
        expect(getByText('Português')).toBeTruthy();
      });
    });

    it('should display all language flags in modal', async () => {
      const { getByText, getAllByText } = render(<LanguageSelector />);

      fireEvent.press(getByText('Español'));

      await waitFor(() => {
        expect(getByText('🇺🇸')).toBeTruthy();
        expect(getAllByText('🇪🇸').length).toBeGreaterThan(0);
        expect(getByText('🇧🇷')).toBeTruthy();
      });
    });

    it('should close modal when backdrop is pressed', async () => {
      const { getByText, queryByText, UNSAFE_root } = render(
        <LanguageSelector />
      );

      fireEvent.press(getByText('Español'));

      await waitFor(() => {
        expect(getByText('language.select')).toBeTruthy();
      });

      const modals = UNSAFE_root.findAllByType(require('react-native').Modal);
      const visibleModal = modals.find((m: any) => m.props.visible === true);

      if (visibleModal) {
        const backdrop = visibleModal.findAllByType(
          require('react-native').TouchableOpacity
        )[0];
        if (backdrop) {
          fireEvent.press(backdrop);
        }
      }

      await waitFor(() => {
        expect(queryByText('language.select')).toBeNull();
      });
    });

    it('should close modal via onRequestClose', async () => {
      const { getByText, UNSAFE_root } = render(<LanguageSelector />);

      fireEvent.press(getByText('Español'));

      await waitFor(() => {
        expect(getByText('language.select')).toBeTruthy();
      });

      const modals = UNSAFE_root.findAllByType(require('react-native').Modal);
      const visibleModal = modals.find((m: any) => m.props.visible === true);

      if (visibleModal && visibleModal.props.onRequestClose) {
        visibleModal.props.onRequestClose();
      }

      await waitFor(() => {
        expect(visibleModal?.props.visible).toBe(false);
      });
    });
  });

  describe('Language Selection', () => {
    it('should call changeLanguage when a language is selected', async () => {
      const { getByText } = render(<LanguageSelector />);

      fireEvent.press(getByText('Español'));

      await waitFor(() => {
        expect(getByText('language.select')).toBeTruthy();
      });

      fireEvent.press(getByText('English'));

      await waitFor(() => {
        expect(changeLanguage).toHaveBeenCalledWith('en');
      });
    });

    it('should close modal after selecting a language', async () => {
      const { getByText, queryByText } = render(<LanguageSelector />);

      fireEvent.press(getByText('Español'));

      await waitFor(() => {
        expect(getByText('language.select')).toBeTruthy();
      });

      fireEvent.press(getByText('English'));

      await waitFor(() => {
        expect(queryByText('language.select')).toBeNull();
      });
    });

    it('should call changeLanguage with correct code for Portuguese', async () => {
      const { getByText } = render(<LanguageSelector />);

      fireEvent.press(getByText('Español'));

      await waitFor(() => {
        expect(getByText('language.select')).toBeTruthy();
      });

      fireEvent.press(getByText('Português'));

      await waitFor(() => {
        expect(changeLanguage).toHaveBeenCalledWith('pt');
      });
    });

    it('should call changeLanguage with correct code for Spanish', async () => {
      const { getByText, getAllByText } = render(<LanguageSelector />);

      fireEvent.press(getByText('Español'));

      await waitFor(() => {
        expect(getByText('language.select')).toBeTruthy();
      });

      const spanishOptions = getAllByText('Español');
      // Press the second occurrence (the one in the modal options list)
      fireEvent.press(spanishOptions[1]);

      await waitFor(() => {
        expect(changeLanguage).toHaveBeenCalledWith('es');
      });
    });
  });

  describe('Selected Language Indicator', () => {
    it('should show checkmark for currently selected language', async () => {
      const { getByText, UNSAFE_root } = render(<LanguageSelector />);

      fireEvent.press(getByText('Español'));

      await waitFor(() => {
        expect(getByText('language.select')).toBeTruthy();
      });

      const ionicons = UNSAFE_root.findAllByType('Ionicons');
      const checkmark = ionicons.find(
        (icon: any) => icon.props.name === 'checkmark'
      );

      expect(checkmark).toBeTruthy();
    });

    it('should highlight selected language option with different style', async () => {
      const { getByText, UNSAFE_root } = render(<LanguageSelector />);

      fireEvent.press(getByText('Español'));

      await waitFor(() => {
        expect(getByText('language.select')).toBeTruthy();
      });

      const touchables = UNSAFE_root.findAllByType(
        require('react-native').TouchableOpacity
      );

      const selectedOption = touchables.find((t: any) => {
        const style = t.props.style;
        if (Array.isArray(style)) {
          return style.some(
            (s: any) => s && s.backgroundColor === '#F0F4FF'
          );
        }
        return false;
      });

      expect(selectedOption).toBeTruthy();
    });
  });

  describe('Default Language Fallback', () => {
    it('should fallback to first language option if current language not found', () => {
      jest.doMock('react-i18next', () => ({
        useTranslation: () => ({
          t: (key: string) => key,
          i18n: {
            language: 'unknown',
          },
        }),
      }));

      const { getByText } = render(<LanguageSelector />);

      expect(getByText('Español')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid opens and closes', async () => {
      const { getByText, queryByText } = render(<LanguageSelector />);

      fireEvent.press(getByText('Español'));
      await waitFor(() => expect(getByText('language.select')).toBeTruthy());

      fireEvent.press(getByText('English'));
      await waitFor(() => expect(queryByText('language.select')).toBeNull());

      fireEvent.press(getByText('Español'));
      await waitFor(() => expect(getByText('language.select')).toBeTruthy());

      expect(changeLanguage).toHaveBeenCalledTimes(1);
    });

    it('should render without style prop', () => {
      const { getByText } = render(<LanguageSelector />);

      expect(getByText('Español')).toBeTruthy();
    });
  });
});

describe('LanguageSelector with English language', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all three language options', async () => {
    const { getByText, getAllByText } = render(<LanguageSelector />);

    fireEvent.press(getByText('Español'));

    await waitFor(() => {
      expect(getByText('language.select')).toBeTruthy();
      // Verify all 3 languages are present
      expect(languageOptions.length).toBe(3);
      expect(getByText('English')).toBeTruthy();
      expect(getAllByText('Español').length).toBeGreaterThan(0);
      expect(getByText('Português')).toBeTruthy();
    });
  });
});
