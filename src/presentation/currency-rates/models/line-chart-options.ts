import { ChartType } from 'ng-apexcharts';

export class LineChartOptions {
	constructor(opitons: Partial<LineChartOptions>) {
		this.height = opitons.height;
		this.width = opitons.width;
		this.dateFormat = opitons.dateFormat ?? 'dd MMM yy';
		this.type = opitons.type ?? 'area';
	}

	dateFormat: string;
	type: ChartType;
	height?: number | string;
	width?: number | string;
}
