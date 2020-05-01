/**
 * @fileOverview This file has functions related to archived cards view. This view calling from board header view.
 * Available Object:
 *	App.boards						: this object contain all boards(Based on logged in user)
 *	this.model						: board model and it's related values. It contain all board based object @see Available Object in App.BoardView
 */
if (typeof App === 'undefined') {
    App = {};
}
/**
 * ArchivedCards View
 * @class ArchivedCards
 * @constructor
 * @extends Backbone.View
 */
App.ArchivedCardsView = Backbone.View.extend({
    /**
     * Constructor
     * initialize default values and actions
     */
    initialize: function() {
        if (!_.isUndefined(this.model) && this.model !== null) {
            this.model.showImage = this.showImage;
            var board_user_role_id = this.model.board_users.findWhere({
                user_id: parseInt(authuser.user.id)
            });
            if (!_.isEmpty(board_user_role_id)) {
                this.model.board_user_role_id = board_user_role_id.attributes.board_user_role_id;
            }
        }
        this.render();
    },
    template: JST['templates/archived_cards'],
    tagName: 'div',
    className: 'clearfix col-xs-12',
    /**
     * Events
     * functions to fire on events (Mouse events, Keyboard Events, Frame/Object Events, Form Events, Drag Events, etc...)
     */
    events: {
        'click .js-delete-all-archived-cards-confirm': 'deleteAllArchivedCardsConfirm'
    },
    deleteAllArchivedCardsConfirm: function(e) {
        $('.js-setting-response').html(new App.ArchivedCardsDeleteConfirmView({
            model: this.model,
        }).el);
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
            board: this.model,
        }));
        this.showTooltip();
        return this;
    }

});
