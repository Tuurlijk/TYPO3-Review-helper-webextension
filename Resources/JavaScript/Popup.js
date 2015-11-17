/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*jslint plusplus:true, nomen:true, browser:true*/
/*global chrome, console, alert, isValidUrl, TYPO3Review_1447791881 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    document.getElementById('extensionName').innerText = chrome.i18n.getMessage('extensionName');
    document.getElementById('status').innerText = chrome.i18n.getMessage('popupDefaultMessage');

    var t3Review = TYPO3Review_1447791881;
    // Query for the active tab...
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        var url = t3Review.getChangeDetailUrl(tabs[0].url),
            revision = t3Review.getRevision(tabs[0].url);

        t3Review.checkReviewSiteAvailability();

        if (url) {
            document.getElementById('status').innerText = chrome.i18n.getMessage('loading');
            document.getElementById('status').setAttribute('class', 'status2xx');
            t3Review.loadIssueDetails(url, revision);
        } else {
            document.getElementById('status').innerText = chrome.i18n.getMessage('changeIdNotFound');
            document.getElementById('status').setAttribute('class', 'status4xx');
        }
    });
});
