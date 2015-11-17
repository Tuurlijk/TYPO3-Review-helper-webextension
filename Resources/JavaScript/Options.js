/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*global chrome, document, jQuery, localStorage, safari, SAFARI, openTab, DS, localize */

jQuery(document).ready(function ($) {
    'use strict';

    /**
     * Restore Options
     */
    function restore_options() {
        var gerritUrl = localStorage.gerritUrl;

        if (!gerritUrl) {
            gerritUrl = 'https://review.typo3.org/';
        }
        $('#gerritUrl').val(gerritUrl);
    }

    /**
     * Save Options
     */
    function save_options() {
        localStorage.gerritUrl = $('#gerritUrl').val();
    }

    $('#gerritUrl').keyup(function () {
        save_options();
    });
    $('#save-options').click(save_options);
    restore_options();
});
