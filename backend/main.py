from typing import List, Optional
from datetime import datetime, timedelta, timezone
import random
import jwt

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from passlib.context import CryptContext

app = FastAPI()

SECRET_KEY = "secret"
ALGORITHM = "HS256"

fake_users_db = {
    "alice.smith@example.com": {
        "username": "alice.smith@example.com",
        "hashed_password": "$2y$12$7DPLjYHgFB.InosCWGYdVulohq5Rky.jTAqNxJb/f3zPCTG/tSe6S",
        "messages": [
            {"sender": "User", "message": "Hey there! How are you?", "id": 0},
            {"sender": "AI", "message": "Hello Alice! I'm doing well, thank you. How can I assist you today?", "id": 1},
        ]
    }
}

pwd_context = CryptContext(
    schemes=["bcrypt"],
    bcrypt__default_rounds=12,
    deprecated="auto"
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class LoginRequest(BaseModel):
    username: str
    password: str

class MessageFromUser(BaseModel):
    message: str

class Message(MessageFromUser):
    id: int
    sender: str

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_user(db, username: str):
    return db.get(username)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_ai_message():
    ai_messages = [
        "Hello! How can I assist you today?",
        "I'm here to help. What do you need?",
        "How can I make your day better?",
        "Do you have any questions for me?",
        "I'm ready to assist with anything you need.",
        "Feel free to ask me anything.",
        "What can I do for you right now?",
        "Let me know if there's anything specific you need help with.",
        "I'm here to provide information or help with tasks.",
        "How can I support you today?"
    ]
    message = random.choice(ai_messages)
    return {"message": message, "sender": "AI"}

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = {"username": username}
    except jwt.PyJWTError:
        raise credentials_exception
    user = get_user(fake_users_db, username=token_data["username"])
    if user is None:
        raise credentials_exception
    return user

@app.post("/api/login")
def login(request: LoginRequest):
    user = get_user(fake_users_db, request.username)
    if not user or not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/messages", response_model=List[Message])
def get_messages(current_user: dict = Depends(get_current_user), current_id: Optional[int] = None):
    messages = current_user["messages"]

    if current_id is not None:
        if current_id < 0 or current_id >= len(messages):
            raise HTTPException(status_code=404, detail="Messages not found")

        messages = messages[current_id + 1:]

    return messages

@app.post("/api/messages")
def add_message(message: MessageFromUser, current_user: dict = Depends(get_current_user)):
    message_with_sender = message.dict()
    message_with_sender["sender"] = "User"
    message_with_sender["id"] = len(current_user["messages"])
    current_user["messages"].append(message_with_sender)
    ai_message = get_ai_message()
    ai_message["id"] = message_with_sender["id"] + 1
    current_user["messages"].append(ai_message)
    return {"msg": "Message added successfully"}

@app.put("/api/messages/{index}")
def edit_message(index: int, message: MessageFromUser, current_user: dict = Depends(get_current_user)):
    user = get_user(fake_users_db, current_user["username"])
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if index < 0 or index >= len(user["messages"]):
        raise HTTPException(status_code=404, detail="Message not found")

    if user["messages"][index]["sender"] == "AI":
        raise HTTPException(status_code=403, detail="Cannot edit messages sent by AI")

    user["messages"][index]["message"] = message.message

    return {"msg": "Message updated successfully"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
