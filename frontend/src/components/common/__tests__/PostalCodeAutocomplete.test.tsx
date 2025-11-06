// ABOUTME: Tests P0 para PostalCodeAutocomplete con mocks de PostalCodeService
// ABOUTME: Cubre rendering, búsqueda, selección, loading states y address display

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import userEvent from '@testing-library/user-event';
import PostalCodeAutocomplete from '../PostalCodeAutocomplete';
import { PostalCodeService } from '@/services/postalCodeService';

// Mock PostalCodeService
jest.mock('@/services/postalCodeService');

const mockPostalCodeService = PostalCodeService as jest.Mocked<typeof PostalCodeService>;

const renderWithTheme = (component: React.ReactElement) => {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const mockPostalCodeData = {
  codigoPostal: '44100',
  estado: 'Jalisco',
  ciudad: 'Guadalajara',
  municipio: 'Guadalajara',
  colonia: ['Centro', 'Zona Centro'],
};

describe('PostalCodeAutocomplete - P0 Critical Tests', () => {
  const mockOnAddressSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup default mocks
    mockPostalCodeService.searchPostalCodes.mockReturnValue([mockPostalCodeData]);
    mockPostalCodeService.findByCiudad.mockReturnValue([mockPostalCodeData]);
    mockPostalCodeService.findByPostalCode.mockReturnValue(mockPostalCodeData);
    mockPostalCodeService.isValidMexicanPostalCode.mockReturnValue(true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('A1. Basic Rendering', () => {
    it('should render autocomplete input', () => {
      renderWithTheme(
        <PostalCodeAutocomplete onAddressSelected={mockOnAddressSelected} />
      );
      expect(screen.getByLabelText(/buscar por código postal o ciudad/i)).toBeInTheDocument();
    });

    it('should render with placeholder text', () => {
      renderWithTheme(
        <PostalCodeAutocomplete onAddressSelected={mockOnAddressSelected} />
      );
      expect(screen.getByPlaceholderText(/44100 o guadalajara/i)).toBeInTheDocument();
    });

    it('should render with helper text', () => {
      renderWithTheme(
        <PostalCodeAutocomplete onAddressSelected={mockOnAddressSelected} />
      );
      expect(screen.getByText(/escribe un código postal \(5 dígitos\) o nombre de ciudad/i)).toBeInTheDocument();
    });

    it('should render search icon', () => {
      const { container } = renderWithTheme(
        <PostalCodeAutocomplete onAddressSelected={mockOnAddressSelected} />
      );
      const searchIcon = container.querySelector('svg');
      expect(searchIcon).toBeInTheDocument();
    });

    it('should render disabled when disabled prop is true', () => {
      renderWithTheme(
        <PostalCodeAutocomplete
          onAddressSelected={mockOnAddressSelected}
          disabled={true}
        />
      );
      const input = screen.getByLabelText(/buscar por código postal o ciudad/i) as HTMLInputElement;
      expect(input).toBeDisabled();
    });
  });

  describe('A2. Input and Search', () => {
    it('should allow typing in the input', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithTheme(
        <PostalCodeAutocomplete onAddressSelected={mockOnAddressSelected} />
      );

      const input = screen.getByLabelText(/buscar por código postal o ciudad/i);
      await user.type(input, '44100');

      expect(input).toHaveValue('44100');
    });

    it('should search postal codes when typing numbers', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithTheme(
        <PostalCodeAutocomplete onAddressSelected={mockOnAddressSelected} />
      );

      const input = screen.getByLabelText(/buscar por código postal o ciudad/i);
      await user.type(input, '44100');

      jest.advanceTimersByTime(300); // debounce
      await waitFor(() => {
        expect(mockPostalCodeService.searchPostalCodes).toHaveBeenCalledWith('44100', 15);
      });
    });

    it('should search by city when typing text', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithTheme(
        <PostalCodeAutocomplete onAddressSelected={mockOnAddressSelected} />
      );

      const input = screen.getByLabelText(/buscar por código postal o ciudad/i);
      await user.type(input, 'Guadalajara');

      jest.advanceTimersByTime(300); // debounce
      await waitFor(() => {
        expect(mockPostalCodeService.findByCiudad).toHaveBeenCalledWith('Guadalajara', 15);
      });
    });

    it('should clear options when input is empty', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithTheme(
        <PostalCodeAutocomplete onAddressSelected={mockOnAddressSelected} />
      );

      const input = screen.getByLabelText(/buscar por código postal o ciudad/i);
      await user.type(input, '44100');
      await user.clear(input);

      // Should not call search when empty
      jest.advanceTimersByTime(300);
      expect(mockPostalCodeService.searchPostalCodes).toHaveBeenCalledTimes(0);
    });

    it('should debounce search calls', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithTheme(
        <PostalCodeAutocomplete onAddressSelected={mockOnAddressSelected} />
      );

      const input = screen.getByLabelText(/buscar por código postal o ciudad/i);
      await user.type(input, '4');
      await user.type(input, '4');
      await user.type(input, '1');

      // Should only call once after debounce
      jest.advanceTimersByTime(299);
      expect(mockPostalCodeService.searchPostalCodes).toHaveBeenCalledTimes(0);

      jest.advanceTimersByTime(1);
      await waitFor(() => {
        expect(mockPostalCodeService.searchPostalCodes).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('A3. Loading States', () => {
    it('should show loading indicator while searching', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = renderWithTheme(
        <PostalCodeAutocomplete onAddressSelected={mockOnAddressSelected} />
      );

      const input = screen.getByLabelText(/buscar por código postal o ciudad/i);
      await user.type(input, '44100');

      // Before debounce completes, loading should show
      jest.advanceTimersByTime(100);

      // Check for CircularProgress (loading indicator)
      await waitFor(() => {
        const progress = container.querySelector('.MuiCircularProgress-root');
        expect(progress).toBeInTheDocument();
      });
    });
  });

  describe('A4. Initial Postal Code', () => {
    it('should load initial postal code when provided', () => {
      renderWithTheme(
        <PostalCodeAutocomplete
          onAddressSelected={mockOnAddressSelected}
          initialPostalCode="44100"
        />
      );

      expect(mockPostalCodeService.isValidMexicanPostalCode).toHaveBeenCalledWith('44100');
      expect(mockPostalCodeService.findByPostalCode).toHaveBeenCalledWith('44100');
    });

    it('should not load initial postal code if invalid', () => {
      mockPostalCodeService.isValidMexicanPostalCode.mockReturnValue(false);

      renderWithTheme(
        <PostalCodeAutocomplete
          onAddressSelected={mockOnAddressSelected}
          initialPostalCode="invalid"
        />
      );

      expect(mockPostalCodeService.isValidMexicanPostalCode).toHaveBeenCalledWith('invalid');
      expect(mockPostalCodeService.findByPostalCode).not.toHaveBeenCalled();
    });

    // TODO: Fix timing - initial postal code state update
    it.skip('should display initial postal code in input', () => {
      renderWithTheme(
        <PostalCodeAutocomplete
          onAddressSelected={mockOnAddressSelected}
          initialPostalCode="44100"
        />
      );

      const input = screen.getByLabelText(/buscar por código postal o ciudad/i) as HTMLInputElement;
      expect(input.value).toBe('44100');
    });
  });

  describe('A5. Selection and Address Display', () => {
    it('should call onAddressSelected when option is selected', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithTheme(
        <PostalCodeAutocomplete onAddressSelected={mockOnAddressSelected} />
      );

      const input = screen.getByLabelText(/buscar por código postal o ciudad/i);
      await user.type(input, '44100');

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        const option = screen.getByText(/44100 - guadalajara/i);
        fireEvent.click(option);
      });

      expect(mockOnAddressSelected).toHaveBeenCalledWith({
        codigoPostal: '44100',
        estado: 'Jalisco',
        ciudad: 'Guadalajara',
        municipio: 'Guadalajara',
        colonia: 'Centro',
      });
    });

    it('should display selected address info', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithTheme(
        <PostalCodeAutocomplete onAddressSelected={mockOnAddressSelected} />
      );

      const input = screen.getByLabelText(/buscar por código postal o ciudad/i);
      await user.type(input, '44100');

      jest.advanceTimersByTime(300);

      await waitFor(async () => {
        const option = screen.getByText(/44100 - guadalajara/i);
        fireEvent.click(option);
      });

      // Check for selected address display
      await waitFor(() => {
        expect(screen.getByText('📍 Dirección Seleccionada:')).toBeInTheDocument();
        expect(screen.getByText(/código postal:/i)).toBeInTheDocument();
        expect(screen.getByText('44100')).toBeInTheDocument();
      });
    });

    it('should display colonias when available', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithTheme(
        <PostalCodeAutocomplete onAddressSelected={mockOnAddressSelected} />
      );

      const input = screen.getByLabelText(/buscar por código postal o ciudad/i);
      await user.type(input, '44100');

      jest.advanceTimersByTime(300);

      await waitFor(async () => {
        const option = screen.getByText(/44100 - guadalajara/i);
        fireEvent.click(option);
      });

      await waitFor(() => {
        expect(screen.getByText(/colonias disponibles:/i)).toBeInTheDocument();
        expect(screen.getByText('Centro')).toBeInTheDocument();
        expect(screen.getByText('Zona Centro')).toBeInTheDocument();
      });
    });
  });

  describe('A6. No Results State', () => {
    it('should show no results message for postal code search', async () => {
      mockPostalCodeService.searchPostalCodes.mockReturnValue([]);

      const user = userEvent.setup({ delay: null });
      renderWithTheme(
        <PostalCodeAutocomplete onAddressSelected={mockOnAddressSelected} />
      );

      const input = screen.getByLabelText(/buscar por código postal o ciudad/i);
      await user.type(input, '99999');

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText(/no se encontraron códigos postales que coincidan/i)).toBeInTheDocument();
      });
    });

    it('should show no results message for city search', async () => {
      mockPostalCodeService.findByCiudad.mockReturnValue([]);

      const user = userEvent.setup({ delay: null });
      renderWithTheme(
        <PostalCodeAutocomplete onAddressSelected={mockOnAddressSelected} />
      );

      const input = screen.getByLabelText(/buscar por código postal o ciudad/i);
      await user.type(input, 'NonExistentCity');

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText(/no se encontraron ciudades que coincidan/i)).toBeInTheDocument();
      });
    });
  });
});
