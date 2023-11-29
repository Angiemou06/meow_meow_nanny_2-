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
import jwt
secret_key = "key123"
from dotenv import load_dotenv
load_dotenv()
from flask_socketio import join_room, leave_room, send, SocketIO

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

# test table
# con, cursor = connect_to_database()
# cursor.execute("DROP TABLE room")
# con.commit()
# cursor.close()
# con.close()
# cursor.execute("SELECT * FROM member")
# data = cursor.fetchall()
# print(data)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'bmp', 'tiff', 'tif', 'gif', 'jpeg'}
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret'
socketio = SocketIO(app)


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
        member_id = request.args.get('id')
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
        lat = request.args.get('lat')
        lng = request.args.get('lng')
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
            member_nickname = cursor.fetchone()
            cursor.close()
            con.close()
            nickname_list.append(member_nickname[0])
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
        price = request.args.get('price')
        con, cursor = connect_to_database()
        cursor.execute("SELECT id,lat,lng FROM service  WHERE price <= %s",(price,))
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
        member_id = request.args.get('id')
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
@app.route("/api/memberData", methods=["POST","GET"])
def memberData():
    try:
        # if request.method == "POST":
        #     bucket_name = "testboard.meow-meow-nanny.website"
        #     s3 = boto3.resource("s3")
        #     current_time = str(datetime.datetime.now())
        #     uploaded_file = request.files["file-to-upload"] # 根據命名修改
        #     if not allowed_file(uploaded_file.filename):
        #         return "File not allowed!"

        #     new_filename = current_time + '.' + uploaded_file.filename.rsplit('.', 1)[1].lower()

        #     s3.Bucket(bucket_name).upload_fileobj(uploaded_file, new_filename)
        #     id = request.args.get('id')
        #     data = {
                
        #     }
        #     bucket = s3.Bucket(bucket_name)
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
            contact_id = request.args.get('id')
            con, cursor = connect_to_database()
            cursor.execute("SELECT nickname, shot, introduction,email FROM member WHERE id = %s",(contact_id,))
            existing_contact = cursor.fetchone()
            cursor.close()
            con.close()
            data = {
                "nickname":existing_contact[0],
                "shot":existing_contact[1],
                "introduction":existing_contact[2],
                "email":existing_contact[3]
            }
        return jsonify(data), 200
    except:
        return jsonify({"error": True, "message": "內部伺服器錯誤"}), 500

# @socketio.on("connect")
# def connect(auth):
    # print(auth)
    # user_id = auth
    # print(user_id)
    # con, cursor = connect_to_database()
    # cursor.execute("SELECT room_id FROM room WHERE user_id=%s OR contact_id = %s", (user_id, user_id))
    # existing_rooms = cursor.fetchall()
    # print(existing_rooms)
    # cursor.close()
    # con.close()
    # for i in range(0,len(existing_rooms)):
    #     room = existing_rooms[i][0]
    #     join_room(room)

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
    roomId = request.args.get('roomId')
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
    
if __name__ == '__main__':
    socketio.run(app,host="0.0.0.0",port=3000,debug=False)

