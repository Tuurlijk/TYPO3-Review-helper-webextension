/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*global chrome, safari, SAFARI, openTab, Ember, DS, localize */
/*global isValidUrl, sanitizeString */
'use strict';

var TYPO3Review = (function () {

    function objectLength (object) {
        var length = 0;
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                ++length;
            }
        }
        return length;
    }

    /**
     * Sort function to sort objectArray by number
     *
     * @param {object} a  Object a.
     * @param {object} b  Object b.
     * @return {*}  Not defined.
     */
    function sortObjectArrayByRevision (a, b) {
        if (a._number > b._number) {
            return -1;
        }
        if (a._number < b._number) {
            return 1;
        }
        return 0;
    }

    /**
     * Reset and update are also possible cmd values
     * @param cherryPickCommand
     */
    function runCherryPickCommand (cherryPickCommand) {
        var xhr = new XMLHttpRequest(),
            parameters = "parameter=" + encodeURIComponent(cherryPickCommand) + "&cmd=review";
        xhr.open('POST', 'http://local.typo3.org/review.php', true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send(parameters);
        xhr.onerror = xhrError('Failed to run the cherry pick command');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    document.getElementById('loading').className = 'hide';
                    document.getElementById('status').innerHTML = chrome.i18n.getMessage('cherryPickSuccess');
                    document.getElementById('status').setAttribute('class', 'status2xx');
                } else {
                    xhrError('Failed to run the cherry pick command');
                }
            }
        };
    }

    /**
     * Reset review sites
     */
    function resetReviewSites () {
        document.getElementById('loading').className = 'loading';
        var xhr = new XMLHttpRequest(),
            parameters = "cmd=reset";
        xhr.open('POST', 'http://local.typo3.org/review.php', true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send(parameters);
        xhr.onerror = xhrError('Failed to reset the sites');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    document.getElementById('loading').className = 'hide';
                    document.getElementById('status').innerHTML = chrome.i18n.getMessage('resetSitesSuccess');
                    document.getElementById('status').setAttribute('class', 'status2xx');
                } else {
                    xhrError('Failed to reset the sites');
                }
            }
        };
    }

    /**
     * Update review sites
     */
    function updateReviewSites () {
        document.getElementById('loading').className = 'loading';
        var xhr = new XMLHttpRequest(),
            parameters = "cmd=update";
        xhr.open('POST', 'http://local.typo3.org/review.php', true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send(parameters);
        xhr.onerror = xhrError('Failed to update the sites');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    document.getElementById('loading').className = 'hide';
                    document.getElementById('status').innerHTML = chrome.i18n.getMessage('updateSitesSuccess');
                    document.getElementById('status').setAttribute('class', 'status2xx');
                } else {
                    xhrError('Failed to update the sites');
                }
            }
        };
    }

    function reviewIssue (responseText, revision) {
        if (responseText.startsWith(')]}\'')) {
            responseText = responseText.substr(4);
        }

        var response = JSON.parse(responseText),
            revisions,
            cherryPickCommand = '',
            allRevisionButtons = '';

        if (revision === 'latest' || '') {
            revision = objectLength(response[0].revisions);
        }
        revisions = Object.keys(response[0].revisions).map(function (key) {
            return response[0].revisions[key];
        });
        revisions.forEach(function (currentRevision) {
            if (parseInt(currentRevision._number, 10) === parseInt(revision, 10)) {
                cherryPickCommand = currentRevision.fetch['anonymous http']['commands']['Cherry Pick'];
                if (cherryPickCommand !== '') {
                    document.getElementById('currentRevision').innerHTML = '<input class="revisionButton button" type="button" name="revision" data-revision="' + currentRevision._number + '" value="Cherry-Pick revision ' + revision + '">';
                } else {
                    alert('doh! No cherry pick command found.');
                }
            }
        });
        revisions.sort(sortObjectArrayByRevision);

        revisions.forEach(function (currentRevision) {
            if (parseInt(currentRevision._number, 10) !== parseInt(revision, 10)) {
                cherryPickCommand = currentRevision.fetch['anonymous http']['commands']['Cherry Pick'];
                if (cherryPickCommand !== '') {
                    allRevisionButtons += '<input type="button" class="revisionButton button" name="revision" data-revision="' + currentRevision._number + '" value="Cherry-Pick revision ' + currentRevision._number + '">';
                } else {
                    alert('doh! No cherry pick command found.');
                }
            }
        });
        document.getElementById('allRevisions').innerHTML = allRevisionButtons;
        var allRevisions = document.getElementsByClassName('revisionButton');
        for (var m = 0, n = allRevisions.length; m < n; ++m) {
            allRevisions[m].addEventListener('click', function (event) {
                revisions.forEach(function (currentRevision) {
                    if (parseInt(currentRevision._number, 10) === parseInt(event.target.dataset.revision, 10)) {
                        cherryPickCommand = currentRevision.fetch['anonymous http']['commands']['Cherry Pick'];
                        document.getElementById('loading').className = 'loading';
                        runCherryPickCommand(cherryPickCommand);
                    }
                });
            }, false);
        }
        var resetButton = document.getElementById('resetButton');
        resetButton.addEventListener('click', resetReviewSites, false);
        var updateButton = document.getElementById('updateButton');
        updateButton.addEventListener('click', updateReviewSites, false);
    }

    function xhrError (message) {
        if (message === undefined) {
            message = 'Doh!';
        }
        console.log(message);
    }

    // Public methods
    return {

        getChangeDetailUrl: function (tabs) {
            var parser = document.createElement('a'),
                issueNumber,
                hashParts,
                revision = 'latest',
                url = '';
            parser.href = tabs[0].url;
            if (parser.hash.startsWith('#/c/')) {
                hashParts = parser.hash.split('/');

                if (hashParts.length > 2) {
                    hashParts.shift();
                    hashParts.shift();
                    issueNumber = hashParts.shift();

                    if (hashParts.length) {
                        revision = hashParts.shift();
                    }
                }

                if (issueNumber !== undefined && revision !== undefined) {
                    // https://review.typo3.org/changes/?q=change:36674&o=ALL_REVISIONS&o=DOWNLOAD_COMMANDS
                    url = parser.protocol + '//' + parser.hostname + '/changes/?q=change:' + issueNumber + '&o=ALL_REVISIONS&o=DOWNLOAD_COMMANDS';
                }
            }
            return url;
        },

        getRevision: function (tabs) {
            var parser = document.createElement('a'),
                issueNumber,
                hashParts,
                revision = 'latest';
            parser.href = tabs[0].url;
            if (parser.hash.startsWith('#/c/')) {
                hashParts = parser.hash.split('/');

                if (hashParts.length > 2) {
                    hashParts.shift();
                    hashParts.shift();
                    issueNumber = hashParts.shift();

                    if (hashParts.length > 1) {
                        revision = hashParts.shift();
                    }
                }
            }
            if (revision === '') {
                revision = 'latest';
            }
            return revision;
        },

        checkReviewSiteAvailability: function () {
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', 'http://local.typo3.org/review.php', true);
            xhr.send(null);
            xhr.onerror = xhrError;
            xhr.timeout = 1000;
            xhr.ontimeout = function () {
                document.getElementById('status').innerHTML = chrome.i18n.getMessage('reviewSiteUnavailable') + ": <a href='https://github.com/Tuurlijk/TYPO3.Review' target='github'>https://github.com/Tuurlijk/TYPO3.Review</a>.";
                document.getElementById('status').setAttribute('class', 'status4xx');
            }
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 400) {
                        document.getElementById('status').innerHTML = chrome.i18n.getMessage('reviewSiteUnavailable') + ": <a href='https://github.com/Tuurlijk/TYPO3.Review' target='github'>https://github.com/Tuurlijk/TYPO3.Review</a>.";
                        document.getElementById('status').setAttribute('class', 'status4xx');
                    }
                }
            };
        },

        loadIssueDetails: function (url, revision) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(null);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        reviewIssue(xhr.responseText, revision);
                        document.getElementById('status').setAttribute('class', 'hide');
                    }
                }
            }
            xhr.onerror = xhrError;
        }

    };
})();

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('extensionName').innerText = chrome.i18n.getMessage('extensionName');
    document.getElementById('status').innerText = chrome.i18n.getMessage('popupDefaultMessage');

    var t3Review = TYPO3Review;
    // Query for the active tab...
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        var url = t3Review.getChangeDetailUrl(tabs),
            revision = t3Review.getRevision(tabs);

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
