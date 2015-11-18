/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*jslint plusplus:true, nomen:true, browser:true*/
/*global chrome, safari, SAFARI, openTab, Ember, DS, console, alert */

var TYPO3Review_1447791881 = (function () {
    'use strict';

    /**
     * Create popup element
     *
     */
    function createPopupDiv() {
        var containerDiv = document.createElement('div');
        containerDiv.id = 'TYPO3Review_1447791881';
        containerDiv.innerHTML = '<div class="normalMode"><div id="TYPO3Review_1447791881_status"></div>' +
            '<div id="TYPO3Review_1447791881_loading" class="hide">' +
            '<div class="throbber"></div>' +
            '</div>' +
            '<div class="buttons">' +
            '<div id="TYPO3Review_1447791881_currentRevision"></div>' +
            '<div id="TYPO3Review_1447791881_allRevisions"></div>' +
            '<div class="separator"></div>' +
            '<input id="TYPO3Review_1447791881_resetButton" class="button" type="button" name="cmd" value="Reset Review Sites">' +
            '<input id="TYPO3Review_1447791881_updateButton" class="button" type="button" name="cmd" value="Update Review Sites">' +
            '</div></div>';

        if (document.getElementsByTagName('body')[0]) {
            document.getElementsByTagName('body')[0].appendChild(containerDiv);
        } else {
            document.getElementsByTagName('html')[0].appendChild(containerDiv);
        }

    }

    /**
     * Gen the number of objects within an object
     *
     * @param object
     * @returns {number}
     */
    function objectLength(object) {
        var length = 0,
            key;
        for (key in object) {
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
    function sortObjectArrayByRevision(a, b) {
        if (a._number > b._number) {
            return -1;
        }
        if (a._number < b._number) {
            return 1;
        }
        return 0;
    }

    /**
     * Display error message
     *
     * @param message
     */
    function xhrError(message) {
        if (message === undefined) {
            message = 'Doh!';
        }
        console.log(message);
    }

    /**
     * Reset and update are also possible cmd values
     * @param cherryPickCommand
     */
    function runCherryPickCommand(cherryPickCommand) {
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
     * Get the cherry-pick command from the revision data
     * @param currentRevision
     * @returns {string}
     */
    function getCherryPickCommand(currentRevision) {
        var cherryPickCommand = '';
        if (parseInt(currentRevision._number, 10) === parseInt(event.target.dataset.revision, 10)) {
            cherryPickCommand = currentRevision.fetch['anonymous http'].commands['Cherry Pick'];
            document.getElementById('loading').className = 'loading';
            runCherryPickCommand(cherryPickCommand);
        }
        return cherryPickCommand;
    }

    /**
     * Reset review sites
     */
    function resetReviewSites() {
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
     * Show review popup
     * @param event
     */
    function showReviewPopup(event) {
        var changeDetailUrl = publicMethods.getChangeDetailUrl(event.target.parentElement.href),
            revision = 'latest',
            popup;

        console.log(changeDetailUrl);
        popup = document.getElementById('TYPO3Review_1447791881');
        event.target.parentElement.parentElement.appendChild(popup);
    }

    /**
     * Update review sites
     */
    function updateReviewSites() {
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

    /**
     * Create review buttons
     *
     * @param responseText
     * @param revision
     */
    function createReviewButtons(responseText, revision) {
        if (responseText.startsWith(')]}\'')) {
            responseText = responseText.substr(4);
        }

        var response = JSON.parse(responseText),
            revisions,
            allRevisions,
            cherryPickCommand = '',
            allRevisionButtons = '',
            m,
            n,
            resetButton,
            updateButton;

        if (revision === 'latest' || '') {
            revision = objectLength(response[0].revisions);
        }
        revisions = Object.keys(response[0].revisions).map(function (key) {
            return response[0].revisions[key];
        });
        revisions.forEach(function (currentRevision) {
            if (parseInt(currentRevision._number, 10) === parseInt(revision, 10)) {
                cherryPickCommand = currentRevision.fetch['anonymous http'].commands['Cherry Pick'];
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
                cherryPickCommand = currentRevision.fetch['anonymous http'].commands['Cherry Pick'];
                if (cherryPickCommand !== '') {
                    allRevisionButtons += '<input type="button" class="revisionButton button" name="revision" data-revision="' + currentRevision._number + '" value="Cherry-Pick revision ' + currentRevision._number + '">';
                } else {
                    alert('doh! No cherry pick command found.');
                }
            }
        });
        document.getElementById('allRevisions').innerHTML = allRevisionButtons;
        allRevisions = document.getElementsByClassName('revisionButton');
        for (m = 0, n = allRevisions.length; m < n; ++m) {
            allRevisions[m].addEventListener('click', function (event) {
                revisions.forEach(function (currentRevision) {
                    if (parseInt(currentRevision._number, 10) === parseInt(event.target.dataset.revision, 10)) {
                        cherryPickCommand = currentRevision.fetch['anonymous http'].commands['Cherry Pick'];
                        document.getElementById('loading').className = 'loading';
                        runCherryPickCommand(cherryPickCommand);
                    }
                });
            }, false);
        }
        resetButton = document.getElementById('resetButton');
        resetButton.addEventListener('click', resetReviewSites, false);
        updateButton = document.getElementById('updateButton');
        updateButton.addEventListener('click', updateReviewSites, false);
    }

    var publicMethods = {

        /**
         * Get the change detail url
         *
         * @param url
         * @returns {string}
         */
        getChangeDetailUrl: function (url) {
            var parser = document.createElement('a'),
                issueNumber,
                hashParts,
                revision = 'latest',
                detailUrl = '';
            parser.href = url;
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
                    detailUrl = parser.protocol + '//' + parser.hostname + '/changes/?q=change:' + issueNumber + '&o=ALL_REVISIONS&o=DOWNLOAD_COMMANDS';
                }
            }
            return detailUrl;
        },

        /**
         * Get currently viewed revision
         *
         * @param url
         * @returns {string}
         */
        getRevision: function (url) {
            var parser = document.createElement('a'),
                hashParts,
                revision = 'latest';
            parser.href = url;
            if (parser.hash.startsWith('#/c/')) {
                hashParts = parser.hash.split('/');

                if (hashParts.length > 2) {
                    hashParts.shift();
                    hashParts.shift();
                    hashParts.shift();

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

        /**
         * Check if the review site is available
         */
        checkReviewSiteAvailability: function () {
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', 'http://local.typo3.org/review.php', true);
            xhr.send(null);
            xhr.onerror = xhrError;
            xhr.timeout = 1000;
            xhr.ontimeout = function () {
                document.getElementById('status').innerHTML = chrome.i18n.getMessage('reviewSiteUnavailable') + ": <a href='https://github.com/Tuurlijk/TYPO3.Review' target='github'>https://github.com/Tuurlijk/TYPO3.Review</a>.";
                document.getElementById('status').setAttribute('class', 'status4xx');
            };
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 400) {
                        document.getElementById('status').innerHTML = chrome.i18n.getMessage('reviewSiteUnavailable') + ": <a href='https://github.com/Tuurlijk/TYPO3.Review' target='github'>https://github.com/Tuurlijk/TYPO3.Review</a>.";
                        document.getElementById('status').setAttribute('class', 'status4xx');
                    }
                }
            };
        },

        /**
         * Load the details for a certains issue
         *
         * @param url
         * @param revision
         */
        loadIssueDetails: function (url, revision) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(null);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        createReviewButtons(xhr.responseText, revision);
                        document.getElementById('status').setAttribute('class', 'hide');
                    }
                }
            };
            xhr.onerror = xhrError;
        },

        /*
         * Handles messages from other extension parts to content script
         *
         * @param request
         * @param sender
         * @param sendResponse
         */
        messageListener: function (request, sender, sendResponse) {
            var button,
                clone,
                externalLinkIcon,
                links,
                m,
                n,
                parent,
                reviewTextNode;

            // Execute the requested command
            if (request.cmd === 'addButtons') {
                createPopupDiv();
                links = document.getElementsByTagName('a');
                for (m = 0, n = links.length; m < n; ++m) {
                    if (links[m].href.startsWith(request.gerritUrl)) {
                        parent = links[m].parentElement;
                        clone = links[m].cloneNode(true);
                        externalLinkIcon = clone.getElementsByTagName('i')[0];
                        button = clone.getElementsByTagName('span')[0];
                        button.innerText = '';
                        button.appendChild(externalLinkIcon);
                        reviewTextNode = document.createTextNode(' Review');
                        button.appendChild(reviewTextNode);
                        clone.addEventListener('click', function (event) {
                            event.preventDefault();
                            showReviewPopup(event);
                        }, false);
                        parent.appendChild(clone);
                        ++m;
                        ++n;
                    }
                }
            }

            sendResponse({reviewNode: reviewTextNode});
        }

    };

    return publicMethods;
}());
