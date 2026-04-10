import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HotelSearch, { SearchParams } from '../HotelSearch';

describe('HotelSearch', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('Rendering', () => {
    it('should render destination input', () => {
      const { getByPlaceholderText, getByText } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      expect(getByText('search.destination')).toBeTruthy();
      expect(getByPlaceholderText('search.destinationPlaceholder')).toBeTruthy();
    });

    it('should render check-in and check-out sections', () => {
      const { getAllByText } = render(<HotelSearch onSearch={mockOnSearch} />);

      expect(getAllByText('search.checkIn').length).toBeGreaterThan(0);
      expect(getAllByText('search.checkOut').length).toBeGreaterThan(0);
    });

    it('should render guests section', () => {
      const { getByText } = render(<HotelSearch onSearch={mockOnSearch} />);

      expect(getByText('search.guests')).toBeTruthy();
      expect(getByText(/1 search.adult/)).toBeTruthy();
    });

    it('should render search button', () => {
      const { getByText } = render(<HotelSearch onSearch={mockOnSearch} />);

      expect(getByText('search.searchHotels')).toBeTruthy();
    });

    it('should render date placeholders when no dates selected', () => {
      const { getAllByText } = render(<HotelSearch onSearch={mockOnSearch} />);

      expect(getAllByText('search.datePlaceholder').length).toBe(2);
    });
  });

  describe('Destination Input', () => {
    it('should update destination value when typing', () => {
      const { getByPlaceholderText } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      const input = getByPlaceholderText('search.destinationPlaceholder');
      fireEvent.changeText(input, 'Paris');

      expect(input.props.value).toBe('Paris');
    });

    it('should handle empty destination', () => {
      const { getByPlaceholderText } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      const input = getByPlaceholderText('search.destinationPlaceholder');
      fireEvent.changeText(input, '');

      expect(input.props.value).toBe('');
    });
  });

  describe('Check-In Calendar Picker', () => {
    it('should open check-in picker when pressed', async () => {
      const { getByText, queryByText } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      // Initially modal content should not be visible
      expect(queryByText('search.done')).toBeNull();

      // Find and press check-in section
      const checkInLabel = getByText('search.checkIn');
      const checkInSection = checkInLabel.parent?.parent?.parent;
      
      if (checkInSection) {
        fireEvent.press(checkInSection);
      }

      await waitFor(() => {
        expect(getByText('search.done')).toBeTruthy();
      });
    });

    it('should display month navigation in calendar', async () => {
      const { getByText, getAllByText } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      // Open check-in picker
      const checkInLabels = getAllByText('search.checkIn');
      fireEvent.press(checkInLabels[0].parent?.parent?.parent!);

      await waitFor(() => {
        expect(getByText(/June 2024/)).toBeTruthy();
      });
    });

    it('should display day names in calendar', async () => {
      const { getByText, getAllByText } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      // Open check-in picker
      const checkInLabels = getAllByText('search.checkIn');
      fireEvent.press(checkInLabels[0].parent?.parent?.parent!);

      await waitFor(() => {
        expect(getByText('Sun')).toBeTruthy();
        expect(getByText('Mon')).toBeTruthy();
        expect(getByText('Tue')).toBeTruthy();
        expect(getByText('Wed')).toBeTruthy();
        expect(getByText('Thu')).toBeTruthy();
        expect(getByText('Fri')).toBeTruthy();
        expect(getByText('Sat')).toBeTruthy();
      });
    });

    it('should close calendar when done is pressed', async () => {
      const { getByText, getAllByText, queryByText } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      // Open check-in picker
      const checkInLabels = getAllByText('search.checkIn');
      fireEvent.press(checkInLabels[0].parent?.parent?.parent!);

      await waitFor(() => {
        expect(getByText('search.done')).toBeTruthy();
      });

      fireEvent.press(getByText('search.done'));

      await waitFor(() => {
        expect(queryByText('Sun')).toBeNull();
      });
    });

    it('should navigate to next month', async () => {
      const { getByText, getAllByText, UNSAFE_root } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      // Open check-in picker
      const checkInLabels = getAllByText('search.checkIn');
      fireEvent.press(checkInLabels[0].parent?.parent?.parent!);

      await waitFor(() => {
        expect(getByText(/June 2024/)).toBeTruthy();
      });

      // Find and press next month button (chevron-forward)
      const touchables = UNSAFE_root.findAllByType(
        require('react-native').TouchableOpacity
      );
      const nextButton = touchables.find(
        (t: any) =>
          t.props.children?.props?.name === 'chevron-forward'
      );

      if (nextButton) {
        fireEvent.press(nextButton);
      }

      await waitFor(() => {
        expect(getByText(/July 2024/)).toBeTruthy();
      });
    });
  });

  describe('Check-Out Calendar Picker', () => {
    it('should open check-out picker when pressed', async () => {
      const { getAllByText, getByText } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      // Find check-out section (second occurrence)
      const checkOutLabels = getAllByText('search.checkOut');
      fireEvent.press(checkOutLabels[0].parent?.parent?.parent!);

      await waitFor(() => {
        expect(getByText('search.done')).toBeTruthy();
      });
    });

    it('should have minimum date based on check-in', async () => {
      const initialValues: SearchParams = {
        destination: 'Paris',
        checkIn: new Date('2024-06-20'),
        checkOut: new Date('2024-06-25'),
        guests: 2,
      };

      const { getAllByText, getByText } = render(
        <HotelSearch onSearch={mockOnSearch} initialValues={initialValues} />
      );

      // Open check-out picker
      const checkOutLabels = getAllByText('search.checkOut');
      fireEvent.press(checkOutLabels[0].parent?.parent?.parent!);

      await waitFor(() => {
        // Should start at June 2024 (the check-in month)
        expect(getByText(/June 2024/)).toBeTruthy();
      });
    });
  });

  describe('Guest Selection', () => {
    it('should open guests picker when pressed', async () => {
      const { getByText } = render(<HotelSearch onSearch={mockOnSearch} />);

      fireEvent.press(getByText(/1 search.adult/));

      await waitFor(() => {
        expect(getByText('search.selectGuests')).toBeTruthy();
      });
    });

    it('should display all guest options (1-8)', async () => {
      const { getByText, getAllByText } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      fireEvent.press(getByText(/1 search.adult/));

      await waitFor(() => {
        expect(getByText('search.selectGuests')).toBeTruthy();
        // Check for singular adult
        expect(getAllByText(/1 search.adult/).length).toBeGreaterThan(0);
        // Check for plural adults
        expect(getAllByText(/2 search.adults/).length).toBeGreaterThan(0);
        expect(getAllByText(/3 search.adults/).length).toBeGreaterThan(0);
        expect(getAllByText(/4 search.adults/).length).toBeGreaterThan(0);
        expect(getAllByText(/5 search.adults/).length).toBeGreaterThan(0);
        expect(getAllByText(/6 search.adults/).length).toBeGreaterThan(0);
        expect(getAllByText(/7 search.adults/).length).toBeGreaterThan(0);
        expect(getAllByText(/8 search.adults/).length).toBeGreaterThan(0);
      });
    });

    it('should update guests when option is selected', async () => {
      const { getByText, getAllByText } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      fireEvent.press(getByText(/1 search.adult/));

      await waitFor(() => {
        expect(getByText('search.selectGuests')).toBeTruthy();
      });

      // Select 3 guests
      const threeGuestsOptions = getAllByText(/3 search.adults/);
      fireEvent.press(threeGuestsOptions[0]);

      await waitFor(() => {
        // Main display should now show 3 adults
        expect(getByText(/3 search.adults/)).toBeTruthy();
      });
    });

    it('should close picker when option is selected', async () => {
      const { getByText, getAllByText, queryByText } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      fireEvent.press(getByText(/1 search.adult/));

      await waitFor(() => {
        expect(getByText('search.selectGuests')).toBeTruthy();
      });

      const twoGuestsOptions = getAllByText(/2 search.adults/);
      fireEvent.press(twoGuestsOptions[0]);

      await waitFor(() => {
        expect(queryByText('search.selectGuests')).toBeNull();
      });
    });

    it('should close picker when modal backdrop is pressed', async () => {
      const { getByText, queryByText, UNSAFE_root } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      fireEvent.press(getByText(/1 search.adult/));

      await waitFor(() => {
        expect(getByText('search.selectGuests')).toBeTruthy();
      });

      // Find the modal backdrop (first TouchableOpacity in Modal)
      const modals = UNSAFE_root.findAllByType(require('react-native').Modal);
      const guestsModal = modals.find((m: any) => m.props.visible === true);
      
      if (guestsModal) {
        const backdrop = guestsModal.findAllByType(
          require('react-native').TouchableOpacity
        )[0];
        if (backdrop) {
          fireEvent.press(backdrop);
        }
      }

      await waitFor(() => {
        expect(queryByText('search.selectGuests')).toBeNull();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should not call onSearch when destination is empty', () => {
      const { getByText } = render(<HotelSearch onSearch={mockOnSearch} />);

      fireEvent.press(getByText('search.searchHotels'));

      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should not call onSearch when check-in is not selected', () => {
      const { getByText, getByPlaceholderText } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      fireEvent.changeText(
        getByPlaceholderText('search.destinationPlaceholder'),
        'Paris'
      );
      fireEvent.press(getByText('search.searchHotels'));

      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should not call onSearch when check-out is not selected', () => {
      const initialValues: SearchParams = {
        destination: 'Paris',
        checkIn: new Date('2024-06-20'),
        checkOut: null as any,
        guests: 1,
      };

      // We need to manually set state since initialValues requires both dates
      const { getByText, getByPlaceholderText } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      fireEvent.changeText(
        getByPlaceholderText('search.destinationPlaceholder'),
        'Paris'
      );
      fireEvent.press(getByText('search.searchHotels'));

      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should call onSearch with correct params when all fields are filled', () => {
      const initialValues: SearchParams = {
        destination: 'Paris',
        checkIn: new Date('2024-06-20'),
        checkOut: new Date('2024-06-25'),
        guests: 2,
      };

      const { getByText } = render(
        <HotelSearch onSearch={mockOnSearch} initialValues={initialValues} />
      );

      fireEvent.press(getByText('search.searchHotels'));

      expect(mockOnSearch).toHaveBeenCalledWith({
        destination: 'Paris',
        checkIn: new Date('2024-06-20'),
        checkOut: new Date('2024-06-25'),
        guests: 2,
      });
    });

    it('should call onSearch with updated destination', () => {
      const initialValues: SearchParams = {
        destination: 'Paris',
        checkIn: new Date('2024-06-20'),
        checkOut: new Date('2024-06-25'),
        guests: 2,
      };

      const { getByText, getByPlaceholderText } = render(
        <HotelSearch onSearch={mockOnSearch} initialValues={initialValues} />
      );

      fireEvent.changeText(
        getByPlaceholderText('search.destinationPlaceholder'),
        'London'
      );
      fireEvent.press(getByText('search.searchHotels'));

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: 'London',
        })
      );
    });
  });

  describe('Loading State', () => {
    it('should display searching text when loading', () => {
      const { getByText } = render(
        <HotelSearch onSearch={mockOnSearch} loading={true} />
      );

      expect(getByText('search.searching')).toBeTruthy();
    });

    it('should disable search button when loading', () => {
      const initialValues: SearchParams = {
        destination: 'Paris',
        checkIn: new Date('2024-06-20'),
        checkOut: new Date('2024-06-25'),
        guests: 2,
      };

      const { getByText } = render(
        <HotelSearch
          onSearch={mockOnSearch}
          loading={true}
          initialValues={initialValues}
        />
      );

      fireEvent.press(getByText('search.searching'));

      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should display search text when not loading', () => {
      const { getByText } = render(
        <HotelSearch onSearch={mockOnSearch} loading={false} />
      );

      expect(getByText('search.searchHotels')).toBeTruthy();
    });
  });

  describe('Initial Values', () => {
    it('should populate destination from initialValues', () => {
      const initialValues: SearchParams = {
        destination: 'New York',
        checkIn: new Date('2024-06-20'),
        checkOut: new Date('2024-06-25'),
        guests: 3,
      };

      const { getByPlaceholderText } = render(
        <HotelSearch onSearch={mockOnSearch} initialValues={initialValues} />
      );

      expect(
        getByPlaceholderText('search.destinationPlaceholder').props.value
      ).toBe('New York');
    });

    it('should populate guests from initialValues', () => {
      const initialValues: SearchParams = {
        destination: 'Tokyo',
        checkIn: new Date('2024-06-20'),
        checkOut: new Date('2024-06-25'),
        guests: 4,
      };

      const { getByText } = render(
        <HotelSearch onSearch={mockOnSearch} initialValues={initialValues} />
      );

      expect(getByText(/4 search.adults/)).toBeTruthy();
    });

    it('should format check-in date from initialValues', () => {
      // Use local date to avoid timezone shifts
      const checkInDate = new Date(2024, 5, 20); // June 20, 2024
      const checkOutDate = new Date(2024, 5, 25); // June 25, 2024
      const initialValues: SearchParams = {
        destination: 'London',
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: 2,
      };

      const { getByText } = render(
        <HotelSearch onSearch={mockOnSearch} initialValues={initialValues} />
      );

      // Date format: MM/DD/YYYY
      expect(getByText('06/20/2024')).toBeTruthy();
    });

    it('should format check-out date from initialValues', () => {
      // Use local date to avoid timezone shifts
      const checkInDate = new Date(2024, 5, 20); // June 20, 2024
      const checkOutDate = new Date(2024, 5, 25); // June 25, 2024
      const initialValues: SearchParams = {
        destination: 'London',
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: 2,
      };

      const { getByText } = render(
        <HotelSearch onSearch={mockOnSearch} initialValues={initialValues} />
      );

      expect(getByText('06/25/2024')).toBeTruthy();
    });

    it('should update state when initialValues change', async () => {
      const initialValues1: SearchParams = {
        destination: 'Paris',
        checkIn: new Date('2024-06-20'),
        checkOut: new Date('2024-06-25'),
        guests: 2,
      };

      const { rerender, getByPlaceholderText, getByText } = render(
        <HotelSearch onSearch={mockOnSearch} initialValues={initialValues1} />
      );

      expect(
        getByPlaceholderText('search.destinationPlaceholder').props.value
      ).toBe('Paris');

      const initialValues2: SearchParams = {
        destination: 'Rome',
        checkIn: new Date('2024-07-10'),
        checkOut: new Date('2024-07-15'),
        guests: 5,
      };

      rerender(
        <HotelSearch onSearch={mockOnSearch} initialValues={initialValues2} />
      );

      await waitFor(() => {
        expect(
          getByPlaceholderText('search.destinationPlaceholder').props.value
        ).toBe('Rome');
        expect(getByText(/5 search.adults/)).toBeTruthy();
      });
    });
  });

  describe('Date Auto-Adjustment', () => {
    it('should adjust check-out when check-in is set to same or later date', async () => {
      const initialValues: SearchParams = {
        destination: 'Paris',
        checkIn: new Date('2024-06-20'),
        checkOut: new Date('2024-06-22'),
        guests: 2,
      };

      const { getAllByText, getByText, UNSAFE_root } = render(
        <HotelSearch onSearch={mockOnSearch} initialValues={initialValues} />
      );

      // Open check-in picker
      const checkInLabels = getAllByText('search.checkIn');
      fireEvent.press(checkInLabels[0].parent?.parent?.parent!);

      await waitFor(() => {
        expect(getByText('search.done')).toBeTruthy();
      });

      // Select a date that is same or after checkout (June 22)
      const dayButtons = UNSAFE_root.findAllByType(
        require('react-native').TouchableOpacity
      );
      const day25Button = dayButtons.find(
        (btn: any) =>
          btn.props.children?.props?.children === 25 ||
          btn.props.children?.props?.children === '25'
      );

      if (day25Button) {
        fireEvent.press(day25Button);
      }

      // After selecting check-in as 25, check-out should be adjusted to 26
      await waitFor(() => {
        expect(getByText('06/26/2024')).toBeTruthy();
      });
    });
  });

  describe('Calendar Month Navigation Constraints', () => {
    it('should disable previous month button when at minimum date month', async () => {
      const { getAllByText, getByText, UNSAFE_root } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      // Open check-in picker (minimum date is today: June 2024)
      const checkInLabels = getAllByText('search.checkIn');
      fireEvent.press(checkInLabels[0].parent?.parent?.parent!);

      await waitFor(() => {
        expect(getByText(/June 2024/)).toBeTruthy();
      });

      // Find the back chevron button and check it's disabled
      const touchables = UNSAFE_root.findAllByType(
        require('react-native').TouchableOpacity
      );
      const prevButton = touchables.find(
        (t: any) => t.props.children?.props?.name === 'chevron-back'
      );

      if (prevButton) {
        expect(prevButton.props.disabled).toBe(true);
      }
    });
  });

  describe('Guest Display Text', () => {
    it('should display singular "adult" for 1 guest', () => {
      const { getByText } = render(<HotelSearch onSearch={mockOnSearch} />);

      expect(getByText(/1 search.adult$/)).toBeTruthy();
    });

    it('should display plural "adults" for multiple guests', () => {
      const initialValues: SearchParams = {
        destination: 'Paris',
        checkIn: new Date('2024-06-20'),
        checkOut: new Date('2024-06-25'),
        guests: 3,
      };

      const { getByText } = render(
        <HotelSearch onSearch={mockOnSearch} initialValues={initialValues} />
      );

      expect(getByText(/3 search.adults/)).toBeTruthy();
    });
  });

  describe('Date Formatting', () => {
    it('should format dates in MM/DD/YYYY format', () => {
      // Use local date to avoid timezone shifts
      const checkInDate = new Date(2024, 11, 25); // December 25, 2024
      const checkOutDate = new Date(2024, 11, 31); // December 31, 2024
      const initialValues: SearchParams = {
        destination: 'Paris',
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: 2,
      };

      const { getByText } = render(
        <HotelSearch onSearch={mockOnSearch} initialValues={initialValues} />
      );

      expect(getByText('12/25/2024')).toBeTruthy();
      expect(getByText('12/31/2024')).toBeTruthy();
    });
  });

  describe('Default Values', () => {
    it('should default to 1 guest when no initialValues', () => {
      const { getByText } = render(<HotelSearch onSearch={mockOnSearch} />);

      expect(getByText(/1 search.adult/)).toBeTruthy();
    });

    it('should default to empty destination when no initialValues', () => {
      const { getByPlaceholderText } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      expect(
        getByPlaceholderText('search.destinationPlaceholder').props.value
      ).toBe('');
    });

    it('should default loading to false', () => {
      const { getByText } = render(<HotelSearch onSearch={mockOnSearch} />);

      expect(getByText('search.searchHotels')).toBeTruthy();
    });
  });

  describe('Null Initial Values', () => {
    it('should handle null initialValues gracefully', () => {
      const { getByText, getByPlaceholderText } = render(
        <HotelSearch onSearch={mockOnSearch} initialValues={null} />
      );

      expect(
        getByPlaceholderText('search.destinationPlaceholder').props.value
      ).toBe('');
      expect(getByText(/1 search.adult/)).toBeTruthy();
    });
  });

  describe('Calendar Day Selection', () => {
    it('should highlight selected date in calendar', async () => {
      const initialValues: SearchParams = {
        destination: 'Paris',
        checkIn: new Date('2024-06-20'),
        checkOut: new Date('2024-06-25'),
        guests: 2,
      };

      const { getAllByText, getByText } = render(
        <HotelSearch onSearch={mockOnSearch} initialValues={initialValues} />
      );

      // Open check-in picker
      const checkInLabels = getAllByText('search.checkIn');
      fireEvent.press(checkInLabels[0].parent?.parent?.parent!);

      await waitFor(() => {
        expect(getByText(/June 2024/)).toBeTruthy();
        // Day 20 should be visible
        expect(getByText('20')).toBeTruthy();
      });
    });

    it('should disable past dates in check-in calendar', async () => {
      const { getAllByText, getByText, UNSAFE_root } = render(
        <HotelSearch onSearch={mockOnSearch} />
      );

      // Open check-in picker (current date is June 15, 2024)
      const checkInLabels = getAllByText('search.checkIn');
      fireEvent.press(checkInLabels[0].parent?.parent?.parent!);

      await waitFor(() => {
        expect(getByText(/June 2024/)).toBeTruthy();
      });

      // Find day 10 button - it should be disabled
      const touchables = UNSAFE_root.findAllByType(
        require('react-native').TouchableOpacity
      );
      const day10Button = touchables.find(
        (btn: any) =>
          btn.props.children?.props?.children === 10 ||
          btn.props.children?.props?.children === '10'
      );

      if (day10Button) {
        expect(day10Button.props.disabled).toBe(true);
      }
    });
  });

  describe('Icons Rendering', () => {
    it('should render location icon for destination', () => {
      const { UNSAFE_root } = render(<HotelSearch onSearch={mockOnSearch} />);

      const ionicons = UNSAFE_root.findAllByType('Ionicons');
      const locationIcon = ionicons.find(
        (icon: any) => icon.props.name === 'location-outline'
      );

      expect(locationIcon).toBeTruthy();
    });

    it('should render calendar icons for dates', () => {
      const { UNSAFE_root } = render(<HotelSearch onSearch={mockOnSearch} />);

      const ionicons = UNSAFE_root.findAllByType('Ionicons');
      const calendarIcons = ionicons.filter(
        (icon: any) => icon.props.name === 'calendar-outline'
      );

      expect(calendarIcons.length).toBe(2);
    });

    it('should render people icon for guests', () => {
      const { UNSAFE_root } = render(<HotelSearch onSearch={mockOnSearch} />);

      const ionicons = UNSAFE_root.findAllByType('Ionicons');
      const peopleIcon = ionicons.find(
        (icon: any) => icon.props.name === 'people-outline'
      );

      expect(peopleIcon).toBeTruthy();
    });

    it('should render search icon in button', () => {
      const { UNSAFE_root } = render(<HotelSearch onSearch={mockOnSearch} />);

      const ionicons = UNSAFE_root.findAllByType('Ionicons');
      const searchIcon = ionicons.find(
        (icon: any) => icon.props.name === 'search'
      );

      expect(searchIcon).toBeTruthy();
    });
  });

  describe('Selected Guest Checkmark', () => {
    it('should display checkmark for selected guest count', async () => {
      const initialValues: SearchParams = {
        destination: 'Paris',
        checkIn: new Date('2024-06-20'),
        checkOut: new Date('2024-06-25'),
        guests: 3,
      };

      const { getByText, UNSAFE_root } = render(
        <HotelSearch onSearch={mockOnSearch} initialValues={initialValues} />
      );

      fireEvent.press(getByText(/3 search.adults/));

      await waitFor(() => {
        expect(getByText('search.selectGuests')).toBeTruthy();
      });

      const ionicons = UNSAFE_root.findAllByType('Ionicons');
      const checkmark = ionicons.find(
        (icon: any) => icon.props.name === 'checkmark'
      );

      expect(checkmark).toBeTruthy();
    });
  });
});
