/**
 * @fileOverview This file has functions related to user change password view. This view calling from application view.
 * Available Object:
 *	App.boards						: this object contain all boards(Based on logged in user)
 *	this.model						: user model.
 */
if (typeof App === 'undefined') {
    App = {};
}
/**
 * Changepassword View
 * @class ChangepasswordView
 * @constructor
 * @extends Backbone.View
 */
App.ChangepasswordView = Backbone.View.extend({
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
    template: JST['templates/change_password'],
    tagName: 'article',
    className: 'clearfix',
    id: 'change_password',
    /**
     * Events
     * functions to fire on events (Mouse events, Keyboard Events, Frame/Object Events, Form Events, Drag Events, etc...)
     */
    events: {
        'submit': 'changepassword'
    },
    /**
     * changepassword()
     * update user password
     * @return false
     */
    changepassword: function(e) {
        var target = $(e.target);
        var data = $('form#UserChangePasswordForm').serializeObject();
        if ($.trim(data.confirm_password) === '' || $.trim(data.old_password) === '' || $.trim(data.password) === '') {
            if ($.trim(data.confirm_password) === '' && $.trim(data.old_password) === '' && $.trim(data.password) === '') {
                $('.error-msg-confirm').remove();
                $('.error-msg-password').remove();
                $('.error-msg-old').remove();
                $('<div class="error-msg-confirm text-primary h6">' + i18next.t('Whitespace is not allowed') + '</div>').insertAfter('#inputConfirmPassword');
                $('<div class="error-msg-password text-primary h6">' + i18next.t('Whitespace is not allowed') + '</div>').insertAfter('#inputPassword');
                $('<div class="error-msg-old text-primary h6">' + i18next.t('Whitespace is not allowed') + '</div>').insertAfter('#inputOldPassword');
            } else if ($.trim(data.confirm_password) === '') {
                $('.error-msg-confirm').remove();
                $('.error-msg-password').remove();
                $('.error-msg-old').remove();
                $('<div class="error-msg-confirm text-primary h6">' + i18next.t('Whitespace is not allowed') + '</div>').insertAfter('#inputConfirmPassword');
            } else if ($.trim(data.old_password) === '') {
                $('.error-msg-confirm').remove();
                $('.error-msg-password').remove();
                $('.error-msg-old').remove();
                $('<div class="error-msg-old text-primary h6">' + i18next.t('Whitespace is not allowed') + '</div>').insertAfter('#inputOldPassword');
            } else if ($.trim(data.password) === '') {
                $('.error-msg-confirm').remove();
                $('.error-msg-password').remove();
                $('.error-msg-old').remove();
                $('<div class="error-msg-password text-primary h6">' + i18next.t('Whitespace is not allowed') + '</div>').insertAfter('#inputPassword');
            }
        } else {
            target[0].reset();
            var user = new App.User();
            var self = this;
            user.url = api_url + 'users/' + this.model.user_id + '/changepassword.json';
            user.save(data, {
                success: function(model, response) {
                    if (response.error) {
                        if (parseInt(response.error) === 1) {
                            self.flash('danger', i18next.t('Your old password is incorrect, please try again.'));
                        } else if (parseInt(response.error) === 2) {
                            self.flash('danger', i18next.t('Unable to change password. Please try again.'));
                        } else if (parseInt(response.error) === 3) {
                            self.flash('danger', i18next.t('New and confirm password field must match, please try again.'));
                        }
                    } else {
                        self.flash('success', i18next.t('Password has been changed successfully.'));
                        $.removeCookie('auth');
                        delete(App.boards);
                        custom_fields = {};
                        $.removeCookie('chat_initialize');
                        $.removeCookie('filter');
                        $.removeCookie('activities_filter');
                        localforage.clear();
                        api_token = '';
                        authuser = new App.User();
                        app.navigate('#/users/login', {
                            trigger: true,
                            replace: true
                        });
                        clearInterval(set_interval_id);
                        if (!_.isUndefined(authuser.user) && !_.isEmpty(BOSH_SERVICE_URL)) {
                            converse.user.logout();
                        }
                        $('#conversejs').remove();
                    }
                }
            });
        }
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
        this.$el.html(this.template(this.model));
        this.showTooltip();
        return this;
    }
});
