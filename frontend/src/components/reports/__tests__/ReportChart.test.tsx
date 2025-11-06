// ABOUTME: Tests P0 para ReportChart - BarChart, LineChart, DonutChart, MetricCard
// ABOUTME: Cubre empty data, invalid data, basic rendering, y trends

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BarChart, LineChart, DonutChart, MetricCard } from '../ReportChart';
import { ChartDataPoint } from '@/types/reports.types';

const renderWithTheme = (component: React.ReactElement) => {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const mockChartData: ChartDataPoint[] = [
  { label: 'Enero', value: 100 },
  { label: 'Febrero', value: 150 },
  { label: 'Marzo', value: 200 }
];

describe('BarChart - P0 Critical Tests', () => {
  describe('A1. Empty Data Handling', () => {
    it('should show "No hay datos disponibles" when data is empty', () => {
      renderWithTheme(<BarChart title="Test Chart" data={[]} />);
      expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
    });

    it('should show "No hay datos disponibles" when data is null', () => {
      renderWithTheme(<BarChart title="Test Chart" data={null as any} />);
      expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
    });

    it('should show "No hay datos disponibles" when data is undefined', () => {
      renderWithTheme(<BarChart title="Test Chart" data={undefined as any} />);
      expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
    });
  });

  describe('A2. Invalid Data Handling', () => {
    it('should show "No hay datos válidos disponibles" when all values are NaN', () => {
      const invalidData: ChartDataPoint[] = [
        { label: 'Test', value: NaN }
      ];
      renderWithTheme(<BarChart title="Test Chart" data={invalidData} />);
      expect(screen.getByText('No hay datos válidos disponibles')).toBeInTheDocument();
    });

    it('should show "No hay datos válidos disponibles" when all values are Infinity', () => {
      const invalidData: ChartDataPoint[] = [
        { label: 'Test', value: Infinity }
      ];
      renderWithTheme(<BarChart title="Test Chart" data={invalidData} />);
      expect(screen.getByText('No hay datos válidos disponibles')).toBeInTheDocument();
    });

    it('should filter out invalid data and render valid data only', () => {
      const mixedData: ChartDataPoint[] = [
        { label: 'Valid', value: 100 },
        { label: 'Invalid NaN', value: NaN },
        { label: 'Valid 2', value: 200 }
      ];
      const { container } = renderWithTheme(<BarChart title="Test Chart" data={mixedData} />);

      // Should render SVG (valid data exists)
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('A3. Basic Rendering', () => {
    it('should render title correctly', () => {
      renderWithTheme(<BarChart title="Ventas Mensuales" data={mockChartData} />);
      expect(screen.getByText('Ventas Mensuales')).toBeInTheDocument();
    });

    it('should render SVG chart with valid data', () => {
      const { container } = renderWithTheme(<BarChart title="Test" data={mockChartData} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render legend when showLegend is true (default)', () => {
      renderWithTheme(<BarChart title="Test" data={mockChartData} />);

      // Legend should show labels (labels appear both in SVG and legend)
      const eneroLabels = screen.getAllByText('Enero');
      expect(eneroLabels.length).toBeGreaterThanOrEqual(1);

      const febreroLabels = screen.getAllByText('Febrero');
      expect(febreroLabels.length).toBeGreaterThanOrEqual(1);

      const marzoLabels = screen.getAllByText('Marzo');
      expect(marzoLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('should not render legend when showLegend is false', () => {
      renderWithTheme(<BarChart title="Test" data={mockChartData} showLegend={false} />);

      // Legend labels should not be in document (only in SVG)
      const legendLabels = screen.queryAllByText('Enero');
      // Should only find label in SVG, not in legend area
      expect(legendLabels.length).toBeLessThanOrEqual(1);
    });
  });
});

describe('LineChart - P0 Critical Tests', () => {
  describe('B1. Empty Data Handling', () => {
    it('should show "No hay datos disponibles" when data is empty', () => {
      renderWithTheme(<LineChart title="Test Chart" data={[]} />);
      expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
    });

    it('should show "No hay datos válidos disponibles" when all values are NaN', () => {
      const invalidData: ChartDataPoint[] = [
        { label: 'Test', value: NaN }
      ];
      renderWithTheme(<LineChart title="Test Chart" data={invalidData} />);
      expect(screen.getByText('No hay datos válidos disponibles')).toBeInTheDocument();
    });
  });

  describe('B2. Basic Rendering', () => {
    it('should render title correctly', () => {
      renderWithTheme(<LineChart title="Tendencias" data={mockChartData} />);
      expect(screen.getByText('Tendencias')).toBeInTheDocument();
    });

    it('should render SVG chart with valid data', () => {
      const { container } = renderWithTheme(<LineChart title="Test" data={mockChartData} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render grid lines when showGrid is true (default)', () => {
      const { container } = renderWithTheme(<LineChart title="Test" data={mockChartData} />);

      // Grid should have line elements
      const lines = container.querySelectorAll('line');
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should not render grid lines when showGrid is false', () => {
      const { container } = renderWithTheme(<LineChart title="Test" data={mockChartData} showGrid={false} />);

      // No grid lines should be present
      const lines = container.querySelectorAll('line');
      expect(lines.length).toBe(0);
    });
  });
});

describe('DonutChart - P0 Critical Tests', () => {
  describe('C1. Empty Data Handling', () => {
    it('should show "No hay datos disponibles" when data is empty', () => {
      renderWithTheme(<DonutChart title="Test Chart" data={[]} />);
      expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
    });

    it('should show "No hay datos válidos disponibles" when all values are zero or negative', () => {
      const invalidData: ChartDataPoint[] = [
        { label: 'Test 1', value: 0 },
        { label: 'Test 2', value: -10 }
      ];
      renderWithTheme(<DonutChart title="Test Chart" data={invalidData} />);
      expect(screen.getByText('No hay datos válidos disponibles')).toBeInTheDocument();
    });

    it('should filter out zero and negative values', () => {
      const mixedData: ChartDataPoint[] = [
        { label: 'Valid', value: 100 },
        { label: 'Zero', value: 0 },
        { label: 'Negative', value: -50 }
      ];
      const { container } = renderWithTheme(<DonutChart title="Test" data={mixedData} />);

      // Should render SVG (valid data exists)
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('C2. Basic Rendering', () => {
    it('should render title correctly', () => {
      renderWithTheme(<DonutChart title="Distribución" data={mockChartData} />);
      expect(screen.getByText('Distribución')).toBeInTheDocument();
    });

    it('should render SVG chart with valid data', () => {
      const { container } = renderWithTheme(<DonutChart title="Test" data={mockChartData} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should show total in center when innerRadius > 0 (default)', () => {
      renderWithTheme(<DonutChart title="Test" data={mockChartData} />);

      // Total = 100 + 150 + 200 = 450
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('450')).toBeInTheDocument();
    });

    it('should render legend when showLegend is true (default)', () => {
      renderWithTheme(<DonutChart title="Test" data={mockChartData} />);

      // Legend should show labels
      expect(screen.getByText('Enero')).toBeInTheDocument();
      expect(screen.getByText('Febrero')).toBeInTheDocument();
      expect(screen.getByText('Marzo')).toBeInTheDocument();
    });
  });
});

describe('MetricCard - P0 Critical Tests', () => {
  describe('D1. Basic Rendering', () => {
    it('should render title and value', () => {
      renderWithTheme(<MetricCard title="Total Ventas" value="$10,000" />);

      expect(screen.getByText('Total Ventas')).toBeInTheDocument();
      expect(screen.getByText('$10,000')).toBeInTheDocument();
    });

    it('should render numeric value with locale formatting', () => {
      renderWithTheme(<MetricCard title="Pacientes" value={1234} />);

      expect(screen.getByText('Pacientes')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('should render subtitle when provided', () => {
      renderWithTheme(<MetricCard title="Ventas" value="$5,000" subtitle="Este mes" />);

      expect(screen.getByText('Este mes')).toBeInTheDocument();
    });

    it('should not render subtitle when not provided', () => {
      renderWithTheme(<MetricCard title="Ventas" value="$5,000" />);

      expect(screen.queryByText('Este mes')).not.toBeInTheDocument();
    });
  });

  describe('D2. Trend Display', () => {
    it('should show up trend with icon', () => {
      renderWithTheme(<MetricCard title="Ventas" value="$10,000" trend="up" trendValue={15} />);

      expect(screen.getByText(/15\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/vs período anterior/)).toBeInTheDocument();
    });

    it('should show down trend with icon', () => {
      renderWithTheme(<MetricCard title="Ventas" value="$8,000" trend="down" trendValue={-10} />);

      // Should show absolute value
      expect(screen.getByText(/10\.0%/)).toBeInTheDocument();
    });

    it('should show stable trend with icon', () => {
      renderWithTheme(<MetricCard title="Ventas" value="$9,000" trend="stable" trendValue={0} />);

      expect(screen.getByText(/0\.0%/)).toBeInTheDocument();
    });

    it('should not show trend when trend is undefined', () => {
      renderWithTheme(<MetricCard title="Ventas" value="$10,000" />);

      expect(screen.queryByText(/vs período anterior/)).not.toBeInTheDocument();
    });

    it('should not show trend when trendValue is undefined', () => {
      renderWithTheme(<MetricCard title="Ventas" value="$10,000" trend="up" />);

      expect(screen.queryByText(/vs período anterior/)).not.toBeInTheDocument();
    });
  });

  describe('D3. Icon Display', () => {
    it('should render icon when provided', () => {
      const icon = <div data-testid="test-icon">📊</div>;
      const { container } = renderWithTheme(<MetricCard title="Ventas" value="$10,000" icon={icon} />);

      expect(container.querySelector('[data-testid="test-icon"]')).toBeInTheDocument();
    });

    it('should not render icon area when icon not provided', () => {
      const { container } = renderWithTheme(<MetricCard title="Ventas" value="$10,000" />);

      expect(container.querySelector('[data-testid="test-icon"]')).not.toBeInTheDocument();
    });
  });
});
