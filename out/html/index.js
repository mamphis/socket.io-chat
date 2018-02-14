let socket;
let myUser;
let synth = window.speechSynthesis;

let formatDate = (date) => {
    let sec = date.getSeconds();
    let min = date.getMinutes();
    let hour = date.getHours();

    if (sec < 10) { sec = '0' + sec };
    if (min < 10) { min = '0' + min };
    if (hour < 10) { hour = '0' + hour };

    return `${hour}:${min}:${sec}`;
}

$(document).ready(() => {
    socket = io();

    socket.on('logon', (user) => {
        myUser = user;
        setUserName(myUser);
    });

    socket.on('responseSetClientName', (userName) => {
        if (!userName) {
            setUserName(myUser);
        }

        myUser.name = userName;
        socket.emit('requestUsers');
        socket.emit('requestCommands');
    });

    socket.on('newClientMessage', (from, message) => {
        if (message.text == '') {
            return;
        }

        let text = $('<li>').text(`[${formatDate(new Date())}] ${from.name}: ${message.text}`).addClass(from.clientId);
        if (message.options) {
            if (message.options.class) {
                text.addClass(message.options.class);
            }

            if (message.options.img) {
                text.append('</br><img src="' + message.options.img + '">');
            }

            if (message.options.tts) {
                let utter = new SpeechSynthesisUtterance(message.options.tts);
                synth.speak(utter);
            }
        }

        $('#messages').append(text);
        window.scrollBy(0, 999999);
    });

    socket.on('responseUsers', (users) => {
        $('#userList').empty();
        users.forEach(user => {
            if (user.name && user.name != '') {
                $('#userList').append($('<li>').text(user.name));
            }
        });
    });

    socket.on('responseCommands', (commands) => {
        $('#chat_text_input').autocomplete({
            source: commands,
            minlength: 1,
            position: { my: 'top bottom', at: 'top left' },
        });
    });

    socket.on('expectUserRefresh', () => {
        socket.emit('requestUsers');
    });

    socket.on('typing', (users) => {
        let typingUsers = users.join(', ');
        if (users.length > 0) {
            $('#typing').text(typingUsers + ' typing...');
        } else {
            $('#typing').text('');
        }
    });

    function setUserName(user) {
        let randomNumber = Math.floor(Math.random() * 8999) + 1000;
        let name = prompt('Please enter your name', user.name == '' ? 'Guest' + randomNumber : user.name);
        $('#chat_text_input').focus();
        socket.emit('requestSetClientName', name);
    }

    var input = $('#chat_text_input');
    var lastTypedTime = new Date(0);
    var typingDelayMillis = 1500;

    function refreshTypingStatus() {
        if (input.val() == '' || new Date().getTime() - lastTypedTime.getTime() > typingDelayMillis) {
            socket.emit('typing', myUser.clientId, 'ended');
        } else {
            socket.emit('typing', myUser.clientId, 'started');
        }
    }

    function updateLastTypedTime() {
        lastTypedTime = new Date();
    }

    setInterval(refreshTypingStatus, 100);
    input.keydown(updateLastTypedTime);
    input.blur(refreshTypingStatus);

    $('#chat_text_form').submit(() => {
        let text = $('#chat_text_input').val();
        $('#chat_text_input').val('')

        if (text && text != '') {
            socket.emit('clientMessage', myUser.clientId, text);
        }

        // return false to not reload the page
        return false;
    });
});