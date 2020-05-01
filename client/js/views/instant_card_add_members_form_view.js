/**
 * @fileOverview This file has functions related to instant card add labels form view. This view calling from instant card add view.
 * Available Object:
 *	App.boards						: this object contain all boards(Based on logged in user)
 *	this.model						: instant card add model. @see Available Object in App.InstantCardAddView
 */
if (typeof App === 'undefined') {
    App = {};
}
/**
 * InstantCardAddMembersForm View
 * @class InstantCardAddMembersFormView
 * @constructor
 * @extends Backbone.View
 */
App.InstantCardAddMembersFormView = Backbone.View.extend({
    /**
     * Constructor
     * initialize default values and actions
     */
    initialize: function() {
        if (!_.isUndefined(this.model) && this.model !== null) {
            this.model.showImage = this.showImage;
        }
        this.render();
    },
    template: JST['templates/instant_card_add_members_form'],
    /**
     * render()
     * populate the html to the dom
     * @param NULL
     * @return object
     *
     */
    render: function() {
        this.$el.html(this.template({
            user_id: this.model
        }));
        this.showTooltip();
        return this;
    }
});
