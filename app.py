# from PIL import Image
# import pytesseract as ocr 
# import cv2
# import numpy as np

# imgPath = "IMG_3047.jpg"
# img = cv2.imread(imgPath, cv2.IMREAD_COLOR)

# img = cv2.resize(img, (428, 270), interpolation=cv2.INTER_CUBIC)

# image = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
# image.show()

# ========================================== #


import boto3
from flask import *
import mysql.connector
import mysql.connector.pooling

import os
import datetime
import uuid
import jwt
secret_key = "key123"
from dotenv import load_dotenv
load_dotenv()
from flask_socketio import join_room, leave_room, send, SocketIO
from flask_cors import CORS

db_config = {
    "pool_name": os.getenv("DB_POOL_NAME"),
    "pool_size": int(os.getenv("DB_POOL_SIZE")),
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_DATABASE"),
}

connection_pool = mysql.connector.pooling.MySQLConnectionPool(**db_config)


def connect_to_database():
    try:
        connection = connection_pool.get_connection()
        cursor = connection.cursor()
        return connection, cursor
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None, None
    
#  建立member table
# con, cursor = connect_to_database()
# cursor.execute(
#     "CREATE TABLE member(id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(10) NOT NULL, birthday DATE NOT NULL, user_id VARCHAR(20) NOT NULL, email VARCHAR(100) NOT NULL, password VARCHAR(100) NOT NULL, nickname VARCHAR(20) NOT NULL, shot VARCHAR(1000) DEFAULT 'https://d2bbn8sfov3acj.cloudfront.net/user.png' NOT NULL, introduction VARCHAR(1000))")
# con.commit()
# cursor.close()
# con.close()

# 建立 service table
# con, cursor = connect_to_database()
# cursor.execute(
#     "CREATE TABLE service(id INT PRIMARY KEY AUTO_INCREMENT, member_id INT NOT NULL, name VARCHAR(100) NOT NULL, lat DOUBLE NOT NULL, lng DOUBLE NOT NULL, price INT NOT NULL,  FOREIGN KEY (member_id) REFERENCES member(id))")
# con.commit()
# cursor.close()
# con.close()

# 建立 message table
# con, cursor = connect_to_database()
# cursor.execute(
#     "CREATE TABLE message(id INT PRIMARY KEY AUTO_INCREMENT, room_id VARCHAR(100) NOT NULL, sender_id INT NOT NULL, message VARCHAR(1000) NOT NULL)")
# con.commit()
# cursor.close()
# con.close()

# 建立 room table
# con, cursor = connect_to_database()
# cursor.execute(
#     "CREATE TABLE room(id INT PRIMARY KEY AUTO_INCREMENT, member_1_id INT NOT NULL, member_2_id INT NOT NULL, room_id VARCHAR(100) NOT NULL)")
# con.commit()
# cursor.close()
# con.close()

# 建立 booking table
# con, cursor = connect_to_database()
# cursor.execute("CREATE TABLE booking(id INT PRIMARY KEY AUTO_INCREMENT, startDate DATE NOT NULL, endDate DATE NOT NULL, time VARCHAR(10), checked INT NOT NULL DEFAULT 0, paid INT NOT NULL DEFAULT 0, reserver_id INT NOT NULL, nanny_id INT NOT NULL,price INT NOT NULL ,lat DOUBLE NOT NULL, lng DOUBLE NOT NULL)")
# con.commit()
# cursor.close()
# con.close()

# 建立 order table
# con, cursor = connect_to_database()
# cursor.execute("CREATE TABLE `order`(id INT PRIMARY KEY AUTO_INCREMENT, orderDate DATE NOT NULL, orderPrice INT NOT NULL, nanny_id INT NOT NULL, reserver_id INT NOT NULL,address VARCHAR(100),phoneNumber VARCHAR(20), contactName VARCHAR(10))")
# con.commit()
# cursor.close()
# con.close()

# test table
# con, cursor = connect_to_database()
# cursor.execute("DROP TABLE booking")
# con.commit()
# cursor.close()
# con.close()
# cursor.execute("SELECT * FROM booking")
# data = cursor.fetchall()
# print(data)
# cursor.close()
# con.close()

ALLOWED_EXTENSIONS = {'png', 'jpg', 'bmp', 'tiff', 'tif', 'gif', 'jpeg'}
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret'
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route("/")
def home():
    return render_template("home.html")
@app.route("/index")
def index():
    return render_template("index.html")
@app.route("/member")
def member():
    return render_template("member.html")
@app.route("/message")
def message():
    return render_template("message.html")
@app.route("/order")
def order():
    return render_template("order.html")
@app.route("/nanny")
def nanny():
    return render_template("nanny.html")
@app.route("/booking")
def bookingRoute():
    return render_template("booking.html")
@app.route("/reserve")
def reserveRoute():
    return render_template("reserve.html")

@app.route("/api/user", methods=["POST"])
def signup():
    data = request.get_json()
    name = data["name"]
    birthday = data["birthday"]
    user_id = data["user_id"]
    email = data["email"]
    password = data["password"]
    nickname = data["nickname"]
    try:
        if name == "" or birthday=="" or user_id=="" or email == "" or password == "" or nickname == "":
            return jsonify({"error": True, "message": "請輸入完整註冊資訊"}), 400
        else:
            con, cursor = connect_to_database()
            cursor.execute("SELECT email FROM member WHERE email = %s", (email,))
            existing_email = cursor.fetchone()
            cursor.close()
            con.close()
            if (existing_email):
                return jsonify({"error": True, "message": "此信箱已被註冊"}), 400
            
            con, cursor = connect_to_database()
            cursor.execute("SELECT user_id FROM member WHERE user_id = %s", (user_id,))
            existing_user = cursor.fetchone()
            cursor.close()
            con.close()
            if (existing_user):
                return jsonify({"error": True, "message": "此身分證字號已被註冊"}), 400
            con, cursor = connect_to_database()
            cursor.execute(
            "INSERT INTO member(name,birthday,user_id,email,password,nickname) VALUES (%s,%s,%s,%s,%s,%s)", (name,birthday,user_id,email,password,nickname))
            con.commit()
            cursor.close()
            con.close()
            return jsonify({"ok": True, "message": "註冊成功"}), 200
    except:
        return jsonify({"error": True, "message": "內部伺服器錯誤"}), 500
    
@app.route("/api/user/auth", methods=["PUT"])
def signin():
    data = request.get_json()
    email = data["email"]
    password = data["password"]
    try:
        if email == "" or password == "":
            return jsonify({"error": True, "message": "請完整輸入帳號及密碼資訊"}), 400
        con, cursor = connect_to_database()
        cursor.execute(
            "SELECT id,name,email,nickname FROM member WHERE (email,password) = (%s,%s)", (email, password))
        existing_user = cursor.fetchone()
        cursor.close()
        con.close()
        if existing_user:
            payload = {
                'id': existing_user[0],
                'name': existing_user[1],
                'email': existing_user[2],
                'nickname': existing_user[3],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=168)
            }
            token = jwt.encode(payload, secret_key, algorithm='HS256')
            
            return jsonify({'token': token}), 200

        else:
            return jsonify({"error": True, "message": "帳號或密碼輸入錯誤"}), 400
    except:
        return jsonify({"error": True, "message": "內部伺服器錯誤"}), 500

@app.route("/api/user/auth", methods=["GET"])
def memberCheck():
    try:
        authorization_header = request.headers.get('Authorization')
        bearer_token = authorization_header.split(' ')[1]
        decoded_token = jwt.decode(
            bearer_token, secret_key, algorithms=['HS256'])
        id = decoded_token['id']
        name = decoded_token['name']
        email = decoded_token['email']
        nickname = decoded_token['nickname']
        data = {
            "data":{
                "id": id,
                "name": name,
                "email": email,
                "nickname":nickname
            }     
        }
        return jsonify(data), 200
    except:
        data = {
            "data": None
        }
        return jsonify(data), 401
    
@app.route("/api/service", methods=["POST"])
def addService():
    try:
        data = request.get_json()
        id = data["id"]
        name = data["name"]
        lat = data["lat"]
        lng = data["lng"]
        price = data["price"]
        con, cursor = connect_to_database()
        cursor.execute(
            "SELECT id FROM service WHERE member_id = %s", (id,))
        information = cursor.fetchall()
        cursor.close()
        con.close()
        if (len(information)>5):
            return jsonify({"error": True, "message": "資料筆數超過限制"}), 400
        if data:
            con, cursor = connect_to_database()
            cursor.execute(
            "INSERT INTO service(member_id,name,lat,lng,price) VALUES (%s,%s,%s,%s,%s)", (id,name,lat,lng,price))
            con.commit()
            cursor.close()
            con.close()
        return jsonify({"ok": True, "message": "加入資料"}), 200
    except:
        return jsonify({"error": True, "message": "內部伺服器錯誤"}), 500

@app.route("/api/service", methods=["GET"])
def getService():
    try:
        member_id = request.headers.get('id')
        con, cursor = connect_to_database()
        cursor.execute("SELECT * FROM service WHERE member_id = %s",(member_id,))
        information = cursor.fetchall()
        cursor.close()
        con.close()
        id_list=[]
        address_list=[]
        lat_list=[]
        lng_list=[]
        price_list=[]
        if information:
            for i in range(0,len(information)):
                id_list.append(information[i][0])
                address_list.append(information[i][2]) 
                lat_list.append(information[i][3])
                lng_list.append(information[i][4])
                price_list.append(information[i][5])
            data = {
                "id":id_list,
                "address":address_list,
                "lat":lat_list,
                "lng":lng_list,
                "price":price_list
            }
        return jsonify(data), 200
    except:
        return jsonify({"error": True, "message": "內部伺服器錯誤"}), 500

@app.route("/api/service", methods=["DELETE"])
def delService():
    try:
        location_id = request.args.get('id')
        con, cursor = connect_to_database()
        cursor.execute("DELETE FROM service WHERE id = %s",(location_id,))
        con.commit()
        cursor.close()
        con.close()
        return jsonify({"ok": True}), 200
    except:
        return jsonify({"error": True, "message": "內部伺服器錯誤"}), 500

@app.route("/api/position",methods=["GET"])
def getPosition():
    try:
        lat = request.headers.get('lat')
        lng = request.headers.get('lng')
        if lat:
            con, cursor = connect_to_database()
            cursor.execute("SELECT id,member_id,lat,lng,price FROM service WHERE lat = %s and lng = %s",(lat,lng))
            information = cursor.fetchall()
            cursor.close()
            con.close()
        else:
            con, cursor = connect_to_database()
            cursor.execute("SELECT id,member_id,lat,lng,price FROM service")
            information = cursor.fetchall()
            cursor.close()
            con.close()
        lat_list=[]
        lng_list=[]
        nickname_list=[]
        id_list =[]
        member_id_list=[]
        price_list=[]
        for i in range(0,len(information)):
            member_id = information[i][1]
            member_id_list.append(member_id)
            con, cursor = connect_to_database()
            cursor.execute("SELECT nickname FROM member WHERE id = %s",(member_id,))
            member_data = cursor.fetchone()
            cursor.close()
            con.close()
            nickname_list.append(member_data[0])
            id_list.append(information[i][0])
            lat_list.append(information[i][2])
            lng_list.append(information[i][3])
            price_list.append(information[i][4])
            data = {
                "id":id_list,
                "member_id":member_id_list,
                "nickname":nickname_list,
                "lat":lat_list,
                "lng":lng_list,
                "price":price_list
            }
        return jsonify(data), 200
    except:
        return jsonify({"error": True, "message": "內部伺服器錯誤"}), 500

@app.route("/api/positionFilter", methods=["GET"])
def positionFilter():
    try:
        price = request.headers.get('price')
        con, cursor = connect_to_database()
        cursor.execute("SELECT id,lat,lng FROM service WHERE price <= %s",(price,))
        filter_list = cursor.fetchall()
        cursor.close()
        con.close()
        data = {
            "list":filter_list
        }
        return (data) ,200
    except:
        return jsonify({"error": True, "message": "內部伺服器錯誤"}), 500

@app.route("/api/room", methods=["POST","GET"])
def room():
    if request.method == "POST":
        data = request.get_json()
        member_1_id = data["member_1_id"]
        member_2_id = data["member_2_id"]
        room_id = data["room_id"]
        con, cursor = connect_to_database()
        cursor.execute("SELECT room_id FROM room WHERE room_id = %s", (room_id,))
        existing_room = cursor.fetchone()
        cursor.close()
        con.close()
        if existing_room:
            return jsonify({"error": True, "message": "房間已存在"}), 400
        else:
            con, cursor = connect_to_database()
            cursor.execute(
                "INSERT INTO room(member_1_id,member_2_id,room_id) VALUES (%s,%s,%s)", (member_1_id,member_2_id,room_id))
            con.commit()
            cursor.close()
            con.close()
            return jsonify({"ok": True}), 200
    else:
        member_id = request.headers.get('id')
        con, cursor = connect_to_database()
        cursor.execute("SELECT * FROM room  WHERE member_1_id=%s OR member_2_id = %s", (member_id, member_id))
        existing = cursor.fetchall()
        cursor.close()
        con.close()
        member_1_id=[]
        member_2_id=[]
        room_id_list=[]
        for i in range(0,len(existing)):
            member_1_id.append(existing[i][1])
            member_2_id.append(existing[i][2])
            room_id_list.append(existing[i][3])
        data = {
            'member_1_id':member_1_id,
            'member_2_id':member_2_id,
            'room_id':room_id_list
        }
        return jsonify(data), 200
@app.route("/api/picture", methods=["POST","GET"])
def picture():
    if request.method == "POST":
        bucket_name = "testboard.meow-meow-nanny.website"
        s3 = boto3.resource("s3")
        uuid_number = uuid.uuid4().hex
        current_time = str(datetime.datetime.now())
        uploaded_file = request.files.get('file')
        id = request.form.get('id')
        subfilename = uploaded_file.filename.rsplit('.', 1)[1].lower()
        new_filename = current_time + uuid_number + '.' + subfilename
        s3.Bucket(bucket_name).upload_fileobj(uploaded_file, new_filename)
        src = f'https://d2bbn8sfov3acj.cloudfront.net/{new_filename}'
        data = {
            'src':src
        }
        con, cursor = connect_to_database()
        cursor.execute("UPDATE member SET shot=%s WHERE id = %s",(src, id))
        con.commit()
        cursor.close()
        con.close()
        return jsonify(data), 200
@app.route("/api/memberData", methods=["POST","GET"])
def memberData():
    try:
        if request.method == "POST":
            data = request.get_json()
            id = data["id"]
            nickname = data["nickname"]
            email = data["email"]
            introduction = data["introduction"]
            if nickname != "":
                con, cursor = connect_to_database()
                cursor.execute("UPDATE member SET nickname=%s WHERE id = %s",(nickname, id))
                con.commit()
                cursor.close()
                con.close()
                return jsonify({"ok": True, "message": "修改暱稱成功"}), 200
            elif email != "":
                con, cursor = connect_to_database()
                cursor.execute("UPDATE member SET email=%s WHERE id = %s",(email, id))
                con.commit()
                cursor.close()
                con.close()
                return jsonify({"ok": True, "message": "修改信箱成功"}), 200
            elif introduction != "":
                con, cursor = connect_to_database()
                cursor.execute("UPDATE member SET introduction=%s WHERE id = %s",(introduction, id))
                con.commit()
                cursor.close()
                con.close()
                return jsonify({"ok": True, "message": "修改關於我成功"}), 200

        else:
            contact_id = request.headers.get('id')
            con, cursor = connect_to_database()
            cursor.execute("SELECT id, nickname, shot, introduction,email FROM member WHERE id = %s",(contact_id,))
            existing_contact = cursor.fetchone()
            cursor.close()
            con.close()
            data = {
                "id":existing_contact[0],
                "nickname":existing_contact[1],
                "shot":existing_contact[2],
                "introduction":existing_contact[3],
                "email":existing_contact[4]
            }
        return jsonify(data), 200
    except:
        return jsonify({"error": True, "message": "內部伺服器錯誤"}), 500

@socketio.on('join_chatroom')
def join_chatroom(data):
    try:
        room_id = data["room_id"]
        numbers = room_id.split('-')
        member_1_id = numbers[0]
        member_2_id = numbers[1]
        con, cursor = connect_to_database()
        cursor.execute("SELECT room_id FROM room WHERE member_1_id=%s AND member_2_id = %s", (member_1_id, member_2_id))
        existing_rooms = cursor.fetchone()
        cursor.close()
        con.close()
        join_room(existing_rooms[0])
        socketio.emit("roomID", {'roomID': existing_rooms[0]})
    except:
        print("cursor: None")


@socketio.on('message')
def handle_message(data):
    received_message = data.get('data')
    received_id = data.get('id')
    roomId = data.get('roomId')
    print(str(received_id) + ' received message: ' + received_message)
    print("roomId:"+roomId)
    con, cursor = connect_to_database()
    cursor.execute("INSERT INTO message(room_id,sender_id,message) VALUES (%s,%s,%s)", (roomId,received_id,received_message))
    con.commit()
    cursor.close()
    con.close()
    socketio.emit('message', {'data': received_message,'id':received_id},to=roomId)

@app.route("/api/chatMessage", methods=["GET"])
def chatMessage():
    roomId = request.headers.get('roomId')
    print("chatMessage:"+roomId)
    try:
        con, cursor = connect_to_database()
        cursor.execute("SELECT sender_id,message FROM message WHERE room_id = %s", (roomId,))
        existing_message = cursor.fetchall()
        cursor.close()
        con.close()
        sender_id_list=[]
        message_list=[]
        for i in range(0,len(existing_message)):
            sender_id_list.append(existing_message[i][0])
            message_list.append(existing_message[i][1])
        data = {
            "sender_id":sender_id_list,
            "message":message_list
        }
        return (data) ,200
    except:
        return jsonify({"error": True, "message": "內部伺服器錯誤"}), 500
@app.route("/api/reserve", methods=["GET"])
def reserve():
    try:
        id = request.headers.get('id')
        price = request.headers.get('price')
        lat = request.headers.get('lat')
        lng = request.headers.get('lng')
        con, cursor = connect_to_database()
        cursor.execute("SELECT nickname,shot,introduction FROM member WHERE id = %s", (id,))
        existing = cursor.fetchone()
        cursor.close()
        con.close()
        nickname = existing[0]
        shot = existing[1]
        introduction = existing[2]
        data = {
            'id':id,
            'price':price,
            'nickname':nickname,
            'shot':shot,
            'introduction':introduction,
            'lat':lat,
            'lng':lng
        }
        return jsonify(data), 200
    except:
        return jsonify({"error": True, "message": "內部伺服器錯誤"}), 500

@app.route("/api/booking", methods=["POST","GET","DELETE"])
def booking():
    if request.method == "POST":
        data = request.get_json()
        memberID = data["memberID"]
        nannyID = data["nannyID"]
        dateStart = data["dateStart"]
        dateEnd = data["dateEnd"]
        time = data["time"]
        price = data["price"]
        lat = data["lat"]
        lng = data["lng"]
        con, cursor = connect_to_database()
        cursor.execute("SELECT reserver_id FROM booking WHERE reserver_id = %s and (checked = %s or paid = %s)", (memberID,0,0))
        existing = cursor.fetchone()
        cursor.close()
        con.close()
        if existing:
            return jsonify({"ok": False, "message": "預約已存在"}), 400
        con, cursor = connect_to_database()
        cursor.execute("INSERT INTO booking(startDate,endDate,time,reserver_id,nanny_id,price,lat,lng) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)", (dateStart,dateEnd,time,memberID,nannyID,price,lat,lng))
        con.commit()
        cursor.close()
        con.close()
        return jsonify({"ok": True, "message": "預約成功"}), 200
    elif request.method == "GET":
        member_id = request.headers.get('id')
        con, cursor = connect_to_database()
        cursor.execute("SELECT nanny_id,checked,paid FROM booking WHERE reserver_id = %s and checked = %s", (member_id,0))
        reserverData = cursor.fetchone()
        cursor.execute("SELECT startDate,endDate,time,reserver_id FROM booking WHERE nanny_id = %s and checked = %s", (member_id,0))
        nannyData = cursor.fetchall()
        cursor.close()
        con.close()
        startDate_list=[]
        endDate_list=[]
        time_list=[]
        reserver_id_list=[]
        for i in range(0,len(nannyData)):
            startDate_list.append(nannyData[i][0])
            endDate_list.append(nannyData[i][1])
            time_list.append(nannyData[i][2])
            reserver_id_list.append(nannyData[i][3])
        data = {}
        if reserverData and nannyData:
            data = {
                "nannyID":reserverData[0],
                "checked":reserverData[1],
                "paid":reserverData[2],
                "startDate_list":startDate_list,
                "endDate_list":endDate_list,
                "time_list":time_list,
                "reserver_id_list":reserver_id_list
            }
        elif reserverData:
            data = {
                "nannyID":reserverData[0],
                "checked":reserverData[1],
                "paid":reserverData[2]
            }
        elif nannyData:
            data = {
                "startDate_list":startDate_list,
                "endDate_list":endDate_list,
                "time_list":time_list,
                "reserver_id_list":reserver_id_list
            }
        return jsonify(data), 200
    else:
        member_id = request.args.get('id')
        con, cursor = connect_to_database()
        cursor.execute("DELETE FROM booking WHERE reserver_id = %s", (member_id,))
        con.commit()
        cursor.close()
        con.close()
        return jsonify({"ok": True, "message": "刪除成功"}), 200
@app.route("/api/checked", methods=["POST","GET"])
def checked():
    if request.method == "POST":
        data = request.get_json()
        member_id = data["id"]
        con, cursor = connect_to_database()
        cursor.execute("UPDATE booking SET checked=%s WHERE reserver_id = %s", (1,member_id,))
        con.commit()
        cursor.close()
        con.close()
        return jsonify({"ok": True, "message": "確認成功"}), 200
    else:
        member_id = request.headers.get('id')
        con, cursor = connect_to_database()
        cursor.execute("SELECT nanny_id,startDate,endDate,time,price FROM booking WHERE reserver_id = %s and checked=%s and paid=%s", (member_id,1,0))
        reserverData = cursor.fetchone()
        cursor.close()
        con.close()
        con, cursor = connect_to_database()
        cursor.execute("SELECT nickname FROM member WHERE id = %s", (member_id,))
        memberData = cursor.fetchone()
        cursor.close()
        con.close()
        data={"nanny_nickname":"",
                "nickname":"",
                "nanny_id":"",
                "startDate":"",
                "endDate":"",
                "time":"",
                "price":""}
        if (reserverData):
            nanny_id = reserverData[0]
            con, cursor = connect_to_database()
            cursor.execute("SELECT nickname FROM member WHERE id = %s", (nanny_id,))
            nannyData = cursor.fetchone()
            con.commit()
            cursor.close()
            con.close()
            data = {
                "nanny_nickname":nannyData[0],
                "nickname":memberData[0],
                "nanny_id":reserverData[0],
                "startDate":reserverData[1],
                "endDate":reserverData[2],
                "time":reserverData[3],
                "price":reserverData[4]
            }
        return jsonify(data), 200
@app.route("/api/order", methods=["POST","GET"])
def orderCheck():
    if request.method == "POST":
        data = request.get_json()
        member_id = data["member_id"]
        orderDate = data["orderDate"]
        orderPrice = data["orderPrice"]
        name_input = data["name_input"]
        phone_input = data["phone_input"]
        address_input = data["address_input"]
        con, cursor = connect_to_database()
        cursor.execute("SELECT nickname FROM member WHERE id = %s", (member_id,))
        memberData = cursor.fetchone()
        reserverName = memberData[0]
        cursor.close()
        con.close()
        con, cursor = connect_to_database()
        cursor.execute("SELECT nanny_id FROM booking WHERE reserver_id = %s and checked=%s and paid=%s", (member_id,1,0))
        nannyData = cursor.fetchone()
        cursor.close()
        con.close()
        nannyId = nannyData[0]
        con, cursor = connect_to_database()
        cursor.execute("SELECT nickname FROM member WHERE id = %s", (nannyId,))
        nannyData = cursor.fetchone()
        cursor.close()
        con.close()
        nannyName = nannyData[0]
        con, cursor = connect_to_database()
        cursor.execute(
            "INSERT INTO `order`(orderDate,orderPrice,nanny_id,reserver_id,address,phoneNumber,contactName) VALUES (%s,%s,%s,%s,%s,%s,%s)", (orderDate,orderPrice,nannyId,member_id,address_input,phone_input,name_input))
        con.commit()
        cursor.close()
        con.close()
        con, cursor = connect_to_database()
        cursor.execute("UPDATE booking SET paid=%s WHERE reserver_id = %s", (1,member_id,))
        con.commit()
        cursor.close()
        con.close()
        return jsonify({"ok": True, "message": "付款成功"}), 200
    else:
        member_id = request.headers.get('id')
        con, cursor = connect_to_database()
        cursor.execute("SELECT nanny_id, price, paid, startDate, endDate FROM booking WHERE reserver_id = %s and checked =%s", (member_id,1))
        bookingData = cursor.fetchall()
        cursor.close()
        con.close()
        nanny_name_list=[]
        price_list=[]
        shot_list=[]
        paid_list = []
        for i in range(0,len(bookingData)):
            con, cursor = connect_to_database()
            cursor.execute("SELECT nickname, shot FROM member WHERE id = %s", (bookingData[i][0],))
            data = cursor.fetchone()
            cursor.close()
            con.close()
            nanny_name_list.append(data[0])
            shot_list.append(data[1])
            if (bookingData[i][2]==0):
                paid_list.append("未付款")
            else:
                paid_list.append("已付款")
            day = (bookingData[i][4] - bookingData[i][3]).days
            price = day*bookingData[i][1]
            price_list.append(price)
        data = {
            "nanny_name_list":nanny_name_list,
            "price_list":price_list,
            "shot_list":shot_list,
            "paid_list":paid_list
        }
        return jsonify(data), 200

if __name__ == '__main__':
    CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
    socketio.run(app,host="0.0.0.0",port=3000,debug=True)

