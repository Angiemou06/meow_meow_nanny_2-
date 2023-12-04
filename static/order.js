let btn1 = document.getElementById("btn1");
let btn2 = document.getElementById("btn2");
let btn3 = document.getElementById("btn3");
orderSubDetailContainer = document.getElementById("order-sub-detail-container");
let user_member_id;
let hello = document.getElementById("hello");
let order_detail = document.getElementById("order-detail");
let success_pay = document.getElementById("success-pay");
let currentDate = new Date();
let price;
let name_input = document.getElementById("name-input");
let phone_input = document.getElementById("phone-input");
let address_input = document.getElementById("address-input");
let hr1 = document.getElementById("hr1");
let hr2 = document.getElementById("hr2");

window.onload = async function () {
    await checkUserStatusandData();
    await bt1clicked();
    hr1.style.visibility="visible";
    orderSubDetailContainer.style.display="block";
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

function bt1clicked(){
    src = `/api/checked?id=${user_member_id}`
    fetch(src,{method: "GET"})
    .then(function(response) {
        if (response) {
            return response.json();
        }
    })
    .then(function(data){
        if (data["nanny_nickname"]){
            order_detail.style.display = "block";
            hello.innerHTML = data["nickname"]+" 您好，以下是您預約的到府貓貓保姆服務：";
            const nannyName = document.createElement('div');
            nannyName.innerHTML = "提供服務保姆： "+data["nanny_nickname"];
            nannyName.className = "nanny-name";
            order_detail.appendChild(nannyName);
            const startDate = document.createElement('div');
            const dateStartObject = new Date(data["startDate"]);
            const dateStart = dateStartObject.toISOString().split('T')[0];
            startDate.innerHTML = "服務開始日期： "+ dateStart;
            startDate.className = "start-date";
            order_detail.appendChild(startDate);
            const endDate = document.createElement('div');
            const dateEndObject = new Date(data["endDate"]);
            const dateEnd = dateEndObject.toISOString().split('T')[0];
            endDate.innerHTML = "服務結束日期： "+ dateEnd;
            endDate.className = "end-date";
            order_detail.appendChild(endDate);
            const time = document.createElement('div');
            time.className ="time";time.innerHTML = "服務時間：上午"
            if (data["time"] == "night"){
                time.className ="time";time.innerHTML = "服務時間：下午"
            }
            order_detail.appendChild(time);
            const diffDay = (dateEndObject-dateStartObject)/86400000;
            price = data["price"]*diffDay;
            const diffDayDiv = document.createElement('div');
            diffDayDiv.className = "diff-day-div"
            diffDayDiv.innerHTML = "服務天數共計 "+ diffDay + " 天，服務費用總計 "+price+" 元新台幣。";
            order_detail.appendChild(diffDayDiv);
            const cancelButton = document.createElement('button');
            cancelButton.className = "cancel-button";
            cancelButton.textContent = "取消預約";
            cancelButton.addEventListener('click',()=>{
                url = `/api/booking?id=${user_member_id}`
                    fetch(url,{method: "DELETE"})
                    .then(
                        window.location="/order"
                    );
            });
            order_detail.appendChild(cancelButton);
        }
       
    });
}

btn1.addEventListener('click',()=>{
    window.location="/order";
});

TPDirect.setupSDK(137094, 'app_3nR5emGikrgjUTs0oy4Ld75bVkUKL1zTd9zXsqTDz7qU5NqTbzKXgeMr7CYL', 'sandbox');
// 以下提供必填 CCV 以及選填 CCV 的 Example
// 必填 CCV Example
var fields = {
    number: {
        // css selector
        element: document.getElementById('card-number-input'),
        placeholder: '**** **** **** ****'
    },
    expirationDate: {
        // DOM object
        element: document.getElementById('card-day-input'),
        placeholder: 'MM / YY'
    },
    ccv: {
        element: document.getElementById('card-ccv-input'),
        placeholder: '後三碼'
    }
}
TPDirect.card.setup({
    fields: fields,
    styles: {
        // Style all elements
        'input': {
            'color': 'gray'
        },
        // Styling ccv field
        'input.ccv': {
            // 'font-size': '16px'
        },
        // Styling expiration-date field
        'input.expiration-date': {
            // 'font-size': '16px'
        },
        // Styling card-number field
        'input.card-number': {
            // 'font-size': '16px'
        },
        // style focus state
        ':focus': {
            // 'color': 'black'
        },
        // style valid state
        '.valid': {
            'color': 'green'
        },
        // style invalid state
        '.invalid': {
            'color': 'red'
        },
        // Media queries
        // Note that these apply to the iframe, not the root window.
        '@media screen and (max-width: 400px)': {
            'input': {
                'color': 'orange'
            }
        }
    },
    // 此設定會顯示卡號輸入正確後，會顯示前六後四碼信用卡卡號
    isMaskCreditCardNumber: true,
    maskCreditCardNumberRange: {
        beginIndex: 6, 
        endIndex: 11
    }
});

TPDirect.card.onUpdate(function (update) {
    // update.canGetPrime === true;
    // --> you can call TPDirect.card.getPrime()
    const submitButton = document.getElementById('pay-button');
    if (update.canGetPrime) {
    //     // Enable submit Button to get prime.
        submitButton.removeAttribute('disabled')
    } else {
    //     // Disable submit Button to get prime.
        submitButton.setAttribute('disabled', true)
    }
                                            
    // cardTypes = ['mastercard', 'visa', 'jcb', 'amex', 'unknown']
    var newType = update.cardType === 'unknown' ? '' : update.cardType
        $('#cardtype').text(newType)

    // number 欄位是錯誤的
    if (update.status.number === 2) {
        // setNumberFormGroupToError()
    } else if (update.status.number === 0) {
        // setNumberFormGroupToSuccess()
    } else {
        // setNumberFormGroupToNormal()
    }
    
    if (update.status.expiry === 2) {
        // setNumberFormGroupToError()
    } else if (update.status.expiry === 0) {
        // setNumberFormGroupToSuccess()
    } else {
        // setNumberFormGroupToNormal()
    }
    
    if (update.status.ccv === 2) {
        // setNumberFormGroupToError()
    } else if (update.status.ccv === 0) {
        // setNumberFormGroupToSuccess()
    } else {
        // setNumberFormGroupToNormal()
    }
})

TPDirect.card.getTappayFieldsStatus()
// call TPDirect.card.getPrime when user submit form to get tappay prime
// $('form').on('submit', onSubmit)

let  submitButton = document.getElementById('pay-button');
submitButton.addEventListener('click',async(event)=>{
    const prime = await onSubmit(event);
    if (prime) {
        orderSubDetailContainer.style.display = "none";
        success_pay.style.display = "block";
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 月份是從 0 開始的，所以要加 1
        const currentDay = currentDate.getDate();
        const currentHour = currentDate.getHours();
        const currentMinute = currentDate.getMinutes();
        const currentSecond = currentDate.getSeconds();
        data = {
            "member_id":user_member_id,
            "orderPrice":price,
            "orderDate":currentYear+"-"+currentMonth+"-"+currentDay+" "+currentHour+":"+currentMinute+":"+currentSecond,
            "name_input":name_input.value,
            "phone_input":phone_input.value,
            "address_input":address_input.value
        }
        src = "/api/order";
        fetch(src,{method: "POST",headers: {'Content-Type': 'application/json'},body: JSON.stringify(data)})
    }
});

function onSubmit(event) {
    return new Promise((resolve, reject) => {
        event.preventDefault()

        // 取得 TapPay Fields 的 status
        const tappayStatus = TPDirect.card.getTappayFieldsStatus()
        // 確認是否可以 getPrime
        if (tappayStatus.canGetPrime === false) {
            return
        }

        // Get prime
        TPDirect.card.getPrime((result) => {
            if (result.status !== 0) {
                reject('get prime error ' + result.msg)
            }
            resolve(result.card.prime);
            // send prime to your server, to pay with Pay by Prime API .
            // Pay By Prime Docs: https://docs.tappaysdk.com/tutorial/zh/back.html#pay-by-prime-api
        })
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

const booking_button =document.getElementById("booking-button");
booking_button.addEventListener('click',() =>{
    window.location="/booking";
});

btn2.addEventListener('click',()=>{
    hr1.style.visibility="hidden";
    orderSubDetailContainer.innerHTML="";
    src = `/api/order?id=${user_member_id}`;
    fetch(src,{method: "GET"})
    .then(function(response) {
        if (response) {
            return response.json();
        }
    })
    .then(function(data){
        console.log(data);
        if( data["nanny_name_list"] ){
            const number = data["nanny_name_list"].length;
            for (i=0;i<number;i++){
                container = document.createElement('div');
                container.className = "container";
                orderSubDetailContainer.appendChild(container);
                imgContainer = document.createElement('div');
                imgContainer.className = "img-container";
                container.appendChild(imgContainer);
                img = document.createElement('img');
                img.className = "img";
                img.src = data["shot_list"][i];
                imgContainer.appendChild(img);
                nannyName2 = document.createElement('div');
                nannyName2.className = "nanny-name-2";
                nannyName2.innerHTML = "保姆名稱："+data["nanny_name_list"][i];
                container.appendChild(nannyName2);
                orderPrice = document.createElement('div');
                orderPrice.className = "order-price";
                orderPrice.innerHTML = "訂單價格："+data["price_list"][i]+"元";
                container.appendChild(orderPrice);
                orderStatus = document.createElement('div');
                orderStatus.className = "order-status";
                orderStatus.innerHTML = "訂單狀態："+data["paid_list"][i];
                container.appendChild(orderStatus);
            }
        }
        hr2.style.visibility="visible";
    })

})