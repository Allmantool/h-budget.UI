import type {
	ApexAxisChartSeries,
	ApexChart,
	ApexDataLabels,
	ApexFill,
	ApexGrid,
	ApexPlotOptions,
	ApexTooltip,
	ApexXAxis,
	ApexYAxis,
} from 'ng-apexcharts';

export type TrendBarChartOptions = {
	series: ApexAxisChartSeries;
	chart: ApexChart;
	plotOptions: ApexPlotOptions;
	dataLabels: ApexDataLabels;
	xaxis: ApexXAxis;
	yaxis: ApexYAxis;
	grid: ApexGrid;
	tooltip: ApexTooltip;
	fill: ApexFill;
};
