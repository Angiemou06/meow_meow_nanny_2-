let btn1 = document.getElementById("btn1");
let btn2 = document.getElementById("btn2");
let btn1_line = document.getElementById("btn1-line");
let btn2_line = document.getElementById("btn2-line");
let container = document.getElementById("container");
let user_member_id;
let nannyID;
let checked;
let paid;
let startDate_list;
let endDate_list;
let time_list;
let reserver_id_list;

window.onload = async function () {
    await checkUserStatusandData();
    bt1clicked();
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

async function getBookingData(){
    src = `/api/booking?id=${user_member_id}`
    await fetch(src,{method: "GET"})
    .then(function(response) {
        if (response) {
            return response.json();
        }
    })
    .then(function(data){
        nannyID = data["nannyID"];
        checked = data["checked"];
        paid = data["paid"];
        startDate_list = data["startDate_list"];
        endDate_list = data["endDate_list"];
        time_list = data["time_list"];
        reserver_id_list = data["reserver_id_list"];
    });
}
async function bt1clicked(){
    btn1_line.style.display = "block";
    btn2_line.style.display = "none";
    container.innerHTML="";
    await getBookingData();
    if (nannyID){
        src = `/api/memberData?id=${nannyID}`
        fetch(src,{method: "GET"})
        .then(function(response) {
            if (response) {
                return response.json();
            }
        })
        .then(function(data){
            const nannyContainer = document.createElement('div');
            nannyContainer.className = "nanny-container";
            const imgDiv = document.createElement('div');
            imgDiv.className = "imgDiv"
            nannyContainer.appendChild(imgDiv);
            const img = document.createElement('img');
            img.className = "img";
            img.src = data["shot"];
            imgDiv.appendChild(img);
            const messageDiv = document.createElement('div');
            messageDiv.className = "messageDiv";
            if (checked == 0){
                messageDiv.innerHTML = "等待"+data["nickname"]+"接受預約中";
            } 
            else{
                messageDiv.innerHTML = data["nickname"]+"已接受預約";
            }
            nannyContainer.appendChild(messageDiv);
            const Button = document.createElement('button');
            Button.className = "Button";
            Button.textContent = "取消預約";
            nannyContainer.appendChild(Button);
            Button.addEventListener('click',()=>{
                url = `/api/booking?id=${user_member_id}`
                fetch(url,{method: "DELETE"})
                .then(
                    nannyContainer.innerHTML="");
            });
            container.appendChild(nannyContainer);
        });   
    }; 
}
btn1.addEventListener('click',()=>{
    bt1clicked();
});

btn2.addEventListener('click',async()=>{
    container.innerHTML="";
    btn2_line.style.display = "block";
    btn1_line.style.display = "none";
    await getBookingData();
    const reserverContainer = document.createElement('div');
    reserverContainer.className = "reserver-container";
    if(startDate_list){
        const number = startDate_list.length;
        for (let i=0;i<number;i++){
            src = `/api/memberData?id=${reserver_id_list[i]}`
            fetch(src,{method: "GET"})
            .then(function(response) {
                if (response) {
                    return response.json();
                }
            })
            .then(function(data){
                const reserverSubContainer = document.createElement('div');
                reserverSubContainer.className = "reserver-sub-container";
                const reserverImgContainer = document.createElement('div');
                reserverImgContainer.className = "reserver-img-container";
                reserverSubContainer.appendChild(reserverImgContainer);
                const reserverImg = document.createElement('img');
                reserverImg.className = "reserver-img";
                reserverImg.src = data["shot"];
                reserverImgContainer.appendChild(reserverImg);
                const reserverName = document.createElement('div');
                reserverName.innerHTML = data["nickname"];
                reserverName.className = "reserver-name";
                reserverSubContainer.appendChild(reserverName);
                const dateStartObject = new Date(startDate_list[i]);
                const dateStart = dateStartObject.toISOString().split('T')[0];
                const startDate = document.createElement('div');
                startDate.innerHTML = "開始日期："+ dateStart;
                startDate.className = "start-date";
                reserverSubContainer.appendChild(startDate);
                const dateEndObject = new Date(endDate_list[i]);
                const dateEnd = dateEndObject.toISOString().split('T')[0];
                const endDate = document.createElement('div');
                endDate.innerHTML = "結束日期："+ dateEnd;
                endDate.className = "end-date";
                reserverSubContainer.appendChild(endDate);
                const time = document.createElement('div');
                time.className = "time";
                let Time = "上午";
                if (time_list[i] == "night"){
                    Time = "下午";
                }
                time.innerHTML = "時間："+ Time;
                reserverSubContainer.appendChild(time);
                const checkedButton = document.createElement('button');
                checkedButton.className = "checked-button";
                checkedButton.textContent = "確認預約";
                checkedButton.addEventListener('click',()=>{
                    url = "/api/checked"
                    checkedData = {
                        "id":data["id"]
                    }
                    fetch(url,{method: "POST",headers: {'Content-Type': 'application/json'},body: JSON.stringify(checkedData)})
                    .then(

                        window.location="/booking"
                    );
                });
                reserverSubContainer.appendChild(checkedButton);
                const reserverHr = document.createElement('hr');
                reserverHr.className = "reserver-hr";
                reserverSubContainer.appendChild(reserverHr);
                const canceledButton = document.createElement('button');
                canceledButton.className = "canceled-button";
                canceledButton.textContent = "取消預約";
                canceledButton.addEventListener('click',() => {
                    url = `/api/booking?id=${data["id"]}`
                    fetch(url,{method: "DELETE"})
                    .then(
                        window.location="/booking"
                    );
                });
                reserverSubContainer.appendChild(canceledButton);
                reserverContainer.appendChild(reserverSubContainer);
            });
            container.appendChild(reserverContainer);
        }
    }
})

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