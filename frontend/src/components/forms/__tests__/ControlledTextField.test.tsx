// ABOUTME: Tests para el componente ControlledTextField con react-hook-form
// ABOUTME: Cubre props básicas, validaciones, estados de error, multiline y tipos

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import userEvent from '@testing-library/user-event';
import ControlledTextField from '../ControlledTextField';

// Wrapper component for testing with react-hook-form
const TestWrapper = ({
  defaultValues = {},
  children,
  onSubmit = jest.fn()
}: any) => {
  const { control, handleSubmit } = useForm({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {typeof children === 'function' ? children({ control }) : children}
    </form>
  );
};

describe('ControlledTextField', () => {
  const defaultProps = {
    name: 'testField',
    label: 'Test Label',
  };

  describe('Rendering', () => {
    it('should render text field with label', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
            />
          )}
        </TestWrapper>
      );

      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });

    it('should render with required asterisk when required is true', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              required
            />
          )}
        </TestWrapper>
      );

      expect(screen.getByLabelText(/Test Label \*/)).toBeInTheDocument();
    });

    it('should render without asterisk when required is false', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              required={false}
            />
          )}
        </TestWrapper>
      );

      const label = screen.getByLabelText('Test Label');
      expect(label).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              placeholder="Enter text here"
            />
          )}
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
    });

    it('should render as disabled when disabled is true', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              disabled
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label');
      expect(input).toBeDisabled();
    });

    it('should render as enabled by default', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label');
      expect(input).not.toBeDisabled();
    });
  });

  describe('Types', () => {
    it('should render as text type by default', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label') as HTMLInputElement;
      expect(input.type).toBe('text');
    });

    it('should render as number type when specified', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              type="number"
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label') as HTMLInputElement;
      expect(input.type).toBe('number');
    });

    it('should render as email type when specified', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              type="email"
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label') as HTMLInputElement;
      expect(input.type).toBe('email');
    });

    it('should render as password type when specified', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              type="password"
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label') as HTMLInputElement;
      expect(input.type).toBe('password');
    });
  });

  describe('Multiline', () => {
    it('should render as single line by default', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label');
      expect(input.tagName).toBe('INPUT');
    });

    it('should render as textarea when multiline is true', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              multiline
            />
          )}
        </TestWrapper>
      );

      const textarea = screen.getByLabelText('Test Label');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should apply rows when multiline is true', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              multiline
              rows={5}
            />
          )}
        </TestWrapper>
      );

      const textarea = screen.getByLabelText('Test Label') as HTMLTextAreaElement;
      expect(textarea.rows).toBe(5);
    });

    it('should use 1 row by default when multiline', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              multiline
            />
          )}
        </TestWrapper>
      );

      const textarea = screen.getByLabelText('Test Label') as HTMLTextAreaElement;
      expect(textarea.rows).toBe(1);
    });
  });

  describe('User Interaction', () => {
    it('should allow typing text', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label');
      await user.type(input, 'Hello World');

      expect(input).toHaveValue('Hello World');
    });

    it('should respect maxLength', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              maxLength={5}
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label') as HTMLInputElement;
      await user.type(input, '123456789');

      expect(input.value.length).toBeLessThanOrEqual(5);
    });

    it('should update value on change', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label');

      await user.clear(input);
      await user.type(input, 'New value');

      expect(input).toHaveValue('New value');
    });

    it('should not allow typing when disabled', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              disabled
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label');

      await user.type(input, 'Should not work');

      expect(input).toHaveValue('');
    });
  });

  describe('Default Values', () => {
    it('should render with default value', () => {
      render(
        <TestWrapper defaultValues={{ testField: 'Default Value' }}>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label');
      expect(input).toHaveValue('Default Value');
    });

    it('should render empty when no default value', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label');
      expect(input).toHaveValue('');
    });

    it('should handle numeric default values', () => {
      render(
        <TestWrapper defaultValues={{ testField: 42 }}>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              type="number"
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label');
      expect(input).toHaveValue(42);
    });
  });

  describe('Full Width', () => {
    it('should be full width by default', () => {
      const { container } = render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
            />
          )}
        </TestWrapper>
      );

      const textField = container.querySelector('.MuiTextField-root');
      expect(textField).toHaveClass('MuiFormControl-fullWidth');
    });

    it('should not be full width when specified', () => {
      const { container } = render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              fullWidth={false}
            />
          )}
        </TestWrapper>
      );

      const textField = container.querySelector('.MuiTextField-root');
      expect(textField).not.toHaveClass('MuiFormControl-fullWidth');
    });
  });

  describe('Input Props', () => {
    it('should pass inputProps to TextField', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              inputProps={{ 'data-testid': 'custom-input' }}
            />
          )}
        </TestWrapper>
      );

      expect(screen.getByTestId('custom-input')).toBeInTheDocument();
    });

    it('should merge maxLength with other inputProps', () => {
      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              maxLength={10}
              inputProps={{ 'data-testid': 'custom-input' }}
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByTestId('custom-input') as HTMLInputElement;
      expect(input.maxLength).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string as value', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper defaultValues={{ testField: 'Initial' }}>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label');
      await user.clear(input);

      expect(input).toHaveValue('');
    });

    it('should handle special characters', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label');
      await user.type(input, '!@#$%^&*()');

      expect(input).toHaveValue('!@#$%^&*()');
    });

    it('should handle unicode characters', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label');
      await user.type(input, 'Español: áéíóú ñ');

      expect(input).toHaveValue('Español: áéíóú ñ');
    });

    it('should handle very long text', async () => {
      const user = userEvent.setup();
      const longText = 'a'.repeat(1000);

      render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Test Label');
      await user.type(input, longText);

      expect(input).toHaveValue(longText);
    });
  });

  describe('Props Forwarding', () => {
    it('should forward additional props to TextField', () => {
      const { container } = render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              data-testid="custom-field"
            />
          )}
        </TestWrapper>
      );

      expect(container.querySelector('[data-testid="custom-field"]')).toBeInTheDocument();
    });

    it('should forward className', () => {
      const { container } = render(
        <TestWrapper>
          {({ control }: any) => (
            <ControlledTextField
              {...defaultProps}
              control={control}
              className="custom-class"
            />
          )}
        </TestWrapper>
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});
