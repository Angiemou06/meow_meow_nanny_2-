let nickname;
var socketio = io();
let url = 'http://127.0.0.1';
let port = '3000';
socketio.connect(url + ':' + port);
let user_member_id
let contact_id

window.onload = async function () {
  await checkUserStatusandData();
  createRoom();
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
        console.log(user_member_id);
        // socketio.connect({ auth: { user_id: data["data"]["id"] } });
    } catch (error) {
        console.log('Network error:', error);
    }
}


let name_list = document.getElementById("name-list");
function createRoom(){
    src = "/api/room";
    fetch(src,{method: "GET"})
    .then(function(response) {
        if (response) {
            return response.json();
        }
    })
    .then(function(data) {
        for(let i=0; i<data["room_id"].length; i++){ 
            contact_id = data["contact_id"][i];
            if (user_member_id === contact_id){
                contact_id = data["user_id"][i];
            }
            url = `/api/memberData?id=${contact_id}`;
            fetch(url,{method: "GET"})
            .then(function(response) {
                if (response) {
                    return response.json();
                }
            })
            .then(function(memberData) {
                const addNameListContainer = document.createElement("div");
                addNameListContainer.className = "namelist-container";
                name_list.appendChild(addNameListContainer);
                const addContactImg = document.createElement("img");
                addContactImg.className = "contact-img";
                addContactImg.src = memberData["shot"];
                addNameListContainer.appendChild(addContactImg);
                const addContactName = document.createElement("div");
                addContactName.className = "contact-name";
                addContactName.innerHTML = memberData["nickname"];
                addNameListContainer.appendChild(addContactName);
            })
        };
    })        
    .catch(error => {
        console.log('Network error:', error);
    })
}


let message = document.getElementById("message");

const createMessage = (id, msg) => {
    let content
    if (id === user_member_id){
        content = `
            <div class="user-text">
                <span>
                    <strong class="user-message">
                        ${msg}
                    </strong>
                </span>
            </div>
            `;
    }
    else{
        content = `
            <div class="contact-text">
                <span>
                    <strong class="contact-message">
                        ${msg}
                    </strong>
                </span>
            </div>
            `;
    }
    message.innerHTML += content;
};

socketio.on("message", function(data) {
    createMessage(data["id"],data["data"]);
});

let text_input = document.getElementById("text-input");

const sendMessage = () => {
    if (text_input.value == "") return;
    socketio.emit("message", { data: text_input.value, id:user_member_id });
    text_input.value = "";
};

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

