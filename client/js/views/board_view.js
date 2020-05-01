/**
/**
 * @fileOverview This file has functions related to board view. This view calling from application view.
 * Available Object:
 *	App.boards						: this object contain all boards(Based on logged in user)
 *	this.model						: board model and it's related values
 *	this.model.activities			: activities collection(Based on board)
 *	this.model.attachments			: attachments collection(Based on board)
 *  this.model.board_stars			: starred board collection(Based on logged in user)
 *	this.model.board_users  	  	: board user collection(Based on board)
 *	this.model.boards_subscribers  	: board user collection(Based on board)
 *	this.model.cards 			   	: cards collection(Based on board) 
 *	this.model.checklists			: checklists collection(Based on card)
 *	this.model.checklist_items		: checklist items collection(Based on checklist)
 *	this.model.custom_attachments	: custom attachments collection(Based on board)
 *	this.model.lists				: lists collection(Based on board) 
 *	this.model.labels 			   	: labels collection(Based on board)
 */
if (typeof App === 'undefined') {
    App = {};
}
/**
 * Board View
 * @class BoardView
 * @constructor
 * @extends Backbone.View
 */
App.BoardView = Backbone.View.extend({
    tagName: 'section',
    className: 'clearfix js-boards-view',
    id: 'boards-view',
    /**
     * Constructor
     * initialize default values and actions
     */
    initialize: function() {
        if (!_.isUndefined(this.model) && this.model !== null) {
            this.model.showImage = this.showImage;
        }
        var self = this;
        this.authuser = authuser.user;
        if (_.isUndefined($.cookie('music_play'))) {
            $.cookie('music_play', "1");
        }
        this.model.attachments.add(this.model.get('attachments'));
        _.bindAll(this, 'render', 'renderListsCollection', 'renderActivitiesCollection', 'setBoardBackground', 'renderBoarduserCollection');
        this.model.bind('change:name change:is_closed', this.render);
        this.model.bind('change:background_color change:background_picture_url change:background_pattern_url', this.setBoardBackground);
        this.model.bind('change:sort_by', this.renderListsCollection);
        this.model.bind('change:sort_direction', this.renderListsCollection);
        this.model.bind('change:music_content', this.musical);
        this.model.lists.bind('add', this.renderListsCollection);
        this.model.lists.bind('change:position', this.renderListsCollection);
        this.model.lists.bind('change:is_archived', this.renderListsCollection, this);
        this.model.lists.bind('change:comment_count', this.renderListsCollection, this);
        this.model.activities.bind('add', this.renderActivitiesCollection);
        this.model.board_users.bind('add', this.renderBoarduserCollection);
        this.model.board_users.bind('remove', this.renderBoarduserCollection);
        this.model.board_users.bind('change', this.renderBoarduserCollection);
        if (!_.isUndefined(App.music)) {
            App.music.inst = new Instrument();
        }
        if (this.model.attributes.music_content !== undefined && this.model.attributes.music_content !== "") {
            App.music.music_content = this.model.attributes.music_content;
            App.music.music_name = this.model.attributes.music_name;
        }
        this.populateChecklists();
        this.populateChecklistItems();
        this.populateLabels();
        if (!_.isUndefined(authuser.user)) {
            var board_user_role_id = this.model.board_users.findWhere({
                user_id: parseInt(authuser.user.id)
            });
            if (!_.isEmpty(board_user_role_id)) {
                this.model.board_user_role_id = board_user_role_id.attributes.board_user_role_id;
            }
        }
        this.render();
    },

    // Resets this checklists collection
    populateChecklists: function() {
        var self = this;
        self.model.cards.each(function(card) {
            var checklists = card.get('cards_checklists') || [];
            var options = {
                silent: true
            };
            if (!_.isEmpty(checklists)) {
                var total_count = 0,
                    completed_count = 0,
                    pending_count = 0;
                total_count = parseInt(card.attributes.checklist_item_count);
                completed_count = parseInt(card.attributes.checklist_item_completed_count);
                pending_count = total_count - completed_count;
                card.set('checklist_item_pending_count', pending_count, options);
                _.each(checklists, function(checklist) {
                    total_count = 0;
                    completed_count = 0;
                    pending_count = 0;
                    total_count = checklist.checklist_item_count;
                    completed_count = checklist.checklist_item_completed_count;
                    pending_count = total_count - completed_count;
                    checklist.checklist_item_pending_count = pending_count;
                });
                self.model.checklists.add(checklists, {
                    silent: true
                });
            } else {
                card.set('checklist_item_pending_count', 0, options);
            }
        });
    },
    // Resets this checklist items collection
    populateChecklistItems: function() {
        var self = this;
        self.model.checklists.each(function(checklist) {
            var checklist_itmes = checklist.get('checklists_items') || [];
            if (!_.isEmpty(checklist_itmes)) {
                self.model.checklist_items.add(checklist_itmes, {
                    silent: true
                });
            }
        });
    },
    // Resets this labels collection
    populateLabels: function() {
        var self = this;
        self.model.cards.each(function(card) {
            var labels = card.get('cards_labels') || [];
            if (!_.isEmpty(labels)) {
                $.each(labels, function(key, value) {
                    if (self.model.labels.where({
                            board_id: value.board_id,
                            card_id: value.card_id,
                            label_id: value.label_id,
                            list_id: value.list_id
                        }).length <= 0) {
                        var new_label = new App.Label();
                        new_label.set(value);
                        self.model.labels.unshift(new_label);
                    }
                });
            }
        });
    },
    /**
     * Events
     * functions to fire on events (Mouse events, Keyboard Events, Frame/Object Events, Form Events, Drag Events, etc...)
     */
    events: {
        'click .js-close-popover': 'closePopup',
        'click .js-close-sub-popover': 'closeSubPopup',
        'click .js-board-visibility': 'showBoardVisibility',
        'click .js-subscribe-board': 'subcribeBoard',
        'click .js-star-board': 'starredBoard',
        'click .js-close-board': 'closeBoard',
        'submit #BoardReopenForm': 'reopenBoard',
        'submit #BoardDeleteForm': 'deleteBoard',
        'click .js-change-visibility': 'showAllVisibility',
        'click .js-select': 'copyBoardVisibility',
        'click .js-hide-sidebar': 'hideSidebar',
        'click .js-show-sidebar-menu': 'showSidebarMenu',
        'click .js-hide-sidebar-menu': 'hideSidebarMenu',
        'click .js-show-board-member-permission-form': 'showBoardMemberPermissionForm',
        'click .js-edit-board-member-permission-to-admin': 'editBoardMemberPermissionToAdmin',
        'click .js-edit-board-member-permission-to-normal': 'editBoardMemberPermissionToNormal',
        'click #js-add-board-member': 'addBoardMember',
        'click .js-board-user-activity': 'showMemberActivities',
        'change .js-add-custom-background': 'addCustomBackground',
        'click .js-show-board-modal': 'showListModal',
        'click #js-select-google-sync-url': 'selectGoogleSyncUrl',
        'keyup .js-search-archived-cards': 'searchArchivedCards',
        'keyup .js-search-archived-lists': 'searchArchivedLists',
        'click .js-board-commenting-permissions': 'showCBoardCommentingPermissions',
        'click .js-select-commenting-permission': 'selectCommentingPermission',
        'click .js-show-board-member-remove-form': 'showBoardMemberRemoveForm',
        'click .js-show-add-list-form': 'showAddListForm',
        'click .js-hide-add-list-form': 'hideAddListForm',
        'submit form.js-add-list': 'addList',
        'click .js-syn-google-calendar': 'syncGoogleCalendar',
        'click .js-open-dropdown': 'openDropdown',
        'click .js-sync-google-dropdown': 'syncGoogleDropdown',
    },
    template: JST['templates/board'],
    /**
     * openDropdown()
     * copy the existing card
     * @param e
     * @type Object(DOM event)
     * @return false
     *
     */
    openDropdown: function(e) {
        e.preventDefault();
        $(e.currentTarget).addClass('open');
        return false;
    },


    /**
     * syncGoogleDropdown()
     * show the sync the board cards duedate to google calander URL
     * @param e
     * @type Object(DOM event)
     * @return false
     *
     */
    syncGoogleDropdown: function(e) {
        e.preventDefault();
        $('.js-sync-google-dropdown').addClass('open');
        return false;
    },
    /**
     * boardRename()
     * close the dropdown
     * @param e
     * @type Object(DOM event)
     * @return false
     *
     */
    closePopup: function(e) {
        var el = this.$el;
        var target = el.find(e.target);
        target.parents('div.dropdown').removeClass('open');
        return false;
    },
    /**
     * closeSubPopup()
     * close the sub dropdown
     * @param e
     * @type Object(DOM event)
     * @return false
     *
     */
    closeSubPopup: function(e) {
        var el = this.$el;
        var target = el.find(e.target);
        target.parents('.js-list-response.dropdown').removeClass('open');
        target.parents('li.dropdown').removeClass('open');
        return false;
    },
    /**
     * showBoardVisibility()
     * display the board visibility
     * @param e
     * @type Object(DOM event)
     *
     */
    showBoardVisibility: function(e) {
        var target = $(e.target);
        var parent = target.parents('.js-visibility-list-dropdown');
        var visibility = this.model.attributes.board_visibility;
        $('.js-visibility-list', parent).html(new App.ShowBoardVisibilityView({
            model: visibility
        }).el);
        parent.addClass('open');
        return false;
    },
    /**
     * subcribeBoard()
     * subcribe the board
     * @param e
     * @type Object(DOM event)
     * @return false
     *
     */
    subcribeBoard: function(e) {
        e.preventDefault();
        var name = $(e.currentTarget).attr('name');
        var value = 'unsubscribe';
        var content = '<i class="icon-eye-close"></i>' + i18next.t('Unsubscribe');
        if (name == 'unsubscribe') {
            value = 'subscribe';
            content = '<i class="icon-eye-open"></i>' + i18next.t('Subscribe');
        }
        $(e.currentTarget).attr('name', value);
        $(e.currentTarget).attr('title', value);
        $(e.currentTarget).html(content);
        var boardSubscriber = new App.BoardSubscriber();
        if (!_.isEmpty(this.model.board_subscriber) && this.model.board_subscriber.attributes.id) {
            value = '';
            if ($('#inputBoardSubscribe').val() == 'false') {
                value = 'true';
                $('#inputBoardSubscribe').val(value);
            } else {
                value = 'false';
                $('#inputBoardSubscribe').val(value);
            }
            var data = $('form#BoardSubscribeForm').serializeObject();
            boardSubscriber.url = api_url + 'boards/' + this.model.board.board_id + '/board_subscribers/' + this.model.subscriber.attributes.id + '.json';
            boardSubscriber.set('id', this.model.subscriber.attributes.id);
            boardSubscriber.save(data, {
                success: function(model, response) {}
            });
        } else {
            var subscribe_data = {};
            var self = this;
            boardSubscriber.url = api_url + 'boards/' + this.model.id + '/board_subscribers.json';
            boardSubscriber.save(subscribe_data, {
                success: function(model, response) {
                    self.model.board_subscribers.add(response);
                }
            });
        }
        return false;
    },
    /**
     * starredBoard()
     * subcribe the board
     * @param e
     * @type Object(DOM event)
     * @return false
     *
     */
    starredBoard: function(e) {
        e.preventDefault();
        $('.js-star-board').addClass('hide');
        $('.js-star-load').removeClass('hide');
        var name = $(e.currentTarget).attr('name');
        var value = 'unstar';
        var is_starred = 1;
        var content = '<i class="icon-star text-primary"></i>';
        if (name == 'unstar') {
            value = 'star';
            is_starred = 0;
            content = '<i class="icon-star-empty"></i>';
        }
        $(e.currentTarget).attr('name', value);
        $('.js-star-load').addClass('hide');
        $('.js-star-board').removeClass('hide');
        $(e.currentTarget).html(content);
        var boardStar = new App.BoardStar();
        if (!_.isEmpty(this.model.board_star) && this.model.board_star.attributes.id) {
            value = '';
            if ($('#inputBoardStar').val() == 'false') {
                value = 'true';
                is_starred = 1;
                $('#inputBoardStar').val(value);
            } else {
                value = 'false';
                is_starred = 0;
                $('#inputBoardStar').val(value);
            }
            var data = $('form#BoardStarForm').serializeObject();
            boardStar.url = api_url + 'boards/' + this.model.board.board_id + '/boards_stars/' + this.model.star.attributes.id + '.json';
            boardStar.set('id', this.model.star.attributes.id);
            boardStar.save(data, {
                success: function(model, response) {
                    App.boards.get(self.model.attributes.id).boards_stars.get(parseInt(response.id)).set('is_starred', is_starred);
                }
            });
        } else {
            var subscribe_data = {};
            var self = this;
            boardStar.url = api_url + 'boards/' + this.model.id + '/boards_stars.json';
            boardStar.set('board_id', this.model.attributes.id);
            boardStar.set('user_id', parseInt(authuser.user.id));
            boardStar.set('is_starred', is_starred);
            boardStar.save(subscribe_data, {
                success: function(model, response) {
                    boardStar.set('id', parseInt(response.id));
                    App.boards.get(self.model.attributes.id).boards_stars.reset(boardStar);
                    self.model.boards_stars.add(response);
                    self.footerView = new App.FooterView({
                        model: authuser,
                        board_id: self.model.attributes.id
                    }).renderStarredBoards();
                }
            });
        }
        return false;
    },
    /**
     * closeBoard()
     * close the board
     * @param e
     * @type Object(DOM event)
     * @return false
     *
     */
    closeBoard: function(e) {
        e.preventDefault();
        this.model.url = api_url + 'boards/' + this.model.id + '.json';
        App.boards.get(this.model.id).set('is_closed', 1);
        this.model.set('is_closed', 1);
        this.footerView = new App.FooterView({
            model: authuser,
            board_id: this.model.id
        }).renderClosedBoards();
        this.model.save({
            is_closed: 1
        }, {
            patch: true,
            success: function(model, response) {

            }
        });
        return false;
    },
    /**
     * reopenBoard()
     * reopen closed the board
     * @return false
     *
     */
    reopenBoard: function(e) {
        var data = $(e.target).serializeObject();
        this.model.url = api_url + 'boards/' + this.model.id + '.json';
        App.boards.get(this.model.id).set('is_closed', 0);
        this.model.set('is_closed', 0);
        this.model.save({
            is_closed: 0
        }, {
            patch: true,
            success: function(model, response) {}
        });
        return false;
    },
    /**
     * deleteBoard()
     * delete the board
     * @return false
     *
     */
    deleteBoard: function(e) {
        var data = $(e.target).serializeObject();
        this.model.url = api_url + 'boards/' + this.model.id + '.json';
        App.boards.remove(self.model);
        this.model.destroy({
            success: function(model, response) {
                app.navigate('#/boards', {
                    trigger: false,
                    replace: false
                });
            }
        });
        return false;
    },
    showAllVisibility: function() {
        $('.js-visibility-container').html('');
        var visibility = $('#inputBoardVisibility').val();
        $('.js-visibility-chooser').html(new App.ShowAllVisibilityView({
            model: visibility
        }).el);
        return false;
    },
    copyBoardVisibility: function(e) {
        e.preventDefault();
        var name = $(e.currentTarget).attr('name');
        var value = 0;
        if (name == 'org') {
            value = 1;
        } else if (name == 'public') {
            value = 2;
        }
        $('#inputBoardVisibility').val(value);
        $('.js-visibility-container').html(new App.CopyBoardVisibilityView({
            name: name
        }).el);
        $('.js-visibility-chooser').html('');
        return false;
    },
    hideSidebar: function() {
        var el = this.$el;
        el.find('.side-bar').addClass('disabled');
        return false;
    },
    showSidebarMenu: function(e) {
        var el = this.$el;
        el.find('.js-sidebar-menu-container').removeClass('hide');
        el.find('.js-sidebar-menu').addClass('js-hide-sidebar-menu').removeClass('js-show-sidebar-menu');
    },
    hideSidebarMenu: function(e) {
        var el = this.$el;
        el.find('.js-sidebar-menu-container').addClass('hide');
        el.find('.js-sidebar-menu').addClass('js-show-sidebar-menu').removeClass('js-hide-sidebar-menu');
    },
    /**
     * showBoardMemberPermissionForm()
     * show the board member permission list
     * @param e
     * @type Object(DOM event)
     * @return false
     *
     */
    showBoardMemberPermissionForm: function(e) {
        var target = $(e.currentTarget);
        var board_user_id = target.data('board_user_id');
        $('.js-board-member-settings').html(new App.showBoardMemberPermissionFormView({
            board_user_id: board_user_id
        }).el);
        $('.js-board-member-profile').addClass('hide');
        return false;
    },
    /**
     * editBoardMemberPermissionToAdmin()
     * change the board member permission as admin
     * @param e
     * @type Object(DOM event)
     * @return false
     *
     */
    editBoardMemberPermissionToAdmin: function(e) {
        var self = this;
        var target = $(e.currentTarget);
        var board_user_id = target.data('board_user_id');
        $('.js-board-member-settings').html(new App.EditBoardMemberPermissionToAdmin({
            board_user_id: board_user_id
        }).el);
        $('.js-board-member-profile').removeClass('hide');
        var boardUser = new App.BoardUsers();
        boardUser.url = api_url + 'boards_users/' + board_user_id + '.json';
        boardUser.set('id', board_user_id);
        boardUser.save();
        return false;
    },
    /**
     * editBoardMemberPermissionToNormal()
     * change the board member permission as noraml
     * @param e
     * @type Object(DOM event)
     * @return false
     *
     */
    editBoardMemberPermissionToNormal: function(e) {
        var self = this;
        var target = $(e.currentTarget);
        var board_user_id = target.data('board_user_id');
        $('.js-board-member-settings').html(new App.EditBoardMemberPermissionToNormal({
            board_user_id: board_user_id
        }).el);
        $('.js-board-member-profile').removeClass('hide');
        var boardUser = new App.BoardUsers();
        boardUser.url = api_url + 'boards_users/' + board_user_id + '.json';
        boardUser.set('id', board_user_id);
        boardUser.save();
        return false;
    },
    /**
     * showMemberActivities()
     * display the board member activities
     * @return false
     *
     */
    showMemberActivities: function() {
        $('.js-board-member-settings').html(new App.BoardUserActivityView({
            model: this.model
        }).el);
        $('.js-board-member-profile').addClass('hide');
        return false;
    },
    /**
     * showChangeBackground()
     * display the board background change form
     * @return false
     *
     */
    showChangeBackground: function() {
        $('.js-side-bar-' + this.model.id).addClass('side-bar-large');
        var el = this.$el;
        el.find('.js-setting-response').html(new App.BoardBackgroundView({
            model: this.model
        }).el);
        var self = this;
        _(function() {
            Backbone.TemplateManager.baseUrl = '{name}';
            var uploadManager = new Backbone.UploadManager({
                uploadUrl: api_url + 'boards/' + self.model.id + '/custom_backgrounds.json?token=' + api_token,
                autoUpload: true,
                dropZone: $('#dropzone'),
                pasteZone: null,
                singleFileUploads: true,
                formData: $('form.js-user-profile-edit').serialize(),
                fileUploadHTML: '<input id="fileupload1" type="file" name="attachment" >',
            });
            uploadManager.on('fileadd', function(file) {
                $('#dropzone').addClass('cssloader');
            });
            uploadManager.on('filedone', function(file, data) {
                $('#dropzone').removeClass('cssloader');
            });
            uploadManager.renderTo($('#manager-area'));
        }).defer();
        return false;
    },
    musical: function() {
        self = this;
        App.music.inst.silence();
        var temp = new App.MusicRepeatView();
        temp.continueMusic();
    },
    /**
     * renderBoarduserCollection()
     * populate the boarduser to the current board
     * @param NULL
     * @return object
     *
     */
    renderBoarduserCollection: function() {
        var self = this;
        $('#header').html(new App.BoardHeaderView({
            model: self.model,
        }).el);
    },
    /**
     * render()
     * populate the html to the dom
     * @param NULL
     * @return object
     *
     */
    render: function() {
        touchPunchDelay = 100;
        var self = this;
        sort_by = (this.model.attributes.sort_by) ? this.model.attributes.sort_by : 'position';
        sort_direction = (this.model.attributes.sort_direction) ? this.model.attributes.sort_direction : 'asc';
        $('body').addClass('modal-open');
        this.setBoardBackground('false');
        if (!_.isUndefined(App.boards) && !_.isUndefined(App.boards.sortField) && App.boards.sortField !== null && App.boards.sortField !== 'name') {
            App.boards.setSortField('name', 'asc');
            App.boards.sort();
        }
        this.musical();
        changeTitle('Board - ' + _.escape(this.model.attributes.name));
        if (!_.isUndefined(this.authuser)) {
            this.model.board_subscriber = this.model.board_subscribers.findWhere({
                user_id: parseInt(this.authuser.id)
            });
            this.model.board_star = this.model.board_stars.findWhere({
                user_id: parseInt(this.authuser.id)
            });
        }

        this.$el.html(this.template({
            board: this.model,
            subscriber: this.model.board_subscriber,
            star: this.model.board_star
        }));
        this.renderListsCollection();
        if (!_.isUndefined(authuser.user)) {
            if (!_.isUndefined(authuser.user) && (authuser.user.role_id == 1 || !_.isEmpty(this.model.acl_links.where({
                    slug: 'edit_list',
                    board_user_role_id: parseInt(this.model.board_user_role_id)
                })))) {
                var setintervalid = '',
                    is_moving_right = '',
                    previous_offset = 0,
                    previous_move = '',
                    is_create_setinterval = true;
                $('#js-board-lists', this.$el).sortable({
                    containment: 'window',
                    axis: 'x',
                    items: 'div.js-board-list',
                    placeholder: 'col-lg-3 col-md-3 col-sm-4 col-xs-12 board-list-placeholder board-list-height list',
                    forcePlaceholderSize: true,
                    distance: 10,
                    cursor: 'grab',
                    scrollSensitivity: 100,
                    scrollSpeed: 50,
                    handle: '.js-list-head',
                    tolerance: 'pointer',
                    update: function(ev, ui) {
                        ui.item.trigger('listSort', ev, ui);
                    },
                    start: function(ev, ui) {
                        ui.placeholder.height(ui.item.outerHeight());
                        $(ev.target).find('.js-list-head').removeClass('cur-grab');
                        $(ev.target).find('.js-list-head').children('div.dropdown').removeClass('open');
                    },
                    stop: function(ev, ui) {
                        clearInterval(setintervalid);
                        is_create_setinterval = true;
                        previous_offset = 0;
                        $(ev.target).find('.js-list-head').addClass('cur-grab');
                    },
                    over: function(ev, ui) {
                        var scrollLeft = 0;
                        var list_per_page = Math.floor($(window).width() / 270);
                        if (previous_offset !== 0 && previous_offset != ui.offset.left) {
                            if (previous_offset > ui.offset.left) {
                                is_moving_right = false;
                            } else {
                                is_moving_right = true;
                            }
                        }
                        if (previous_move !== is_moving_right) {
                            clearInterval(setintervalid);
                            is_create_setinterval = true;
                        }
                        if (is_moving_right === true && ui.offset.left > (list_per_page - 1) * 270) {
                            if (is_create_setinterval) {
                                setintervalid = setInterval(function() {
                                    scrollLeft = parseInt($('#js-board-lists').scrollLeft()) + 50;
                                    $('#js-board-lists').animate({
                                        scrollLeft: scrollLeft
                                    }, 10);
                                }, 100);
                                is_create_setinterval = false;
                            }
                        } else if (is_moving_right === false && ui.offset.left < 50) {
                            if (is_create_setinterval) {
                                setintervalid = setInterval(function() {
                                    scrollLeft = parseInt($('#js-board-lists').scrollLeft()) - 50;
                                    $('#js-board-lists').animate({
                                        scrollLeft: scrollLeft
                                    }, 10);
                                }, 100);
                                is_create_setinterval = false;
                            }
                        }
                        previous_offset = ui.offset.left;
                        previous_move = is_moving_right;
                    }
                });
            }
        }
        $('a.js-switch-grid-view').parent().addClass('active');
        if (!_.isUndefined(authuser.user)) {
            if (parseInt(self.model.attributes.id) !== 0) {
                var board_activities = new App.FooterView({
                    model: authuser,
                    board_id: self.model.attributes.id,
                    board: self.model
                });
                clearInterval(set_interval_id);
                set_interval_id = setInterval(function() {
                    board_activities.userActivities(true, 1);
                }, 10000);
            }
        }
        self.board_view_height();
        this.showTooltip();
        _(function() {
            if (self.model !== null && !_.isUndefined(self.model) && !_.isEmpty(self.model)) {
                $(window).trigger('resize');
            }
        }).defer();
        return this;
    },
    /**
     * renderListsCollection()
     * display the lists in the board
     *
     */
    renderListsCollection: function(e) {
        App.sortable = {};
        App.sortable.setintervalid_horizontal = '';
        App.sortable.setintervalid_vertical = '';
        App.sortable.is_moving_right = '';
        App.sortable.is_moving_top = '';
        App.sortable.previous_offset_horizontal = 0;
        App.sortable.previous_offset_vertical = 0;
        App.sortable.previous_move_horizontal = '';
        App.sortable.previous_move_vertical = '';
        App.sortable.is_create_setinterval_horizontal = true;
        App.sortable.is_create_setinterval_vertical = true;
        App.sortable.previous_id = '';
        var self = this;
        var view_list = self.$('#js-add-list-block');
        if (!_.isUndefined(e) && e.storeName === 'list') {
            self.model.lists.sortByColumn('position', 'asc');
            var bool = true;
            i = 0;
            if (parseInt(e.attributes.is_archived) === 0) {
                self.model.lists.each(function(list) {
                    if (bool) {
                        if (parseInt(list.attributes.id) === parseInt(e.attributes.id)) {
                            list.board_users = self.model.board_users;
                            list.labels = self.model.labels;
                            _.map(list.get('lists_cards'), function(num) {
                                _.map(num.card_labels, function(label) {
                                    var data = {
                                        id: label.label_id,
                                        name: label.label_name
                                    };
                                    var _match = _.matches(data);
                                    if (_.isEmpty(_.filter(self.model.labels, _match))) {
                                        self.model.labels.unshift(data, {
                                            silent: true
                                        });
                                    }
                                });
                            });
                            var view;
                            if (!_.isUndefined(list.get('is_new')) && list.get('is_new') === true) {
                                list.set('board_id', self.model.id);
                            } else {
                                if (parseInt(list.get('is_archived')) === 0) {
                                    var subscribers = new App.ListSubscriberCollection();
                                    subscribers.add(list.get('lists_subscribers'), {
                                        silent: true
                                    });
                                    if (!_.isUndefined(self.authuser)) {
                                        var subscribe = subscribers.findWhere({
                                            user_id: parseInt(self.authuser.id)
                                        });
                                        if (!_.isUndefined(subscribe)) {
                                            list.subscriber.set(subscribe.attributes, {
                                                silent: true
                                            });
                                        }
                                    }
                                    list.activities.add(self.model.activities, {
                                        silent: true
                                    });
                                    list.attachments = self.model.attachments;
                                    list.board_user_role_id = self.model.board_user_role_id;
                                    list.board = self.model;
                                    view = new App.ListView({
                                        model: list,
                                        attributes: {
                                            'data-list_id': list.attributes.id
                                        }
                                    });
                                    if ($('#listview_table').length === 0) {
                                        if (!_.isUndefined(self.model.lists.models[i - 1])) {
                                            var prev_list_id = self.model.lists.models[i - 1].id;
                                            var next_list = '';
                                            if ($('.js-list-' + prev_list_id).parent(".js-board-list").next().length > 0) {
                                                next_list = $('.js-list-' + e.attributes.id).parent(".js-board-list").next().data('list_id');
                                            }
                                            if (next_list !== parseInt(e.attributes.id)) {
                                                $('.js-list-' + e.attributes.id).parent(".js-board-list").remove();
                                                $('.js-list-' + prev_list_id).parent(".js-board-list").after(view.render().el);
                                            }
                                            bool = false;
                                        } else {
                                            var first_card = '';
                                            if ($("#js-board-lists").find('.js-board-list:first').length > 0) {
                                                first_card = $('#js-board-lists').find('.js-board-list:first').data('list_id');
                                            }
                                            if (first_card !== parseInt(e.attributes.id)) {
                                                $('.js-list-' + e.attributes.id).parent(".js-board-list").remove();
                                                self.$('#js-board-lists').prepend(view.render().el);
                                            }
                                            bool = false;
                                        }
                                        $('#js-board-lists').sortable("refresh");
                                    }
                                }
                            }
                        }
                        i++;
                    }
                });
            } else {
                $('.js-list-' + e.attributes.id).parent(".js-board-list").remove();
            }
        } else {

            var list_content = '';
            $('.js-board-list').remove();
            var postion = this.model.lists.max(function(list) {
                return list.get('position');
            });
            var new_position = 1;
            if (_.isObject(postion)) {
                new_position += postion.get('position');
            }

            self.model.lists.sortByColumn('position', 'asc');
            self.model.lists.each(function(list) {
                list.board_users = self.model.board_users;
                list.labels = self.model.labels;
                _.map(list.get('lists_cards'), function(num) {
                    _.map(num.card_labels, function(label) {
                        var data = {
                            id: label.label_id,
                            name: label.label_name
                        };
                        var _match = _.matches(data);
                        if (_.isEmpty(_.filter(self.model.labels, _match))) {
                            self.model.labels.unshift(data, {
                                silent: true
                            });
                        }
                    });
                });
                var view;
                if (!_.isUndefined(list.get('is_new')) && list.get('is_new') === true) {
                    list.set('board_id', self.model.id);
                } else {
                    if (parseInt(list.get('is_archived')) === 0) {
                        var subscribers = new App.ListSubscriberCollection();
                        subscribers.add(list.get('lists_subscribers'), {
                            silent: true
                        });
                        if (!_.isUndefined(self.authuser)) {
                            var subscribe = subscribers.findWhere({
                                user_id: parseInt(self.authuser.id)
                            });
                            if (!_.isUndefined(subscribe)) {
                                list.subscriber.set(subscribe.attributes, {
                                    silent: true
                                });
                            }
                        }
                        list.activities.add(self.model.activities, {
                            silent: true
                        });
                        list.attachments = self.model.attachments;
                        list.board_user_role_id = self.model.board_user_role_id;
                        list.board = self.model;
                        if ($('#listview_table').length === 0) {
                            view = new App.ListView({
                                model: list,
                                attributes: {
                                    'data-list_id': list.attributes.id
                                }
                            });
                            if (view_list.length > 0) {
                                view_list.before(view.render().el);
                            } else {
                                self.$('#js-board-lists').append(view.render().el);
                            }
                            $('#js-board-lists').sortable("refresh");
                        }
                    }
                }
            });
        }
        _(function() {
            $('body').trigger('editListRendered');
        }).defer();
        _.defer(function(view) {
            if (!_.isUndefined(card_ids) && card_ids !== null && card_ids !== '') {
                trigger_dockmodal = true;
                var trigger_card_ids = card_ids.split(',');
                for (var i = 0; i < trigger_card_ids.length; i++) {
                    var card_view = $('#js-card-' + trigger_card_ids[i]);
                    if (card_view.length === 0) {
                        var card = self.model.cards.findWhere({
                            id: parseInt(trigger_card_ids[i])
                        });
                        if (!_.isUndefined(card) && card !== null && parseInt(card.board_id) === parseInt(self.model.id)) {
                            card.list = self.model.lists.findWhere({
                                id: card.attributes.list_id
                            });
                            new App.CardView({
                                model: card
                            }).showCardModal();
                        }
                    } else {
                        if (i !== trigger_card_ids.length - 1) {
                            card_view.attr('data-triggerModal', 'true');
                        }
                        card_view.trigger('click');
                    }
                }
                card_ids = null;
                trigger_dockmodal = false;
            }
        }, this);
    },
    /**
     * renderActivitiesCollection()
     * display board activities
     *
     */
    renderActivitiesCollection: function() {
        var self = this;
        var view_activity = this.$('#js-board-activities');
        this.model.activities.sortBy();
        this.model.activities.each(function(activity) {
            activity.set('board_name', _.escape(self.model.attributes.name));
            activity.cards.add(self.model.cards);
            activity.lists.add(self.model.lists);
            activity.boards.add(self.model.attributes.lists);
            var view = new App.ActivityView({
                model: activity
            });
        });
    },
    /**
     * setBoardBackground()
     * change board background
     *
     */
    setBoardBackground: function(data) {
        var background_color = this.model.attributes.background_color;
        var background_picture_url = this.model.attributes.background_picture_url;
        var background_pattern_url = this.model.attributes.background_pattern_url;
        if (!_.isEmpty(background_picture_url) && background_picture_url != 'NULL') {
            background_picture_url = background_picture_url.replace('_XXXX.jpg', '_b.jpg');
            if (typeof data === 'object') {
                background_picture_url = background_picture_url + '?rand=' + Math.random();
            }
            $('body').css({
                'background': 'url(' + background_picture_url + ') 25% 25% no-repeat fixed',
                'background-size': 'cover'
            }).addClass('board-view');
        } else if (!_.isEmpty(background_pattern_url) && background_pattern_url != 'NULL') {
            background_pattern_url = background_pattern_url.replace('_XXXX.jpg', '_s.jpg');
            if (typeof data === 'object') {
                background_pattern_url = background_pattern_url + '?rand=' + Math.random();
            }
            $('body').css({
                'background': 'url(' + background_pattern_url + ')',
            }).addClass('board-view board-view-pattern');
        } else if (!_.isEmpty(background_color) && background_color != 'NULL') {
            $('body').css({
                'background': background_color,
            }).addClass('board-view');
        } else {
            $('body').css({
                'background': '',
            }).addClass('board-view');
        }
    },
    /**
     * addCustomBackground()
     * add board custom background image
     * @param e
     * @type Object(DOM event)
     *
     */
    addCustomBackground: function(e) {
        var self = this;
        var form = $('form.js-add-custom-background-form');
        var target = $(e.target);
        var board_background = new App.CardAttachment();
        board_background.url = api_url + 'boards/' + self.model.id + '/custom_backgrounds.json';
        board_background.save({}, {
            data: {},
            files: $('input.js-add-custom-background', form),
            iframe: true,
            success: function(model, response) {
                self.model.custom_attachments.push(board_background);
                $('.js-board-background-custom-lists').append(new App.BoardCustomBackgroundView({
                    attributes: {
                        'data-background': model.attributes.custom_attachments.path,
                    },
                    model: board_background
                }).el);
            }
        });
    },
    /**
     * changeCustomBackground()
     * change board custom background image
     * @param e
     * @type Object(DOM event)
     * @return false
     *
     */
    changeCustomBackground: function(e) {
        var image_path = $(e.currentTarget).data('background');
        $('body').removeAttr('style').css({
            'background': 'url(' + image_path + ') left top',
            'background-size': 'cover'
        }).addClass('board-view-pattern board-view');
        this.model.url = api_url + 'boards/' + this.model.id + '.json';
        this.model.set('custom_background_url', image_path);
        this.model.set('background_pattern_url', '', {
            silent: true
        });
        this.model.set('background_picture_url', '', {
            silent: true
        });
        this.model.set('background_color', '', {
            silent: true
        });
        data = {
            background_color: null,
            background_picture_url: null,
            background_pattern_url: image_path
        };
        this.model.save(data, {
            patch: true
        });
        return false;
    },
    /**
     * showListModal()
     * display the attachment in the list
     * @param e
     * @type Object(DOM event)
     * @return false
     *
     */
    showListModal: function(e) {
        var modalView = new App.ModalBoardView({
            model: this.model
        });
        modalView.show();
        return false;
    },
    showAddListForm: function(e) {
        e.preventDefault();
        var toggle = $(e.target);
        toggle.addClass('hide').next('.js-add-list').removeClass('hide').find('#inputListName').focus();
    },
    /**
     * hideAddListForm()
     * hide the list add form
     * @param e
     * @type Object(DOM event)
     * @return false
     *
     */
    hideAddListForm: function(e) {
        e.preventDefault();
        var toggle = $(e.target);
        $(e.target).parents('.js-add-list').find('#inputListName').val('');
        toggle.parents('form').addClass('hide').prev('.js-show-add-list-form').removeClass('hide');
        return false;
    },
    /**
     * addList()
     * add list into the board
     * @param e
     * @type Object(DOM event)
     * @return false
     *
     */
    addList: function(e) {
        e.preventDefault();
        var self = this;
        var el = this.$el;
        var target = $(e.target);
        var view_list = el.find('#js-board-lists');
        var data = target.serializeObject();
        if ($.trim(data.name) === '') {
            this.flash('danger', i18next.t('Whitespace is not allowed'));
            return false;
        }
        target[0].reset();
        target.parents('.dropdown').removeClass('open');
        target.prev().prev('.js-show-add-list-form').removeClass('hide').addClass('toggle-show').next('.js-show-list-actions').removeClass('hide');
        var list = new App.List();
        data.uuid = new Date().getTime();
        list.set('uuid', data.uuid);
        var postion = self.model.lists.max(function(list) {
            return (!_.isUndefined(list)) ? list.get('position') : 1;
        });
        if (_.isUndefined(data.position)) {
            data.position = (!_.isUndefined(postion) && !_.isEmpty(postion)) ? postion.get('position') + 1 : 1;
        } else {
            var before = this.model.lists.get(data.clone_list_id);
            var after = this.model.lists.next(before);
            if (typeof after == 'undefined') {
                afterPosition = before.position() + 2;
            } else {
                afterPosition = after.position();
            }
            var difference = (afterPosition - before.position()) / 2;
            var newPosition = difference + before.position();
            data.position = newPosition;
        }
        data.is_archived = 0;
        data.board_id = self.model.id;
        var view = '';
        if (!_.isUndefined(data.clone_list_id)) {
            list.set(data, {
                silent: true
            });
            var board_lists = this.model.lists.where({
                board_id: self.model.id
            });
            var lists = new App.ListCollection();
            lists.add(board_lists);
            lists.board = self.model;
            lists.add(list);
            list.board = self.model;
            view = new App.ListView({
                model: list,
                attributes: {
                    'data-list_id': list.attributes.id,
                },
            });
            $(view.render().el).insertAfter($(e.target).parents('.js-board-list'));
            $('#js-board-lists').sortable("refresh");
        }
        list.url = api_url + 'boards/' + self.model.id + '/lists.json';
        list.save(data, {
            success: function(model, response, options) {
                if (!_.isUndefined(data.clone_list_id) && !_.isUndefined(response.list) && !_.isEmpty(response.list) && response.list !== null) {
                    if (!_.isUndefined(response.list.labels) && response.list.labels.length > 0) {
                        self.model.labels.add(response.list.labels, {
                            silent: true
                        });
                        list.labels.add(response.list.labels, {
                            silent: true
                        });
                    }
                    if (!_.isUndefined(response.list.activities) && response.list.activities.length > 0) {
                        self.model.activities.add(response.list.activities, {
                            silent: true
                        });
                        list.activities.add(response.list.activities, {
                            silent: true
                        });
                    }
                    list.set(response.list);
                    list.set('custom_fields', null);
                    list.set('cards', response.list.cards);
                    self.model.cards.add(response.list.cards, {
                        silent: true
                    });
                    var i = 1;
                    _.each(response.list.attachments, function(attachment) {
                        var options = {
                            silent: true
                        };
                        if (i === response.list.attachments.length) {
                            options.silent = false;
                        }
                        var new_attachment = new App.CardAttachment();
                        new_attachment.set(attachment);
                        new_attachment.set('id', parseInt(attachment.id));
                        new_attachment.set('board_id', parseInt(attachment.board_id));
                        new_attachment.set('list_id', parseInt(attachment.list_id));
                        new_attachment.set('card_id', parseInt(attachment.card_id));
                        self.model.cards.get(parseInt(attachment.card_id)).attachments.add(new_attachment, options);
                        self.model.attachments.add(new_attachment, {
                            silent: true
                        });
                        list.attachments.add(new_attachment, {
                            silent: true
                        });
                        i++;
                    });
                    var j = 1;
                    _.each(response.list.checklists, function(checklist) {
                        var options = {
                            silent: true
                        };
                        if (j === response.list.checklists.length) {
                            options.silent = false;
                        }
                        var new_checklist = new App.CheckList();
                        new_checklist.set(checklist);
                        new_checklist.set('card_id', parseInt(checklist.card_id));
                        var checklist_item_count = parseInt(checklist.checklist_item_count);
                        new_checklist.set('checklist_item_completed_count', 0);
                        new_checklist.set('checklist_item_count', checklist_item_count);
                        new_checklist.set('checklist_item_pending_count', checklist_item_count);
                        var k = 1;
                        _.each(response.list.checklists_items, function(checklist_item) {
                            var options = {
                                silent: true
                            };
                            if (k === response.list.checklists_items.length) {
                                options.silent = false;
                            }
                            var new_checklist_item = new App.CheckListItem();
                            new_checklist_item.set(checklist_item);
                            new_checklist_item.set('card_id', parseInt(checklist_item.card_id));
                            new_checklist_item.set('checklist_id', parseInt(checklist_item.checklist_id));
                            new_checklist_item.set('id', parseInt(checklist_item.id));
                            new_checklist_item.set('position', checklist_item.position);
                            new_checklist_item.set('user_id', parseInt(checklist_item.user_id));
                            new_checklist.checklist_items.set(new_checklist_item);
                            self.model.checklist_items.add(new_checklist_item, options);
                            k++;
                        });
                        self.model.checklists.add(new_checklist, options);
                        j++;
                    });
                } else {
                    list.set('custom_fields', null);
                    list.set('lists_cards', []);
                }
                if (_.isUndefined(options.temp_id)) {
                    list.set('id', parseInt(response.id));
                } else {
                    global_uuid[data.uuid] = options.temp_id;
                    list.set('id', data.uuid);
                }
                list.set('board_id', self.model.id);
                list.set('is_archived', 0);
                self.model.lists.add(list, {
                    silent: true
                });
                list = self.model.lists.findWhere({
                    uuid: data.uuid
                });
                if (_.isUndefined(App.boards.get(list.attributes.board_id))) {
                    App.boards.add(self.model);
                }
                App.boards.get(list.attributes.board_id).lists.add(list);
                if (self.model.attributes.lists === null) {
                    self.model.attributes.lists = [];
                }
                if (self.model.attributes.lists !== null) {
                    list.set('custom_fields', null);
                    self.model.attributes.lists.push(list);
                }
                list.board_users = self.model.board_users;
                list.board_user_role_id = self.model.board_user_role_id;
                if (!_.isUndefined(data.clone_list_id)) {
                    $(view.render().el).attr('data-list_id', list.id);
                    $(view.render().el).insertAfter($(e.target).parents('.js-board-list'));
                } else {
                    list.board = self.model;
                    view = new App.ListView({
                        model: list,
                        attributes: {
                            'data-list_id': list.attributes.id,
                        },
                    });
                    $(view.render().el).insertBefore($('#js-add-list-block'));
                }
                _(function() {
                    $('body').trigger('editListRendered');
                }).defer();
                App.current_board.lists.add(list);
            }
        });
        return false;
    },
    /**
     * syncGoogleCalendar()
     * get sync google calender URL and display
     * @param e
     * @type Object(DOM event)
     *
     */
    syncGoogleCalendar: function(e) {
        e.preventDefault();
        this.$el.find('input.js-syn-calendar-response').val(this.model.attributes.google_syn_url);
    },
    /**
     * selectGoogleSyncUrl()
     * select google sync URL
     * @param e
     * @type Object(DOM event)
     *
     */
    selectGoogleSyncUrl: function(e) {
        $(e.target).select();
    },
    /**
     * searchArchivedCards()
     * search show show archived cards
     * @param e
     * @type Object(DOM event)
     *
     */
    searchArchivedCards: function(e) {
        var self = this;
        var el = this.$el;
        var search_q = $(e.currentTarget).val();

        var filtered_cards = self.model.cards.search(search_q);
        var cards = new App.CardCollection();
        if (!_.isEmpty(search_q)) {
            cards.add(filtered_cards._wrapped);
        } else {
            cards = self.model.cards;
        }
        el.find('.js-archived-cards-container').html('');
        cards.each(function(card) {
            if (card.attributes.is_archived === 1) {
                el.find('.js-archived-cards-container').append(new App.ArchivedCardView({
                    model: card
                }).el);
            }
        });
    },
    /**
     * searchArchivedLists()
     * search show show archived lists
     * @param e
     * @type Object(DOM event)
     *
     */
    searchArchivedLists: function(e) {
        var self = this;
        var el = this.$el;
        var search_q = $(e.currentTarget).val();
        var filtered_lists = this.model.lists.search(search_q);
        var lists = new App.ListCollection();
        if (!_.isEmpty(search_q)) {
            lists.add(filtered_lists._wrapped);
        } else {
            lists = self.model.lists;
        }
        el.find('.js-archived-lists-container').html('');
        lists.each(function(list) {
            if (list.attributes.is_archived === 1) {
                el.find('.js-archived-lists-container').append(new App.ArchivedListView({
                    model: list
                }).el);
            }
        });
    },
    /**
     * closeSpanPopover()
     * close popup
     * @param e
     * @type Object(DOM event)
     * @return false
     *
     */
    closeSpanPopover: function(e) {
        var el = this.$el;
        var target = el.find(e.target);
        target.parents('span.dropdown').removeClass('open');
        return false;
    },
    showBoardMemberRemoveForm: function(e) {
        e.preventDefault();
    },
    /**
     * showChatHistoryModal()
     * display the chat history in the list
     * @param e
     * @type Object(DOM event)
     * @return false
     *
     */
    showChatHistoryModal: function(e) {
        var modalView = new App.ModalChatHistoryView({
            model: this.model
        });
        modalView.show();
        return false;
    },
});
