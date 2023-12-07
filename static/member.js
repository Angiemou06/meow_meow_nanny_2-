let nickname_submit = document.getElementById("nickname-submit");
let nickname_input = document.getElementById("nickname-input");
let email_input = document.getElementById("email-input");
let email_submit = document.getElementById("email-submit");
let intro_input = document.getElementById("intro-input");
let intro_submit = document.getElementById("intro-submit");
let profile_picture = document.getElementById("profile-picture");
let user_member_id

nickname_submit.addEventListener('click',()=>{
    reviseMemberData();
});
email_submit.addEventListener('click',()=>{
    reviseMemberData();
});
intro_submit.addEventListener('click',()=>{
    reviseMemberData();
});

function reviseMemberData(){
    src = "/api/memberData";
    data = {
        "id":user_member_id,
        "nickname":nickname_input.value,
        "email":email_input.value,
        "introduction":intro_input.value
    }
    fetch(src,{method: "POST",headers: {'Content-Type': 'application/json'},body: JSON.stringify(data)})
    .then(function(response) {
        if (response) {
            return response.json();
        }
    })
    .then(function(data) {
        console.log(data)
        nickname_input.value="";
        email_input.value="";
        intro_input.value="";
        location.reload();
    })
    .catch(error => {
        console.log('Network error:', error);
    });
}

window.onload = async function () {
    await checkUserStatusandData();
    getMemberData();
}

async function checkUserStatusandData() {
    try {
        const jwtToken = localStorage.getItem('Token');
        const header = {
            'Authorization': `Bearer ${jwtToken}`
        };

        const response = await fetch("/api/user/auth", {
            method: "GET",
            headers: header
        });

        if (!response.ok) {
            window.location.href = "/";
            return;
        }

        const data = await response.json();

        user_member_id = data["data"]["id"];
    } catch (error) {
        console.log('Network error:', error);
    }
}

function getMemberData(){
    url = "/api/memberData";
    fetch(url, {
        method: "GET",
        headers: {
            'id': user_member_id,
        }
    })
    .then(function(response) {
        if (response) {
            return response.json();
        }
    })
    .then(function(data){
        email_input.placeholder = data["email"];
        intro_input.placeholder = data["introduction"];
        nickname_input.placeholder = data["nickname"];
        profile_picture.src = data["shot"];
    })
}

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

const booking_button =document.getElementById("booking-button");
booking_button.addEventListener('click',() =>{
    window.location="/booking";
});

const nanny_button = document.getElementById("nanny-button");
nanny_button.addEventListener('click', () => {
    window.location="/nanny";
});
