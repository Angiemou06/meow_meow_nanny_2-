let signup_name = document.getElementById("signup-name");
let signup_birthday = document.getElementById("signup-birthday");
let signup_user_id = document.getElementById("signup-user-id");
let signup_email = document.getElementById("signup-email");
let signup_password = document.getElementById("signup-password");
let signup_nickname = document.getElementById("signup-nickname");
let signup_button = document.getElementById("sign-up-button")
let signin_email = document.getElementById("signin-email")
let signin_password = document.getElementById("signin-password")


signup_button.addEventListener('click',()=>{
    fetchSignUp();
});

function fetchSignUp(){
    
    let data={
        "name": signup_name.value,
        "birthday":signup_birthday.value,
        "user_id":signup_user_id.value,
        "email": signup_email.value,
        "password": signup_password.value,
        "nickname":signup_nickname.value
    }
    fetch('/api/user',{method: "POST",headers: {'Content-Type': 'application/json'},body: JSON.stringify(data)})
    .then(function (response) {

        return response.json();
    })
    .then(function (data){
        if (data["ok"]){
            alert("註冊成功，請登入！");
            signup_name.value="";
            signup_birthday.value="";
            signup_user_id.value="";
            signup_email.value="";
            signup_password.value="";
            signup_nickname.value="";
        }
        if(data["error"]){
            alert(data["message"]);
        }
    })
}

let signin_button = document.getElementById("sign-in-button")
signin_button.addEventListener('click',()=>{
    fetchSignIn();
})
function fetchSignIn(){
    let data={
        "email": signin_email.value,
        "password": signin_password.value
    }
    src="/api/user/auth";
    fetch(src,{method: "PUT",headers: {'Content-Type': 'application/json'},body: JSON.stringify(data)})
    .then(function (response){
        return response.json();
    })
    .then(function (data){
        if (data["token"]){
            window.location="/index";
            localStorage.setItem('Token', data["token"]);
        }
    })
}
