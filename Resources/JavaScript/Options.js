/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*global document, localStorage, localize */

'use strict';

document.addEventListener("DOMContentLoaded", function() {

    /**
     * Restore Options
     *
     * @since 1.0.0
     */
    function restoreOptions() {
        var forgerUrl = localStorage.forgerUrl,
            gerritUrl = localStorage.gerritUrl;

        if (!forgerUrl) {
            forgerUrl = 'https://forger.typo3.org/';
        }
        document.getElementById('forgerUrl').value = forgerUrl;
        if (!gerritUrl) {
            gerritUrl = 'https://review.typo3.org/';
        }
        document.getElementById('gerritUrl').value = gerritUrl;
    }

    /**
     * Save Options
     *
     * @since 1.0.0
     */
    function saveOptions() {
        localStorage.forgerUrl = document.getElementById('forgerUrl').value;
        localStorage.gerritUrl = document.getElementById('gerritUrl').value;
    }

    document.getElementById('forgerUrl').addEventListener('keyup', saveOptions);
    document.getElementById('gerritUrl').addEventListener('keyup', saveOptions);
    document.getElementById('save-options').addEventListener('click', saveOptions);
    restoreOptions();
});
