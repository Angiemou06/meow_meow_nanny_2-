let dateStart = document.getElementById("dateStart");
let dateEnd = document.getElementById("dateEnd");
let time = document.getElementsByName("time");
const orderButton = document.getElementById("order-submit-button");
let orderTime;
let user_member_id;

window.onload = async function () {
    await checkUserStatusandData();
};
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

let today = new Date();
let dd = String(today.getDate()).padStart(2, '0');
let mm = String(today.getMonth() + 1).padStart(2, '0');
let yyyy = today.getFullYear();
today = yyyy + '-' + mm + '-' + dd;
document.getElementById("dateStart").min = today;

orderButton.addEventListener('click',()=>{
    if (dateStart.value == ""){
        alert("請選擇開始日期");
        return
    }
    else if (dateEnd.value == ""){
        alert("請選擇結束日期");
        return
    }
    else if (dateEnd.value < dateStart.value){
        alert("結束日期不得早於開始日期");
        return
    }
    time.forEach(element=>{
        if (element.checked){
            orderTime = element.value;
        }
    })
    data = {
        "memberID":user_member_id,
        "nannyID":nannyID,
        "dateStart":dateStart.value,
        "dateEnd":dateEnd.value,
        "time":orderTime,
        "price":price,
        "lat":lat,
        "lng":lng
    }
    src = "/api/booking"
    fetch(src,{method: "POST",headers: {'Content-Type': 'application/json'},body: JSON.stringify(data)})
    .then(function(response) {
        if (response) {
            return response.json();
        }
    })
    .then(function(data) {
        if (data["ok"]== true){
            window.location="/booking";
        }
        else if (data["ok"]== false){
            alert("須先取消原先預約或將已完成預約進行付款，才可進行其他預約")
            return
        }
    })
});

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