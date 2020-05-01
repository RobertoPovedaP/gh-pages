/**
 * @fileOverview This file has functions related to user index container view. This view calling from application view.
 * Available Object:
 *	App.boards						: this object contain all boards(Based on logged in user)
 *	this.model						: user model.
 */
if (typeof App === 'undefined') {
    App = {};
}
/**
 * UserIndexContainer View
 * @class UserIndexContainerView
 * @constructor
 * @extends Backbone.View
 */
App.UserIndexContainerView = Backbone.View.extend({
    /**
     * Events
     * functions to fire on events (Mouse events, Keyboard Events, Frame/Object Events, Form Events, Drag Events, etc...)
     */
    events: {
        'change .js-more-action-user': 'usersMoreActions',
        'click .js-sort': 'sortUser',
        'click .js-filter': 'filterUser',
        'submit form#UserSearch': 'userSearch'

    },
    /**
     * Constructor
     * initialize default values and actions
     */
    initialize: function(options) {
        this.sortField = options.sortField;
        this.filter_count = options.filter_count;
        this.roles = options.roles;
        this.current_param = options.current_param;
        this.overall_groups = [];
        this.sortDirection = options.sortDirection;
        if (!_.isUndefined(this.model) && this.model !== null) {
            this.model.showImage = this.showImage;
        }
        this.render();
    },
    template: JST['templates/user_index_container'],
    tagName: 'section',
    className: 'clearfix row',
    /**
     * render()
     * populate the html to the dom
     * @param NULL
     * @return object
     *
     */
    render: function() {
        var self = this;
        var is_group_app_enabled = false;
        if (!_.isUndefined(APPS) && APPS !== null && !_.isUndefined(APPS.enabled_apps) && APPS.enabled_apps !== null && $.inArray('r_groups', APPS.enabled_apps) !== -1) {
            is_group_app_enabled = true;
        }
        if (is_group_app_enabled) {
            this.$el.html('<div class="r_group_app_tabs" id="js-group_app_tabs"><div class="col-xs-12 well-lg navbar-btn"><div class="navbar-btn"><ul id = "myTab" class = "nav nav-tabs"><li class = "active"><a href = "#users" data-toggle = "tab" id="js-groupuser-tab">' + i18next.t('Users') + '</a></li><li><a href = "#groups" data-toggle = "tab" id="js-group-tab">' + i18next.t('Groups') + '</a></li></ul></div></div><div id = "myGroupTabContent" class = "tab-content"><div class = "tab-pane fade in active" id = "users"></div><div class = "tab-pane fade" id = "groups"></div></div></div>');
            this.$el.find('#users').html(this.template({
                filter_count: this.filter_count,
                roles: this.roles,
                'current_param': this.current_param
            }));
            $.ajax({
                url: api_url + 'groups.json?limit=10000&token=' + this.getToken(),
                cache: false,
                type: 'GET',
                success: function(response) {
                    self.overall_groups = [];
                    if (response.data) {
                        self.overall_groups = response.data;
                    }
                }
            });
        } else {
            this.$el.html(this.template({
                filter_count: this.filter_count,
                roles: this.roles,
                'current_param': this.current_param
            }));
        }

        if (!_.isUndefined(this.sortField)) {
            this.renderUserCollection();
        }

        this.showTooltip();
        return this;
    },
    /**
     * render()
     * populate the html to the dom
     * @param NULL
     * @return object
     *
     */
    renderUserCollection: function() {
        var self = this;
        var view = this.$el.find('.js-user-list');
        this.model.setSortField(this.sortField, this.sortDirection);
        this.model.sort();
        this.model.each(function(user) {
            user.roles = self.roles;
            user.overall_groups = self.overall_groups;
            view.append(new App.UserIndex({
                model: user
            }).el);
        });
        return this;
    },
    /**
     * filterUser()
     * @param NULL
     * @return object
     *
     */
    filterUser: function(e) {
        var _this = this;
        _this.current_page = (!_.isUndefined(_this.current_page)) ? _this.current_page : 1;
        _this.filterField = (!_.isUndefined(e)) ? $(e.currentTarget).data('filter') : _this.filterField;
        var users = new App.UserCollection();
        var colspan = "15";
        if (!_.isUndefined(APPS) && APPS !== null && !_.isUndefined(APPS.enabled_apps) && APPS.enabled_apps !== null && $.inArray('r_groups', APPS.enabled_apps) !== -1) {
            colspan = "16";
        }
        changeTitle(i18next.t('Users') + ' - ' + $(e.currentTarget).attr('title'));
        $('.js-user-list').html('<tr class="js-loader"><td colspan="' + colspan + '"><span class="cssloader"></span></td></tr>');
        users.url = api_url + 'users.json?page=' + _this.current_page + '&filter=' + _this.filterField;
        app.navigate('#/' + 'users?page=' + _this.current_page + '&filter=' + _this.filterField, {
            trigger: false,
            trigger_function: false,
        });
        users.fetch({
            cache: false,
            abortPending: true,
            success: function(users, response) {
                $('.js-user-list').html('');
                if (users.length !== 0) {
                    users.each(function(user) {
                        user.roles = response.roles;
                        user.overall_groups = _this.overall_groups;
                        $('.js-user-list').append(new App.UserIndex({
                            model: user
                        }).el);
                    });
                } else {
                    $('.js-user-list').html('<tr><td class="text-center" colspan="' + colspan + '">No record found</td></tr>');
                }
                $('.js-filter-list').children().removeClass('active');
                if (!_.isUndefined(e)) {
                    $(e.currentTarget).parent().addClass('active');
                }
                $('.pagination-boxes').unbind();
                $('.pagination-boxes').html('');
                if (!_.isUndefined(response._metadata) && parseInt(response._metadata.noOfPages) > 1) {
                    $('.pagination-boxes').pagination({
                        total_pages: parseInt(response._metadata.noOfPages),
                        current_page: parseInt(_this.current_page),
                        display_max: 4,
                        callback: function(event, page) {
                            event.preventDefault();
                            if (page) {
                                if (!_.isUndefined(_this.filterField) && _this.filterField !== null && _this.filterField !== 'all') {
                                    app.navigate('#/' + 'users?page=' + page + '&filter=' + _this.filterField, {
                                        trigger: true,
                                        trigger_function: true,
                                    });
                                } else {
                                    _this.current_page = page;
                                    app.navigate('#/' + 'users?page=' + page, {
                                        trigger: true,
                                        trigger_function: true,
                                    });
                                }
                            }
                        }
                    });
                }
            }
        });
    },
    /**
     * userSearch()
     * @param NULL
     * @return object
     *
     */
    userSearch: function(e) {
        var _this = this;
        _this.current_page = (!_.isUndefined(_this.current_page)) ? _this.current_page : 1;
        _this.searchField = $('#user_search').val();
        var users = new App.UserCollection();
        var colspan = "15";
        if (!_.isUndefined(APPS) && APPS !== null && !_.isUndefined(APPS.enabled_apps) && APPS.enabled_apps !== null && $.inArray('r_groups', APPS.enabled_apps) !== -1) {
            colspan = "16";
        }
        $('.js-user-list').html('<tr class="js-loader"><td colspan="' + colspan + '"><span class="cssloader"></span></td></tr>');
        if (!_.isUndefined(_this.searchField) && !_.isUndefined(_this.searchField)) {
            users.url = api_url + 'users.json?page=' + _this.current_page + '&search=' + _this.searchField;
        }
        users.fetch({
            cache: false,
            abortPending: true,
            success: function(users, response) {
                $('.js-user-list').html('');
                if (users.length !== 0) {
                    users.each(function(user) {
                        user.roles = response.roles;
                        user.overall_groups = _this.overall_groups;
                        $('.js-user-list').append(new App.UserIndex({
                            model: user
                        }).el);
                    });
                } else {
                    $('.js-user-list').html('<tr><td class="text-center" colspan="' + colspan + '">No record found</td></tr>');
                }
                $('.pagination-boxes').unbind();
                $('.pagination-boxes').html('');
                if (!_.isUndefined(response._metadata) && parseInt(response._metadata.noOfPages) > 1) {
                    $('.pagination-boxes').pagination({
                        total_pages: response._metadata.noOfPages,
                        current_page: _this.current_page,
                        display_max: 4,
                        callback: function(event, page) {
                            event.preventDefault();
                            if (page) {
                                _this.current_page = page;
                                _this.sortUser();
                            }
                        }
                    });
                }
            }
        });
        return false;
    },
    /**
     * sortUser()
     * @param NULL
     * @return object
     *
     */
    sortUser: function(e) {
        var _this = this;
        _this.current_page = (!_.isUndefined(_this.current_page)) ? _this.current_page : 1;
        _this.sortField = (!_.isUndefined(e)) ? $(e.currentTarget).data('field') : _this.sortField;
        _this.sortDirection = (!_.isUndefined(e)) ? $(e.currentTarget).data('direction') : _this.sortDirection;
        var users = new App.UserCollection();
        var colspan = "15";
        if (!_.isUndefined(APPS) && APPS !== null && !_.isUndefined(APPS.enabled_apps) && APPS.enabled_apps !== null && $.inArray('r_groups', APPS.enabled_apps) !== -1) {
            colspan = "16";
        }
        $('.js-user-list').html('<tr class="js-loader"><td colspan="' + colspan + '"><span class="cssloader"></span></td></tr>');
        if (!_.isUndefined(_this.sortDirection) && !_.isUndefined(_this.sortField)) {
            users.setSortField(_this.sortField, _this.sortDirection);
            if (!_.isUndefined(_this.searchField) && (_this.searchField !== '')) {
                users.url = api_url + 'users.json?page=' + _this.current_page + '&sort=' + _this.sortField + '&direction=' + _this.sortDirection + '&search=' + _this.searchField;
                app.navigate('#/' + 'users?page=' + _this.current_page + '&sort=' + _this.sortField + '&direction=' + _this.sortDirection + '&search=' + _this.searchField, {
                    trigger: false,
                    trigger_function: false,
                });
            } else {
                users.url = api_url + 'users.json?page=' + _this.current_page + '&sort=' + _this.sortField + '&direction=' + _this.sortDirection;
                app.navigate('#/' + 'users?page=' + _this.current_page + '&sort=' + _this.sortField + '&direction=' + _this.sortDirection, {
                    trigger: false,
                    trigger_function: false,
                });
            }

        } else {
            if (!_.isUndefined(_this.searchField) && (_this.searchField !== '')) {
                users.url = api_url + 'users.json?page=' + _this.current_page + '&search=' + _this.searchField;
                app.navigate('#/' + 'users?page=' + _this.current_page + '&search=' + _this.searchField, {
                    trigger: false,
                    trigger_function: false,
                });
            } else {
                users.url = api_url + 'users.json?page=' + _this.current_page;
                app.navigate('#/' + 'users?page=' + _this.current_page, {
                    trigger: false,
                    trigger_function: false,
                });
            }
        }
        if (!_.isUndefined(e)) {
            if ($(e.currentTarget).data('direction') == 'desc') {
                $(e.currentTarget).data('direction', 'asc');
                $('span.icon-caret-up').addClass('hide');
                $('span.icon-caret-down').addClass('hide');
                $(e.currentTarget).find('span').removeClass('hide');
                $(e.currentTarget).siblings('span').removeClass('hide');
                $(e.currentTarget).find('span').removeClass('icon-caret-up').addClass('icon-caret-down');
                $(e.currentTarget).siblings('span').removeClass('icon-caret-up').addClass('icon-caret-down');
            } else {
                $(e.currentTarget).data('direction', 'desc');
                $('span.icon-caret-up').addClass('hide');
                $('span.icon-caret-down').addClass('hide');
                $(e.currentTarget).find('span').removeClass('hide');
                $(e.currentTarget).siblings('span').removeClass('hide');
                $(e.currentTarget).find('span').removeClass('icon-caret-down').addClass('icon-caret-up');
                $(e.currentTarget).siblings('span').removeClass('icon-caret-down').addClass('icon-caret-up');
            }
        }
        users.fetch({
            cache: false,
            abortPending: true,
            success: function(users, response) {
                $('.js-user-list').html('');
                users.each(function(user) {
                    user.roles = response.roles;
                    $('.js-user-list').append(new App.UserIndex({
                        model: user
                    }).el);
                });
                $('.pagination-boxes').unbind();
                $('.pagination-boxes').html('');
                if (!_.isUndefined(response._metadata) && parseInt(response._metadata.noOfPages) > 1) {
                    $('.pagination-boxes').pagination({
                        total_pages: response._metadata.noOfPages,
                        current_page: _this.current_page,
                        display_max: 4,
                        callback: function(event, page) {
                            event.preventDefault();
                            if (page) {
                                _this.current_page = page;
                                _this.sortUser();
                            }
                        }
                    });
                }
            }
        });
    },
    /**
     * usersMoreActions()
     * @param NULL
     * @return object
     *
     */
    usersMoreActions: function(e) {
        var self = this;
        if (_.isUndefined($('.js-checkbox-list:checked').val())) {
            alert(i18next.t('Please select atleast one record!'));
            $("#js-more-action").val('0');
            return false;
        } else {
            if (window.confirm(i18next.t('Are you sure you want to do this action?'))) {
                var User = Backbone.Model.extend({});
                var Users = Backbone.BatchCollection.extend({
                    model: User,
                    url: api_url + 'users/bulk_action.json?token=' + api_token
                });
                var users = new Users();
                var data = {};
                $(':checkbox:checked').each(function(i) {
                    data[i] = {};
                    data[i].user_id = $(this).val();
                });
                data.action_id = {};
                data.action_id.action_id = $("#js-more-action option:selected").val();
                users.add(data, {
                    silent: true
                });
                users.save({
                    'success': function(response) {
                        if (!_.isEmpty(response.success)) {
                            if ($("#js-more-action option:selected").val() == 1) {
                                self.flash('success', i18next.t('Checked users are blocked successfully.'));
                            } else if ($("#js-more-action option:selected").val() == 2) {
                                self.flash('success', i18next.t('Checked users are unblocked successfully.'));
                            } else if ($("#js-more-action option:selected").val() == 3) {
                                self.flash('success', i18next.t('Checked users are deleted successfully.'));
                            } else if ($("#js-more-action option:selected").val() == 4) {
                                self.flash('success', i18next.t('Checked user emails are confirmed successfully.'));
                            }
                            app.navigate('#/users', {
                                trigger: true,
                            });
                        }
                    }
                });
            } else {
                $("#js-more-action").val('0');
                return false;
            }
        }
    },

    getToken: function() {
        if ($.cookie('auth') !== undefined) {
            var Auth = JSON.parse($.cookie('auth'));
            api_token = Auth.access_token;
            return api_token;
        } else {
            return false;
        }
    }
});
