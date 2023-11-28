const title = document.getElementById("title");
title.addEventListener('click',() => {
    window.location="/index";
});

const order_button = document.getElementById("order-button");
order_button.addEventListener('click', () => {
    window.location="/order";
});

const message_button = document.getElementById("message-button");
message_button.addEventListener('click', () => {
    window.location="/message";
});

const user_logo = document.getElementById("user-logo");
user_logo.addEventListener('click', () => {
    window.location="/member";
});

const log_out = document.getElementById("log-out");
log_out.addEventListener('click', () => {
    logOut();
})

function logOut(){
    localStorage.removeItem('Token');
    window.location="/";
}

const nanny_button = document.getElementById("nanny-button");
nanny_button.addEventListener('click', () => {
    window.location="/nanny";
});