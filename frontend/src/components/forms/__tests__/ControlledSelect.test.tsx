// ABOUTME: Tests P0 críticos para ControlledSelect con react-hook-form
// ABOUTME: Cubre rendering básico, selección simple/múltiple, estados de error y opciones

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import userEvent from '@testing-library/user-event';
import ControlledSelect from '../ControlledSelect';

// Wrapper component for testing with react-hook-form
const TestWrapper = ({
  defaultValues = {},
  children,
}: any) => {
  const { control } = useForm({ defaultValues });
  return <>{typeof children === 'function' ? children({ control }) : children}</>;
};

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('ControlledSelect - P0 Critical Tests', () => {
  const defaultProps = {
    name: 'testSelect',
    label: 'Test Select',
    options: mockOptions,
  };

  describe('A1. Basic Rendering', () => {
    it('should render select with label', () => {
      const { container } = render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} />
          )}
        </TestWrapper>
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(container.querySelector('.MuiInputLabel-root')).toHaveTextContent('Test Select');
    });

    it('should render with required asterisk when required=true', () => {
      const { container } = render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} required />
          )}
        </TestWrapper>
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(container.querySelector('.MuiInputLabel-root')).toHaveTextContent('Test Select *');
    });

    it('should render without asterisk when required=false', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} required={false} />
          )}
        </TestWrapper>
      );

      expect(screen.queryByText(/Test Select \*/)).not.toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render with default emptyLabel "Seleccionar..."', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} />
          )}
        </TestWrapper>
      );

      // Open select
      const select = screen.getByRole('combobox');
      await user.click(select);

      // Check for empty option
      expect(screen.getByText('Seleccionar...')).toBeInTheDocument();
    });

    it('should render with custom emptyLabel', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect
              {...defaultProps}
              control={control}
              emptyLabel="Elige una opción"
            />
          )}
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      await user.click(select);

      expect(screen.getByText('Elige una opción')).toBeInTheDocument();
    });

    it('should NOT render empty option when required=true', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} required />
          )}
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      await user.click(select);

      expect(screen.queryByText('Seleccionar...')).not.toBeInTheDocument();
    });

    it('should NOT render empty option when multiple=true', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} multiple />
          )}
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      await user.click(select);

      expect(screen.queryByText('Seleccionar...')).not.toBeInTheDocument();
    });

    it('should render all options from options prop', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} />
          )}
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      await user.click(select);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('should apply fullWidth by default', () => {
      const { container } = render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} />
          )}
        </TestWrapper>
      );

      const formControl = container.querySelector('.MuiFormControl-root');
      expect(formControl).toHaveClass('MuiFormControl-fullWidth');
    });

    it('should respect fullWidth=false', () => {
      const { container } = render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} fullWidth={false} />
          )}
        </TestWrapper>
      );

      const formControl = container.querySelector('.MuiFormControl-root');
      expect(formControl).not.toHaveClass('MuiFormControl-fullWidth');
    });

    it('should render disabled state', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} disabled />
          )}
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('A3. Option States', () => {
    it('should render disabled options correctly', async () => {
      const user = userEvent.setup();
      const optionsWithDisabled = [
        ...mockOptions,
        { value: 'disabled', label: 'Disabled Option', disabled: true },
      ];

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect
              {...defaultProps}
              control={control}
              options={optionsWithDisabled}
            />
          )}
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      await user.click(select);

      const listbox = screen.getByRole('listbox');
      const disabledOption = within(listbox).getByText('Disabled Option').closest('li');

      expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
    });

    it('should allow mix of enabled and disabled options', async () => {
      const user = userEvent.setup();
      const mixedOptions = [
        { value: 'enabled1', label: 'Enabled 1', disabled: false },
        { value: 'disabled1', label: 'Disabled 1', disabled: true },
        { value: 'enabled2', label: 'Enabled 2', disabled: false },
      ];

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect
              {...defaultProps}
              control={control}
              options={mixedOptions}
            />
          )}
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      await user.click(select);

      const listbox = screen.getByRole('listbox');

      const enabled1 = within(listbox).getByText('Enabled 1').closest('li');
      const disabled1 = within(listbox).getByText('Disabled 1').closest('li');
      const enabled2 = within(listbox).getByText('Enabled 2').closest('li');

      expect(enabled1).not.toHaveAttribute('aria-disabled', 'true');
      expect(disabled1).toHaveAttribute('aria-disabled', 'true');
      expect(enabled2).not.toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('B1. Selection Behavior (Simple Mode)', () => {
    it('should update field value on selection', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper defaultValues={{ testSelect: '' }}>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} />
          )}
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');

      // Open and select option
      await user.click(select);
      await user.click(screen.getByText('Option 2'));

      // Verify selection (MUI Select shows selected value in button)
      expect(select).toHaveTextContent('Option 2');
    });

    it('should allow selecting empty option in simple mode', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper defaultValues={{ testSelect: 'option1' }}>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} />
          )}
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');

      // Initially shows Option 1
      expect(select).toHaveTextContent('Option 1');

      // Select empty option
      await user.click(select);
      await user.click(screen.getByText('Seleccionar...'));

      // Should clear selection
      expect(select).not.toHaveTextContent('Option 1');
    });

    it('should handle selection of first option', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} />
          )}
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      await user.click(select);
      await user.click(screen.getByText('Option 1'));

      expect(select).toHaveTextContent('Option 1');
    });

    it('should handle selection of last option', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} />
          )}
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      await user.click(select);
      await user.click(screen.getByText('Option 3'));

      expect(select).toHaveTextContent('Option 3');
    });

    it('should handle changing selection multiple times', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} />
          )}
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');

      // Select Option 1
      await user.click(select);
      await user.click(screen.getByText('Option 1'));
      expect(select).toHaveTextContent('Option 1');

      // Change to Option 2
      await user.click(select);
      await user.click(screen.getByText('Option 2'));
      expect(select).toHaveTextContent('Option 2');

      // Change to Option 3
      await user.click(select);
      await user.click(screen.getByText('Option 3'));
      expect(select).toHaveTextContent('Option 3');
    });
  });

  describe('D1. react-hook-form Integration', () => {
    it('should integrate with Controller correctly', () => {
      const { container } = render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} />
          )}
        </TestWrapper>
      );

      // Controller renders the select
      expect(container.querySelector('.MuiSelect-select')).toBeInTheDocument();
    });

    it('should propagate field value from react-hook-form', () => {
      render(
        <TestWrapper defaultValues={{ testSelect: 'option2' }}>
          {({ control }: any) => (
            <ControlledSelect {...defaultProps} control={control} />
          )}
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveTextContent('Option 2');
    });
  });
});
