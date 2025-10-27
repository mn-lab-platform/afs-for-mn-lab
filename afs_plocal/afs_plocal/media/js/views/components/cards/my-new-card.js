define([
    'knockout',
    'templates/views/components/cards/my-new-card.htm',
    'bindings/scrollTo'
], function(ko, myNewCardTemplate) {
    console.log('Loading my-new-card component...')
    var viewModel = function(params) {
        console.log("my-new-card viewModel initialized")
        this.state = params.state || 'form';
        this.preview = params.preview;
        this.loading = params.loading || ko.observable(false);
        this.card = params.card;
        this.tile = params.tile;
        if (this.preview) {
            if (!this.card.newTile) {
                this.card.newTile = this.card.getNewTile();
            }
            this.tile = this.card.newTile;
        }
        this.form = params.form;
        this.provisionalTileViewModel = params.provisionalTileViewModel;
        this.reviewer = params.reviewer;
        this.expanded = ko.observable(true);
        this.beforeMove = function(e) {
            e.cancelDrop = (e.sourceParent!==e.targetParent);
        };
    };
    return ko.components.register('my-new-card', {
        viewModel: viewModel,
        template: myNewCardTemplate,
    });
});