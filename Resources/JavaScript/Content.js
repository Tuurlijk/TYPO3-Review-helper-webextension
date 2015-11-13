/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*global chrome, document, safari, SAFARI, openTab, Ember, DS, localize */

var TYPO3Review = (function () {
    'use strict';

    // Check if an element is present and return the id
    function isElementPresent (arr) {
        var element,
            i;
        for (i = 0; i < arr.length; i += 1) {
            element = document.getElementById(arr[i]);
            if (element !== null) {
                return arr[i];
            }
        }
        return false;
    }

    // Find closest form element
    function findClosestFormElement (id) {
        var element = document.getElementById(id),
            formElement = null,
            formFound = false;
        while (!formFound) {
            element = element.parentNode;
            if (element.tagName.toLowerCase() === 'form') {
                formFound = true;
            }
        }
        if (formFound) {
            formElement = element;
        }
        return formElement;
    }

    // Public methods
    var exposed = {
        // Handles messages from other extension parts
        messageListener: function (request, sender, sendResponse) {
            var autoSubmit,
                result,
                elements,
                gerritUrl;

            if (request.gerritUrl !== '') {
                gerritUrl = request.gerritUrl;
            }

            if (request.elements !== '') {
                elements = request.elements;
            }

            if (request.autoSubmit !== '') {
                autoSubmit = request.autoSubmit;
            }

            // Execute the requested command
            if (request.cmd === 'isElementPresent') {
                result = exposed.isElementPresent(autoSubmit, elements, gerritUrl);
            } else if (request.cmd === 'reviewTYPO3Patch') {
                result = exposed.reviewTYPO3Patch(elements, gerritUrl);
            }

            // Respond with the current status
            sendResponse({status: result});
        },

        // Check if elements are present
        isElementPresent: function (autoSubmit, elements, gerritUrl) {
            var status;
            if (autoSubmit) {
                status = exposed.reviewTYPO3Patch(elements, gerritUrl);
            } else {
                status = isElementPresent(elements);
            }
            return status;
        },

        // Review patch
        reviewTYPO3Patch: function () {
            return true;
        }

    };
    return exposed;
}());

// Attach the message listener
chrome.runtime.onMessage.addListener(TYPO3Review.messageListener);
