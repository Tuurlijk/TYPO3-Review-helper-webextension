/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*global chrome, document, localStorage, safari, SAFARI, openTab, DS, localize */
'use strict';

function updateIcon (status, tabId) {
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

function reviewIssue (revision) {
    console.log(revision);
    var responseText = this.responseText;
    if (responseText.startsWith(')]}\'')) {
        responseText = responseText.substr(4);
    }

    var response = JSON.parse(responseText),
        revisions,
        cherryCommand;

    if (revision === 'latest') {
        revision = response[0].revisions.length;
    }
    revisions = Object.keys(response[0].revisions).map(function (key) {return response[0].revisions[key]});
    revisions.forEach(function (currentRevision) {
        if (parseInt(currentRevision._number, 10) === parseInt(revision, 10)) {
            cherryCommand = currentRevision.fetch['anonymous http']['commands']['Cherry Pick'];
        }
    });
}

function xhrSuccess () {
    this.callback.apply(this, this.arguments);
}

function xhrError () {
    console.log('doh!');
}

function loadIssueDetails (url, callBack, revision) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.arguments = Array.prototype.slice.call(arguments, 2);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(null);
    xhr.callback = callBack;
    xhr.onload = xhrSuccess;
    xhr.onerror = xhrError;
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // We only react on a complete load of a http(s) page,
    // only then we're sure the content.js is loaded.
    if (changeInfo.status !== 'complete' || tab.url.indexOf('http') !== 0) {
        return;
    }

    // Prepare some variables
    var gerritUrl = 'https://review.typo3.org/';

    // Check if localStorage is available and get the settings out of it
    if (localStorage) {
        if (localStorage.elements) {
            gerritUrl = localStorage.gerritUrl;
        }
    }

    // Show icon if we are on a gerritUrl
    if (tab.url.startsWith(gerritUrl)) {
        // Show the pageAction
        chrome.pageAction.show(tabId);

        var parser = document.createElement('a');
        parser.href = tab.url;
        if (parser.hash.startsWith('#/c/')) {

            var issueNumber, hashParts;

            hashParts = parser.hash.split('/');

            if (hashParts.length === 4) {
                hashParts.pop();
                issueNumber = hashParts.pop();
            } else if (hashParts.length === 3) {
                issueNumber = hashParts.pop();
            }

            if (issueNumber !== undefined) {
                updateIcon(1, tabId);
            }
        } else {
            updateIcon(0, tabId);
        }
    }
});

// Fetch the revisions
chrome.pageAction.onClicked.addListener(function (tab) {
    var parser = document.createElement('a');
    parser.href = tab.url;
    if (parser.hash.startsWith('#/c/')) {

        var issueNumber, hashParts, revision, url;

        hashParts = parser.hash.split('/');

        if (hashParts.length === 4) {
            revision = hashParts.pop();
            if (revision === '') {
                revision = 'latest';
            }
            issueNumber = hashParts.pop();
        } else if (hashParts.length === 3) {
            revision = 'latest';
            issueNumber = hashParts.pop();
        }

        if (issueNumber !== undefined && revision !== undefined) {
            // https://review.typo3.org/changes/?q=change:36674&o=ALL_REVISIONS&o=DOWNLOAD_COMMANDS
            url = parser.protocol + '//' + parser.hostname + '/changes/?q=change:' + issueNumber + '&o=ALL_REVISIONS&o=DOWNLOAD_COMMANDS';
            loadIssueDetails(url, reviewIssue, revision);
        }
    }
});
