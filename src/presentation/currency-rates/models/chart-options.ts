import {
	ApexAxisChartSeries,
	ApexChart,
	ApexXAxis,
	ApexTitleSubtitle,
} from 'ng-apexcharts';

export type ChartOptions = {
	series: ApexAxisChartSeries;
	chart: ApexChart;
	xaxis: ApexXAxis;
	title: ApexTitleSubtitle;
};
