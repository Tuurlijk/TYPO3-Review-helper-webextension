/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*jslint browser:true */
/*global chrome, TYPO3Review_1447791881 */

chrome.runtime.onMessage.addListener(TYPO3Review_1447791881.messageListener);
