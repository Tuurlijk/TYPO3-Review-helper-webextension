/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*global chrome, document, localStorage, safari, SAFARI, openTab, DS, localize,
 console */

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    'use strict';

    /**
     * Update the addressbar icon
     *
     * @param status
     * @param tabId
     */
    function updateIcon(status, tabId) {
        // Figure the correct title/image with the given state
        var title = 'Please navigate to an issue',
            image = 'ToolbarIconDisabled';

        if (status === 1) {
            title = 'Review this patch in http://review.local.typo3.org/';
            image = 'ToolbarIcon';
        }

        // Update title
        chrome.pageAction.setTitle({
            tabId: tabId,
            title: title
        });

        // Update image
        chrome.pageAction.setIcon({
            tabId: tabId,
            path: {
                '19': '/Resources/Icons/' + image + '19.png',
                '38': '/Resources/Icons/' + image + '38.png'
            }
        });
    }

    // We only react on a complete load of a http(s) page,
    // only then we're sure the Content.js is loaded.
    if (changeInfo.status !== 'complete' || tab.url.indexOf('http') !== 0) {
        return;
    }

    // Prepare some variables
    var forgerUrl = 'https://forger.typo3.org/',
        gerritUrl = 'https://review.typo3.org/',
        parser,
        hashParts,
        issueNumber;

    // Check if localStorage is available and get the settings out of it
    if (localStorage) {
        if (localStorage.forgerUrl) {
            forgerUrl = localStorage.forgerUrl;
        }
        if (localStorage.gerritUrl) {
            gerritUrl = localStorage.gerritUrl;
        }
    }

    // Show icon if we are on a gerritUrl
    if (tab.url.startsWith(gerritUrl)) {
        // Show the pageAction
        chrome.pageAction.show(tabId);

        parser = document.createElement('a');
        parser.href = tab.url;
        if (parser.hash.startsWith('#/c/')) {
            hashParts = parser.hash.split('/');

            if (hashParts.length > 2) {
                hashParts.shift();
                hashParts.shift();
                issueNumber = hashParts.shift();
            }

            if (issueNumber !== undefined) {
                updateIcon(1, tabId);
            }
        } else {
            updateIcon(0, tabId);
        }
    }

    // Add content buttons if we are on a forger url with review links
    if (tab.url.startsWith(forgerUrl)) {
        parser = document.createElement('a');
        parser.href = tab.url;
        if (parser.pathname.startsWith('/gerrit/')) {
            chrome.tabs.insertCSS(tab.id, {
                file: '/Resources/CSS/ContentLight.css'
            });

            chrome.tabs.sendMessage(
                tab.id,
                {
                    cmd: 'addButtons',
                    gerritUrl: gerritUrl
                },
                function (response) {
                    console.log(response);
                }
            );
        }
    }
});

/**
 * Capture messages from the Content script. When the content is ready,
 * inject the CSS and pass the headers and the options to the content.
 */
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    var msg = request.msg;
    if (msg === 'contentReady') {
        if (typeof sender.tab !== 'undefined') {
            var optionsObject = getStorage('HTTPSpyOptions'),
                options = optionsObject['App.Options'].records[1];
            if (options.displayInfoBox) {
                if (parseInt(sender.tab.id, 10) > 0) {
                    if (options.infoBoxTheme === 'light') {
                        chrome.tabs.insertCSS(sender.tab.id, {
                            file: '/Resources/CSS/ContentLight.css'
                        });
                    } else {
                        chrome.tabs.insertCSS(sender.tab.id, {
                            file: '/Resources/CSS/ContentDark.css'
                        });
                    }
                    chrome.tabs.sendRequest(sender.tab.id, {
                        msg: 'headersAndStatus',
                        headers: headerStore[sender.tab.id],
                        options: options
                    });
                }
            }
        }
    }
    sendResponse({});
});
