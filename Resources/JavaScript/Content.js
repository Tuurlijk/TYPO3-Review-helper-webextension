/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*jslint browser:true */
/*global browser, chrome, console, alert, isValidUrl, TYPO3Review_1447791881 */

'use strict';

if (typeof browser === 'undefined') {
    var browser = chrome;
}

browser.runtime.onMessage.addListener(TYPO3Review_1447791881.contentMessageListener);

browser.runtime.sendMessage(
    {
        from: 'content',
        cmd: 'getActiveTabId'
    },
    function(response) {
        TYPO3Review_1447791881.setActiveTabId(response);
    }
);
