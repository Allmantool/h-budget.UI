import type { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexPlotOptions, ApexXAxis } from 'ng-apexcharts';

export interface TrendLeaderboardChartOptions {
	series: ApexAxisChartSeries;
	chart: ApexChart;
	plotOptions: ApexPlotOptions;
	dataLabels: ApexDataLabels;
	xaxis: ApexXAxis;
}
