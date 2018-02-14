"use strict";
///<reference path="../../node_modules/@types/jquery/index.d.ts"/>
///<reference path="../../node_modules/@types/jqueryui/index.d.ts"/>
///<reference path="../../node_modules/@types/socket.io-client/index.d.ts"/>
///<reference path="../server/model/user"/>
var socket;
var myUserId;
var myUserName;
var synth = window.speechSynthesis;
var formatDate = function (date) {
    var sec = date.getSeconds();
    var min = date.getMinutes();
    var hour = date.getHours();
    var ssec = sec.toString();
    var smin = min.toString();
    var shour = hour.toString();
    if (sec < 10) {
        ssec = '0' + sec;
    }
    if (min < 10) {
        smin = '0' + min;
    }
    if (hour < 10) {
        shour = '0' + hour;
    }
    return shour + ":" + smin + ":" + ssec;
};
$(document).ready(function () {
    socket = io();
    socket.on('logon', function (userId) {
        myUserId = userId;
        setUserName(myUserName);
    });
    socket.on('responseSetClientName', function (userName) {
        if (!userName) {
            setUserName(myUserName);
        }
        myUserName = userName;
        socket.emit('requestUsers');
        socket.emit('requestCommands');
    });
    socket.on('newClientMessage', function (fromId, fromName, message) {
        if (message.text == '') {
            return;
        }
        var text = $('<li>').text("[" + formatDate(new Date()) + "] " + fromName + ": " + message.text).addClass(fromId);
        if (message.options) {
            if (message.options.class) {
                text.addClass(message.options.class);
            }
            if (message.options.img) {
                text.append('</br><img src="' + message.options.img + '">');
            }
            if (message.options.tts) {
                var utter = new SpeechSynthesisUtterance(message.options.tts);
                synth.speak(utter);
            }
        }
        $('#messages').append(text);
        window.scrollBy(0, 999999);
    });
    socket.on('responseUsers', function (userNames) {
        $('#userList').empty();
        userNames.forEach(function (userName) {
            if (userName && userName != '') {
                $('#userList').append($('<li>').text(userName));
            }
        });
    });
    socket.on('responseCommands', function (commands) {
        $('#chat_text_input').autocomplete({
            source: commands,
            minLength: 1,
            position: { my: 'top bottom', at: 'top left' }
        });
    });
    socket.on('expectUserRefresh', function () {
        socket.emit('requestUsers');
    });
    socket.on('typing', function (users) {
        var typingUsers = users.join(', ');
        if (users.length > 0) {
            $('#typing').text(typingUsers + ' typing...');
        }
        else {
            $('#typing').text('');
        }
    });
    function setUserName(userName) {
        var randomNumber = Math.floor(Math.random() * 8999) + 1000;
        var name = prompt('Please enter your name', userName == '' ? 'Guest' + randomNumber : userName);
        $('#chat_text_input').focus();
        socket.emit('requestSetClientName', name);
    }
    var input = $('#chat_text_input');
    var lastTypedTime = new Date(0);
    var typingDelayMillis = 1500;
    function refreshTypingStatus() {
        if (input.val() == '' || new Date().getTime() - lastTypedTime.getTime() > typingDelayMillis) {
            socket.emit('typing', myUserId, 'ended');
        }
        else {
            socket.emit('typing', myUserId, 'started');
        }
    }
    function updateLastTypedTime() {
        lastTypedTime = new Date();
    }
    setInterval(refreshTypingStatus, 100);
    input.keydown(updateLastTypedTime);
    input.blur(refreshTypingStatus);
    $('#chat_text_form').submit(function () {
        var text = $('#chat_text_input').val();
        $('#chat_text_input').val('');
        if (text && text != '') {
            socket.emit('clientMessage', myUserId, text);
        }
        // return false to not reload the page
        return false;
    });
});
