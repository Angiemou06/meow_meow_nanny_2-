let nickname;
var socketio = io();
let url = 'http://127.0.0.1';
let port = '3000';
let user_member_id
let contact_id
let message = document.getElementById("message");
let lastMessage;
let send_button = document.getElementById("send-button");
let roomId;
let clickMember;
let ct=0;

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
        // socketio.connect(
        //     url + ':' + port,
        //     { 
        //         query: {auth: { user_id: data["data"]["id"] } }
        //     }
        // );
    } catch (error) {
        console.log('Network error:', error);
    }
}

let name_list = document.getElementById("name-list");
function createRoom(){
    src = `/api/room?id=${user_member_id}`;
    fetch(src,{method: "GET"})
    .then(function(response) {
        if (response) {
            return response.json();
        }
    })
    .then(async function(data) {
        for(let i=0; i<data["room_id"].length; i++){ 
            contact_id = data["member_1_id"][i];
            if (user_member_id === contact_id){
                contact_id = data["member_2_id"][i];
            }
            let addNameListContainer = document.createElement("div");
            addNameListContainer.className = "namelist-container";
            addNameListContainer.id = data["room_id"][i];
            name_list.appendChild(addNameListContainer);
            if (i==0){
                createChat(data["room_id"][i]);
                roomId = data["room_id"][i];
                clickMember = document.getElementById(data["room_id"][i]);
                clickMember.addEventListener('click',()=>{
                    ct = 1;
                });
            };
            url = `/api/memberData?id=${contact_id}`;
            await fetch(url,{method: "GET"})
            .then(function(response) {
                if (response) {
                    return response.json();
                }
            })
            .then(function(memberData) {
                const addContactImg = document.createElement("img");
                addContactImg.className = "contact-img";
                addContactImg.src = memberData["shot"];
                addNameListContainer.appendChild(addContactImg);
                const addContactName = document.createElement("div");
                addContactName.className = "contact-name";
                addContactName.innerHTML = memberData["nickname"];
                addNameListContainer.appendChild(addContactName);
                addNameListContainer.addEventListener('click',(event)=>{
                    let clickedElementId = event.currentTarget.id;
                    if (clickedElementId){
                        socketio.emit("join_chatroom", {
                            "room_id":clickedElementId 
                        });
                    }
                    else{
                        alert("請點選對話對象");
                    }  
                })
            })
        
        };
    })
    .then(()=>{
        let namelist_containers = document.querySelectorAll(".namelist-container");
        namelist_containers.forEach(namelist_container => {
            namelist_container.addEventListener('click',() => {
                message.innerHTML = "";
                createChat(namelist_container.id);
            });
        });
    })      
    .catch(error => {
        console.log('Network error:', error);
    })
}

send_button.addEventListener('click',()=>{
    sendMessage();

});
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
    console.log(user_member_id + " : ");
    console.log(data);
    createMessage(data["id"],data["data"]);
});

let text_input = document.getElementById("text-input");

socketio.on("roomID", function(data) {
    roomId = data["roomID"];
});

const sendMessage = () => {
    if (text_input.value == "") return;
    if (roomId){
        socketio.emit("message", { "data": text_input.value, "id":user_member_id,"roomId":roomId });
        if (ct==0){
            createMessage(user_member_id,text_input.value);
        }
    }
    else{
        alert("請點選對話對象");
    }
    text_input.value = "";
};

function createChat(room_id){
    src = `/api/chatMessage?roomId=${room_id}`;
    fetch(src,{method: "GET"})
    .then(function(response) {
        if (response) {
            return response.json();
        }
    })
    .then(function(data) {
        for(i=0;i<data["message"].length;i++){
            createMessage(data["sender_id"][i],data["message"][i]);
        }
    })
    .catch(error => {
        console.log('Network error:', error);
    });
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

const nanny_button = document.getElementById("nanny-button");
nanny_button.addEventListener('click', () => {
    window.location="/nanny";
});

