/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*jslint plusplus:true, nomen:true, browser:true*/
/*global browser, chrome, console, alert, isValidUrl, TYPO3Review_1447791881 */

'use strict';

if (typeof browser === 'undefined') {
    var browser = chrome;
}

document.addEventListener('DOMContentLoaded', function () {
    var t3Review = TYPO3Review_1447791881;

    document.querySelector('#TYPO3Review_1447791881 .extensionName').innerText = browser.i18n.getMessage('extensionName');

    // Query for the active tab...
    browser.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        var url = t3Review.getChangeDetailUrl(tabs[0].url),
            revision = t3Review.getRevision(tabs[0].url);

        t3Review.populatePopup(url, revision);
    });
});
