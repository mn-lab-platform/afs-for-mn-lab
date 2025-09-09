define([
    'knockout',
    'viewmodels/report',
    'templates/views/report-templates/custom_report.htm'
], function(ko, ReportViewModel, customReportTemplate) {
    return ko.components.register('custom_report', {
        viewModel: function(params) {
            params.configKeys = [];
            var self = this;
            // define params for custom report here

            ReportViewModel.apply(this, [params]);
            // Put custom report logic here
        },
        template: customReportTemplate,
    });
});