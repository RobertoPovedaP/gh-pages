if (typeof App === 'undefined') {
    App = {};
}
/**
 * List Model
 * @class List
 * @constructor
 * @extends Backbone.Model
 */
App.List = Backbone.Model.extend({
    storeName: 'list',
    initialize: function() {
        this.url = api_url + 'boards/' + this.attributes.board_id + '/lists.json';

        this.cards = new App.CardCollection();
        this.cards.url = api_url + 'boards/' + this.attributes.board_id + '/lists/' + this.id + '/cards.json';
        this.cards.list = this;

        this.boards = new App.BoardCollection();
        this.board_users = new App.BoardsUserCollection();
        this.attachments = new App.CardAttachmentCollection();
        this.activities = new App.ActivityCollection();
        this.subscriber = new App.ListSubscriber();
        this.labels = new App.CardLabelCollection();
        this.lists_subscribers = new App.ListSubscriberCollection();
    },

    moveAfter: function(beforeId) {
        var before = this.collection.get(beforeId);
        var after = this.collection.next(before);
        if (typeof after == 'undefined') {
            afterPosition = parseFloat(before.attributes.position) + 2;
        } else {
            afterPosition = parseFloat(after.attributes.position);
        }
        var difference = (afterPosition - parseFloat(before.attributes.position)) / 2;
        var newPosition = difference + parseFloat(before.attributes.position);
        this.set({
            position: newPosition
        }, {
            silent: true
        });
        return this;
    },
    moveBefore: function(afterId) {
        var after = this.collection.get(afterId);
        var before = this.collection.previous(after);
        if (typeof before == 'undefined') {
            beforePosition = 0.0;
        } else {
            beforePosition = parseFloat(before.attributes.position);
        }
        var difference = (parseFloat(after.attributes.position) - beforePosition) / 2;
        var newPosition = difference + beforePosition;
        this.set({
            position: newPosition
        }, {
            silent: true
        });
        this.collection.sort({
            silent: true
        });
        return this;
    },
    position: function() {
        return parseFloat(this.attributes.position);
    }
});
