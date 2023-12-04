let get_location_button = document.getElementById("get-location-button")
let location_container = document.getElementById("location-container")
let user_member_id
let profile_search_input = document.getElementById('profile-search-input')
let price_buttons = document.querySelectorAll(".price-button")
let price = 200;

window.onload = async function () {
    await checkUserStatusandData();
    profileSearch();
    showLocation();
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


function profileSearch() {
     const autoComplete = new google.maps.places.Autocomplete(
        profile_search_input,
        {
            componentRestrictions: { country: 'tw' }
        }
    );
    autoComplete.addListener('place_changed', function () {
        place = autoComplete.getPlace();
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const name = place.formatted_address;
        data = {
            "id":user_member_id,
            "name":name,
            "lat":lat,
            "lng":lng,
            "price":price
        }
        src = "/api/service";
        fetch(src,{method: "POST",headers: {'Content-Type': 'application/json'},body: JSON.stringify(data)})
        .then(function(response) {
            if (response) {
                return response.json();
            }
        })
        .then(function(data) {
            profile_search_input.value="";
            showLocation();
        })
        .catch(error => {
            console.log('Network error:', error);
        });

    });
}


get_location_button.addEventListener('click',()=>{
    getCurrentLocation();
});

function getCurrentLocation() {
    navigator.geolocation.getCurrentPosition(function(position){
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        data = {
            "id":user_member_id,
            "name":"座標點 ("+lat+","+lng+" )",
            "lat":lat,
            "lng":lng,
            "price":price
        }
        src = "/api/service";
            fetch(src,{method: "POST",headers: {'Content-Type': 'application/json'},body: JSON.stringify(data)})
            .then(function(response) {
                if (response) {
                    return response.json();
                }
            })
            .then(function(data) {
                showLocation();
                console.log(data)
            })
            .catch(error => {
                console.log('Network error:', error);
            });
    });
    
};

function showLocation(){
    src = `/api/service?id=${user_member_id}`;
    fetch(src,{method: "GET"})
    .then(function(response) {
        if (response) {
            return response.json();
        }
    })
    .then(function(data) {
        let i = 0;
        location_container.innerHTML = "";
        if (data['id']){
            data["address"].forEach(item => {
                const addContainer = document.createElement('div');
                addContainer.className = 'added-container';
                addContainer.id = data["id"][i];
                location_container.appendChild(addContainer);
                const addDiv = document.createElement('div');
                addDiv.className = 'added-div';
                addDiv.innerHTML = item;
                addContainer.appendChild(addDiv);
                const addButton = document.createElement('button');
                addButton.id = data["id"][i];
                addButton.style.backgroundImage = `url("static/image/delete.png")`;
                addButton.className = 'added-button';
                addContainer.appendChild(addButton);
                i+=1;
            })
            // 刪除功能
            const buttonsInContainer = document.querySelectorAll('.added-container .added-button');
            buttonsInContainer.forEach(button => {
                button.addEventListener('click',(event)=>{
                    const clickedButtonId = event.target.id;
                    daleteLocation(clickedButtonId);
                })
            });
        }
    })
    .catch(error => {
        console.log('Network error:', error);
    });
}

function daleteLocation(buttonId) {
    src = `/api/service?id=${buttonId}`;
    fetch(src,{method: "DELETE"})
        .then(function(response) {
            if (response) {
                return response.json();
            }
        })
        .then(function(data) {
            showLocation();
        })
        .catch(error => {
            console.log('Network error:', error);
        });
};

price_buttons.forEach(button => {
    button.addEventListener('click', () => {
        button.style.backgroundColor="#5B5B5B";
        button.style.color="#ffffff";
        price = parseInt(button.id);
        // 其他按鈕恢復正常
        price_buttons.forEach(otherButton => {
                if (otherButton !== button) {
                    otherButton.style.backgroundColor = "#ffffff";
                    otherButton.style.color = "#000000";
                }
            });
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