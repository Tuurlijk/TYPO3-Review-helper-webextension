/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*jslint plusplus:true, nomen:true, browser:true*/
/*global chrome, console, alert, isValidUrl, TYPO3Review_1447791881 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    var t3Review = TYPO3Review_1447791881,
        prefix = t3Review.getPrefix();

    document.getElementById(prefix + 'extensionName').innerText = chrome.i18n.getMessage('extensionName');

    // Query for the active tab...
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        var url = t3Review.getChangeDetailUrl(tabs[0].url),
            revision = t3Review.getRevision(tabs[0].url);

        t3Review.getReviewSiteAvailability();
        t3Review.getApiVersion();

        if (url) {
            document.getElementById(prefix + 'loading').className = 'loading';
            t3Review.loadIssueDetails(url, revision);
        } else {
            t3Review.addStatusMessage(chrome.i18n.getMessage('changeIdNotFound'), 'error');
        }
    });
});
