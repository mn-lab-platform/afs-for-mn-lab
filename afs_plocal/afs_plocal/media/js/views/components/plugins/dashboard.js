define([
    'knockout',
    'arches',
    'js-cookie',
    'templates/views/components/plugins/dashboard.htm'
], function(ko, arches, Cookies, DashboardTemplate) {

    const DashboardViewModel = function() {
        const self = this;
        this.loading = ko.observable(true);
        this.records = ko.observable();

        this.getStatus = async function() {
            const dashdataUrl = "http://localhost:8004/dashdata/"; // Hardcoded URL
            console.log('dashdata URL:', dashdataUrl);
            const response = await window.fetch(dashdataUrl);
            const data = await response.json();
            self.resourceCount = data.resource_count;
            self.tileCount = data.tile_count;
            self.records(data.records);
            self.loading(false);
        };

        this.saveStatus = async function() {
            const dashdataUrl = "http://localhost:8004/dashdata/"; // Hardcoded URL
            console.log('dashdata URL:', dashdataUrl);
            const response = await fetch(dashdataUrl, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    "X-CSRFToken": Cookies.get('csrftoken')
                }
            });
            const data = await response.json();
            self.records(data.records);
        };

        this.getStatus();
    };

    return ko.components.register('dashboard', {
        viewModel: DashboardViewModel,
        template: DashboardTemplate
    });
});