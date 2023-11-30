
let map;
let place;
let nickname = document.getElementById("nickname")
let marker;
let user_member_id;
let room_id;
let infoWindow;
let markers = [];
let price_data;
let radius = 1000;
let currentPosition;
let currentCircle;
let priceRange = document.getElementById("priceRange");

window.onload = async function () {
    await checkUserStatusandData();
    search();
    createMarker();
};

function initMap(){
    map = new google.maps.Map(document.getElementById('map'),{
        center:{lat:25.02678505099397,lng:121.544103235364},
        zoom:15
    })
    navigator.geolocation.getCurrentPosition(function(position){
        currentPosition = {
            lat:position.coords.latitude,
            lng:position.coords.longitude
        }
        map.setCenter(currentPosition);
    });
}
function search() {
    const autoComplete = new google.maps.places.Autocomplete(
        document.getElementById('search-input'),
        {
            componentRestrictions: { country: 'tw' }
        }
    );

    autoComplete.addListener('place_changed', function () {
        place = autoComplete.getPlace();
        currentPosition = {
            lat:place.geometry.location.lat(),
            lng:place.geometry.location.lng()
        }
        map.setCenter(place.geometry.location);
        makeCircle();
    });
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
function createMarker(){
    src = "/api/position";
    fetch(src,{method: "GET"})
    .then(function(response) {
        if (response) {
            return response.json();
        }
    })
    .then(function(data) {
        data["nickname"].forEach((point_nickname, index) => {
            marker = new google.maps.Marker({
                map: map,
                position: { lat: data["lat"][index], lng: data["lng"][index] },
                title: point_nickname,
                member_id:data["member_id"][index],
                id:data["id"][index],
                price: data["price"][index]
            });
            markers.push(marker);
        });
            markerClick();
    }) 
    .catch(error => {
        console.log('Network error:', error);
    })
}
let member_1_id;
let member_2_id;
function markerClick(){
    markers.forEach(marker => {
        marker.addListener('click', () => {
            const profile_container = document.getElementById("profile-container");
            profile_container.style.display="none";
            profile_container.innerHTML="";
            profile_container.style.display="block";
            const addName = document.createElement('div');
            addName.innerHTML = marker.title;
            addName.className = "add-name";
            profile_container.appendChild(addName);
            const addPrice = document.createElement('div');
            addPrice.innerHTML = "服務費用 "+marker.price+" 元/次";
            addPrice.className = "add-price";
            profile_container.appendChild(addPrice);
            const order_button = document.createElement('button');
            order_button.innerHTML="預約"
            order_button.className = "order-button";
            profile_container.appendChild(order_button);
            const talk_button = document.createElement('button');
            talk_button.innerHTML="對談"
            talk_button.className = "order-button";
            profile_container.appendChild(talk_button);
            talk_button.addEventListener('click',()=>{
                if (marker.member_id<user_member_id){
                    room_id = marker.member_id + "-" + user_member_id;
                    member_1_id = marker.member_id;
                    member_2_id = user_member_id;
                }
                else if(marker.member_id>user_member_id){
                    room_id = user_member_id + "-" + marker.member_id;
                    member_1_id = user_member_id;
                    member_2_id = marker.member_id;
                }
                else
                    room_id = "";
                data = {
                    'member_1_id':member_1_id,
                    'member_2_id':member_2_id,
                    'room_id':room_id
                };
                src = "/api/room";
                fetch(src,{method: "POST",headers: {'Content-Type': 'application/json'},body: JSON.stringify(data)})
                .then(function(response) {
                    if (response) {
                        return response.json();
                    }
                })
                .then(function(data) {
                    console.log(data);
                    window.location="/message";
                })
                .catch(error => {
                    console.log('Network error:', error);
                });
                
            })

        })
    })
}
 
const title = document.getElementById("title");
title.addEventListener('click',() => {
    window.location="/";
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

document.addEventListener('DOMContentLoaded', function () {
  const priceValue = document.getElementById('priceValue');

  priceValue.textContent = `$${priceRange.value}元`;

  priceRange.addEventListener('input', function () {
    priceValue.textContent = `$${this.value}元`;
    recheckMarker();
  });
});

const distanceButtons = document.querySelectorAll(".distance-button");
distanceButtons.forEach(button => {
    button.addEventListener('click', () => {
        button.style.backgroundColor="#5B5B5B";
        button.style.color="#ffffff";
        distanceButtons.forEach(otherButton => {
            if (otherButton !== button) {
                otherButton.style.backgroundColor = "#ffffff";
                otherButton.style.color = "#000000";
            }
        });
        const buttonId = button.getAttribute('id');
        radius = parseInt(buttonId);
        if (currentCircle) {
            currentCircle.setMap(null);
        }
        makeCircle();
    });
})

function makeCircle(){
    currentCircle = new google.maps.Circle({
        map: map,
        center: { lat: currentPosition["lat"], lng: currentPosition["lng"] },
            radius: radius,
            fillColor: "#007bff",
            fillOpacity: 0.3,
            strokeColor: "#007bff",
            strokeOpacity: 0.8, 
            strokeWeight: 2,
    });
    recheckMarker();
};

function recheckMarker(){
    src = `/api/positionFilter?price=${priceRange.value}`;
    fetch(src,{method: "GET"})
    .then(function(response) {
        if (response) {
            return response.json();
        }
    })
    .then(function(data) {
        const list = data["list"]
        if (list){
            list.forEach((point) => {
            const Point = new google.maps.LatLng(point[1], point[2]);
            let distance = google.maps.geometry.spherical.computeDistanceBetween(Point, currentPosition);
            markers.forEach(function(marker) {
                marker.setMap(null);
            });
            if (distance <= radius){
                src = `/api/position?lat=${point[1]}&lng=${point[2]}`;
                fetch(src,{method: "GET"})
                .then(function(response) {
                    if (response) {
                        return response.json();
                    }
                })
                .then(function(pointdata) {
                    pointdata["nickname"].forEach((point_nickname, index) => {
                        marker = new google.maps.Marker({
                            map: map,
                            position: { lat: pointdata["lat"][index], lng: pointdata["lng"][index] },
                            title: point_nickname,
                            id:pointdata["id"][index],
                            price: pointdata["price"][index]
                        });
                        markers.push(marker);
                    });
                        markerClick();
                }) 
                .catch(error => {
                    console.log('Network error:', error);
                })
            }
            })
        }
    }) 
    .catch(error => {
        console.log('Network error:', error);
    })
};