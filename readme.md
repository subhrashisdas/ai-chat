# AI Chat

This document provides information about a simple AI chat application with
authentication. All APIs are secured with JWT, and AI-generated messages are
included. The application is automatically synchronized by polling.

The commit history is somewhat disorganized due to rapid deployment and
subsequent amendments. Additionally, I prefer using SmartGit and like to
maintain a single commit for each specific purpose.

## Assumptions

- There is no database; everything is stored in memory. _On Vercel, messages may
  be lost._
- There is only one user, though multiple users can be added in the code.
- Random AI messages are generated.

## Deployment Instructions

| Components                                             |
| ------------------------------------------------------ |
| [Frontend](https://sd-ai-chat-frontend.vercel.app)     |
| [Backend](https://sd-ai-chat-backend.vercel.app)       |
| [ReDoc](https://sd-ai-chat-backend.vercel.app/redoc)   |
| [YouTube](https://www.youtube.com/watch?v=exT6NeKD5eU) |

## Local Setup Instructions

1. **Clone the Repository**

   Clone the repository from GitHub:

   ```sh
   git clone git@github.com:subhrashisdas/ai-chat.git
   ```

2. **Set Up the Backend**

   Navigate to the `backend` directory and install the required dependencies:

   ```sh
   cd ai-chat
   cd backend
   pip install -r requirements.txt
   ```

   Run the FastAPI server:

   ```sh
   fastapi dev main.py
   ```

   The backend server will typically run on `http://127.0.0.1:8000`.

3. **Set Up the Frontend**

   Navigate to the `frontend` directory, set the backend base URL environment
   variable, and start the frontend development server:

   ```sh
   cd ai-chat
   cd frontend
   echo NEXT_PUBLIC_BACKEND_BASE_URL=http://127.0.0.1:8000 > .env
   npm install
   npm run dev
   ```

   The frontend server will typically run on `http://localhost:3000`.

## API Endpoints

### Login

**Endpoint:** `POST /api/login`

**Description:** Obtain a JWT token by providing valid credentials.

**Request:**

```sh
curl -X POST "https://sd-ai-chat-backend.vercel.app/api/login" \
-d '{
  "username": "alice.smith@example.com",
  "password": "password"
}'
```

**Response:**

```json
{
  "access_token": "YOUR_ACCESS_TOKEN",
  "token_type": "bearer"
}
```

### Get Messages

**Endpoint:** `GET /api/messages`

**Description:** Retrieve a list of messages. Optionally, you can specify
`current_id` to get messages after a certain ID.

**Without `current_id`:**

```sh
curl -X GET "https://sd-ai-chat-backend.vercel.app/api/messages" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**With `current_id`:**

```sh
curl -X GET "https://sd-ai-chat-backend.vercel.app/api/messages?current_id=1" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**

```json
[
  {
    "id": 0,
    "sender": "User",
    "message": "Hey there! How are you?"
  },
  {
    "id": 1,
    "sender": "AI",
    "message": "Hello Alice! I'm doing well, thank you. How can I assist you today?"
  }
]
```

### Add Message

**Endpoint:** `POST /api/messages`

**Description:** Add a new message. The system will also generate a response
from the AI.

**Request:**

```sh
curl -X POST "https://sd-ai-chat-backend.vercel.app/api/messages" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
-d '{
  "message": "Your message here"
}'
```

**Response:**

```json
{
  "msg": "Message added successfully"
}
```

### Edit Message

**Endpoint:** `PUT /api/messages/{index}`

**Description:** Edit an existing message. Provide the index of the message you
want to edit.

**Request:**

```sh
curl -X PUT "https://sd-ai-chat-backend.vercel.app/api/messages/0" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
-d '{
  "message": "Updated message content"
}'
```

**Response:**

```json
{
  "msg": "Message updated successfully"
}
```

## Test Cases

1. **Go to the Frontend URL**

   Open your browser and navigate to
   [https://sd-ai-chat-frontend.vercel.app](https://sd-ai-chat-frontend.vercel.app).

2. **Login if Not Logged In**

   If you are not logged in, you will be prompted to log in.

3. **Attempt to Login with Incorrect Credentials**

   Enter an incorrect username or password and verify that the application
   displays an error message indicating invalid credentials.

4. **Login with Valid Credentials**

   Enter the following credentials:
   - **Username:** `alice.smith@example.com`
   - **Password:** `password` Verify that you are redirected to the main chat
     interface.

5. **Type a Message**

   In the chat interface, type a message and send it. Verify that the message is
   sent and displayed in the chat history.

6. **Verify AI Reply**

   Ensure that after sending your message, the AI responds with an appropriate
   reply. The AI's response should appear in the chat history.

7. **Check Real-time Synchronization**

   Open the chat interface in a different browser or incognito window. Verify
   that the messages (including AI replies) are synchronized in real-time across
   different sessions.

8. **Open and Close the Chat Box**

   Test opening and closing the chat box. Ensure that the chat box opens and
   closes smoothly and that the chat history is preserved when reopening.

9. **Logout and Clean History**

   To log out, ensure that the application clears any local storage or session
   data. Verify that logging out requires a new login and that the chat history
   is not cleared after logging back in.

10. **API Security**

    Ensure that all API endpoints are secured with JWT tokens and that
    unauthorized requests are rejected.

11. **Edit a Message**

    Navigate to the chat history, select an existing message, and initiate an
    edit. Change the message content and save the changes.

12. **Scroll to Latest Message**

    Ensure that the chat window automatically scrolls to the most recent
    message, making the latest message visible without manual scrolling.

## License

© 2024 Subhrashis Das. All rights reserved.
