import Measurer from './Measurer';
import UiGridMetrics from './UiGridMetrics';
import IGridColumn = uiGrid.IGridColumn;
import IGridApi = uiGrid.IGridApi;
import IGridInstanceOf = uiGrid.IGridInstanceOf;

interface IExtendedColumnDef extends uiGrid.IColumnDef {
    drawnWidth: Number;
    enableColumnAutoFit: boolean;
}

interface IExtendedGridColumn extends uiGrid.IGridColumn {
    colDef: IExtendedColumnDef;
    grid: IGridInstanceOfExtended;
}

interface IExtendedGridInstance extends uiGrid.IGridInstance {
    options: IExtendedGridOptions;
}

interface IExtendedGridOptions extends uiGrid.IGridOptions {
    enableColumnAutoFit: boolean;
}

interface IGridInstanceOfExtended extends IGridInstanceOf<any> {
    element: Array<HTMLElement>
}

interface IAnyFilterPredicateFunc {
    (value: any, firstFlag?: any, secondFlag?: any): string;
}

export class UiGridAutoFitColumnsService {
    private gridMetrics: UiGridMetrics;

    /*@ngInject*/
    constructor (private $q: angular.IQService, private $filter: angular.IFilterService) {
        this.gridMetrics = new UiGridMetrics();
    }

    initializeGrid(grid: IExtendedGridInstance) {
        grid.registerColumnBuilder(this.colAutoFitColumnBuilder.bind(this));
        grid.registerColumnsProcessor(this.columnsProcessor.bind(this), 60);

        UiGridAutoFitColumnsService.defaultGridOptions(grid.options);
    }

    static defaultGridOptions(gridOptions: IExtendedGridOptions) {
        // true by default
        gridOptions.enableColumnAutoFit = gridOptions.enableColumnAutoFit !== false;
    }

    private getFilterIfExists<T>(filterName): any {
        try {
            return this.$filter<IAnyFilterPredicateFunc>(filterName);
        } catch (e) {
            return null;
        }
    }

    private getFilteredValue(value: string, cellFilter: string) {
        if (cellFilter && cellFilter !== '') {
            const filter = this.getFilterIfExists(cellFilter);
            if (filter) {
                value = filter(value);
            } else {
                // https://regex101.com/r/rC5eR5/2
                const re = /([^:]*):([^:]*):?([\s\S]+)?/;
                let matches;
                if ((matches = re.exec(cellFilter)) !== null) {
                    value = this.$filter<IAnyFilterPredicateFunc>(matches[1])(value, matches[2], matches[3]);
                }
            }
        }
        return value;
    }

    colAutoFitColumnBuilder(colDef: IExtendedColumnDef, col: IExtendedGridColumn, gridOptions: IExtendedGridOptions) {
        const promises = [];

        if (colDef.enableColumnAutoFit === undefined) {
            //TODO: make it as col.isResizable()
            if (UiGridAutoFitColumnsService.isResizable(colDef)) {
                colDef.enableColumnAutoFit = gridOptions.enableColumnAutoFit;
            } else {
                colDef.enableColumnAutoFit = false;
            }
        }

        return this.$q.all(promises);
    }

    static isResizable(colDef: IExtendedColumnDef): boolean {
        return !colDef.hasOwnProperty('width');
    }

    static stripTags(html) {
        var tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }

    static getLongestWord(label) {
        return label.split(' ').reduce((longestWord, word) => {
            if (word.length > longestWord.length) {
                longestWord = word;
            }

            return longestWord;
        }, '')
    }

    columnsProcessor(renderedColumnsToProcess?: Array<IExtendedGridColumn>, rows?: Array<uiGrid.IGridRow>) {
        if (!rows.length) {
            return renderedColumnsToProcess;
        }
        // TODO: respect existing colDef options
        // if (col.colDef.enableColumnAutoFitting === false) return;

        let optimalWidths: {
            [name: string]: number
        } = {};


        renderedColumnsToProcess.forEach((column: IExtendedGridColumn) => {
            if (column.colDef.enableColumnAutoFit) {
                const columnKey = column.field || column.name;
                const longestColWord = UiGridAutoFitColumnsService.getLongestWord(column.displayName);

                optimalWidths[columnKey] = Measurer.measureRoundedTextWidth(longestColWord, this.gridMetrics.getHeaderFont()) + this.gridMetrics.getHeaderButtonsWidth();

                rows.forEach((row) => {
                    let cellText = UiGridAutoFitColumnsService.stripTags(row.grid.getCellValue(row, column));

                    if (!!column.colDef.cellFilter) {
                        cellText = this.getFilteredValue(cellText, column.colDef.cellFilter);
                    }

                    const currentCellWidth = Measurer.measureRoundedTextWidth(cellText, this.gridMetrics.getCellFont());
                    const optimalCellWidth = currentCellWidth > 300 ? 300 : currentCellWidth;

                    if (optimalCellWidth > optimalWidths[columnKey]) {
                        optimalWidths[columnKey] = optimalCellWidth;
                    }
                });

                column.colDef.width = optimalWidths[columnKey] + this.gridMetrics.getPadding() + this.gridMetrics.getBorder();
                column.updateColumnDef(column.colDef, false);
            }
        });

        const totalColumnsWidth = renderedColumnsToProcess.reduce((res: number, column: any) => {
            let width = angular.isNumber(column.width) ? column.width : (column.drawnWidth || 30)

            if (column.minWidth && column.minWidth > width) {
                width = column.minWidth;
            }

            res += width;
            return res;
        }, 0);

        const gridContainer = renderedColumnsToProcess[0].grid.element[0];
        if (gridContainer && gridContainer.clientWidth && gridContainer.clientWidth > totalColumnsWidth) {
            renderedColumnsToProcess.forEach(function (column) {
                if (column.colDef.enableColumnAutoFit) {
                    column.colDef.width = '*';
                    column.updateColumnDef(column.colDef, false);
                }
            });
        }

        return renderedColumnsToProcess;
    }

}
