var chart;

$(function() {
    var dates = $( "#report_from, #report_to" ).datepicker({
        defaultDate: "+1w",
        changeMonth: true,
        numberOfMonths: 1,
        onSelect: function( selectedDate ) {
            var option = this.id == "report_from" ? "minDate" : "maxDate",
            instance = $( this ).data( "datepicker" ),
            date = $.datepicker.parseDate(
                instance.settings.dateFormat ||
                $.datepicker._defaults.dateFormat,
                selectedDate, instance.settings );
            dates.not( this ).datepicker( "option", option, date );
        }
    });

    if($('#chart').length > 0)
        loadChart();
});

function loadChart(){
    chartOptions = {
        chart: {
            renderTo: 'chart',
            type: chartType
        },
        title: {
            text: ''
        },
        xAxis: {
            type: 'datetime',
            title: {
                text: xAxisName
            }
        },
        yAxis: {
            title: {
                text: yAxisName
            }
        },
        series: [],
        legend: {
            enabled: false
        },
        tooltip: {
            shared: true,
            xDateFormat: '%Y-%m-%d %l:%H%P'
        }
    };

    chartOptions.series.push
    (
    {
        name: '',
        data: chartData
    }
    );

    /*    $.each($('.x-axis-data'), function(index, cat){
        chartOptions.xAxis.categories.push($(cat).text());
    });

    var series = {
        name: $('.x-axis-label').text(),
        data: []
    };
    $.each($('.y-axis-data'), function(index, data){
        series.data.push(parseInt($(data).text(), 10));
    });
    chartOptions.series.push(series);*/

    chart = new Highcharts.Chart(chartOptions);
}