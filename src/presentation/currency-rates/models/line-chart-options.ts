import { ChartType } from 'ng-apexcharts';

export class LineChartOptions {
	constructor(options: Partial<LineChartOptions>) {
		this.height = options.height;
		this.width = options.width;
		this.dateFormat = options.dateFormat ?? 'dd MMM yy';
		this.type = options.type ?? 'area';
	}

	dateFormat: string;
	type: ChartType;
	height?: number | string;
	width?: number | string;
}
