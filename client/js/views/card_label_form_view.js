/**
 * @fileOverview This file has functions related to card label form view. This view calling from modal card view.
 * Available Object:
 *	App.boards						: this object contain all boards(Based on logged in user)
 *	this.model						: labels collection.
 */
if (typeof App === 'undefined') {
    App = {};
}
/**
 * CardLabelForm View
 * @class CardLabelFormView
 * @constructor
 * @extends Backbone.View
 */
App.CardLabelFormView = Backbone.View.extend({
    template: JST['templates/card_label_form'],
    tagName: 'li',
    /**
     * Events
     * functions to fire on events (Mouse events, Keyboard Events, Frame/Object Events, Form Events, Drag Events, etc...)
     */
    events: {
        'click .js-show-card-label-colorpicker': 'showCardLabelColorpicker'
    },

    /**
     * Constructor
     * initialize default values and actions
     */
    initialize: function(options) {
        if (!_.isUndefined(this.model) && this.model !== null) {
            this.model.showImage = this.showImage;
        }
        this.card = options.card;
        this.render();
    },
    /**
     * showCardLabelColorpicker()
     * show card label colorpicker form
     * @param e
     * @type Object(DOM event)
     */
    showCardLabelColorpicker: function(e) {
        e.preventDefault();
        var target = $(e.target);
        $('li.dropdown').removeClass('open');
        target.parents('div.dropdown').addClass('open');
        return false;
    },

    /**
     * render()
     * populate the html to the dom
     * @param NULL
     * @return object
     *
     */
    render: function() {
        this.$el.html(this.template({
            labels: this.model,
            card: this.card
        }));
        this.showTooltip();
        return this;
    }
});
