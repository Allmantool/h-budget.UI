import type { ApexChart, ApexLegend, ApexNonAxisChartSeries, ApexPlotOptions } from 'ng-apexcharts';

export interface MarketPositionChartOptions {
	series: ApexNonAxisChartSeries;
	chart: ApexChart;
	legend: ApexLegend;
	plotOptions: ApexPlotOptions;
	labels: string[];
}
