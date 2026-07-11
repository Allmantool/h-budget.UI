import type {
	ApexChart,
	ApexFill,
	ApexLegend,
	ApexNonAxisChartSeries,
	ApexPlotOptions,
	ApexResponsive,
	ApexStroke,
	ApexTooltip,
} from 'ng-apexcharts';

export type MarketShareChartOptions = {
	series: ApexNonAxisChartSeries;
	chart: ApexChart;
	labels: string[];
	legend: ApexLegend;
	plotOptions: ApexPlotOptions;
	stroke: ApexStroke;
	fill: ApexFill;
	tooltip: ApexTooltip;
	responsive: ApexResponsive[];
};
