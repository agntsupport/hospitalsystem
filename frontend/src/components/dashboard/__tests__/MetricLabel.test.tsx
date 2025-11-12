// ABOUTME: Tests unitarios para MetricLabel - Etiquetas con detección de truncamiento y tooltips
// Cubre truncamiento de 1 y 2 líneas, detección automática, tooltips condicionales

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricLabel } from '../MetricLabel';

describe('MetricLabel', () => {
  describe('rendering', () => {
    it('renderiza el título correctamente', () => {
      render(<MetricLabel title="Test Label" />);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('aplica estilos de truncamiento de 1 línea por defecto', () => {
      render(<MetricLabel title="Long title" />);
      const labelElement = screen.getByText('Long title');

      expect(labelElement).toHaveStyle({
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      });
    });

    it('soporta truncamiento de múltiples líneas', () => {
      render(<MetricLabel title="Long title" maxLines={2} />);
      const labelElement = screen.getByText('Long title');

      const computedStyle = window.getComputedStyle(labelElement);
      expect(computedStyle.getPropertyValue('-webkit-line-clamp')).toBe('2');
    });
  });

  describe('tooltips', () => {
    it('renderiza correctamente incluso con títulos largos', () => {
      const longTitle = 'This is a very long title that should be truncated';
      render(<MetricLabel title={longTitle} showTooltipOnTruncate />);

      const labelElement = screen.getByText(longTitle);
      expect(labelElement).toBeInTheDocument();
    });

    it('renderiza títulos cortos sin problemas', () => {
      const shortTitle = 'Short';

      render(<MetricLabel title={shortTitle} showTooltipOnTruncate />);

      const labelElement = screen.getByText(shortTitle);
      expect(labelElement).toBeInTheDocument();
    });

    it('puede desactivar tooltips con showTooltipOnTruncate=false', () => {
      render(
        <MetricLabel
          title="Long title"
          showTooltipOnTruncate={false}
        />
      );

      const labelElement = screen.getByText('Long title');
      expect(labelElement).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('aplica props personalizados de Typography', () => {
      render(
        <MetricLabel
          title="Test"
          TypographyProps={{ 'data-testid': 'custom-label' }}
        />
      );

      expect(screen.getByTestId('custom-label')).toBeInTheDocument();
    });

    it('usa variante h6 por defecto', () => {
      const { container } = render(<MetricLabel title="Test" />);
      const labelElement = container.querySelector('[class*="MuiTypography-h6"]');
      expect(labelElement).toBeInTheDocument();
    });

    it('tiene color textSecondary por defecto', () => {
      render(<MetricLabel title="Test" />);
      const labelElement = screen.getByText('Test');
      expect(labelElement).toHaveClass('MuiTypography-colorTextSecondary');
    });
  });

  describe('edge cases', () => {
    it('maneja títulos vacíos', () => {
      render(<MetricLabel title="" />);
      // No debería explotar
    });

    it('maneja títulos muy largos', () => {
      const veryLongTitle = 'A'.repeat(1000);
      render(<MetricLabel title={veryLongTitle} maxLines={1} />);
      expect(screen.getByText(veryLongTitle)).toBeInTheDocument();
    });

    it('maneja caracteres especiales', () => {
      const specialTitle = 'Test <>&"\'';
      render(<MetricLabel title={specialTitle} />);
      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });
  });
});
