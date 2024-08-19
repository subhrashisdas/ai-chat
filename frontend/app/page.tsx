"use client";

import React, { FormEvent, useEffect, useRef, useState } from "react";
import { AiIcon, AiIconSecondary, UserIcon } from "./svg";
import { fetchAuthenticated, getAccessToken } from "./fetch";
import { useRouter } from "next/navigation";

interface Message {
  id: number;
  sender: "AI" | "User";
  message: string;
}

interface MessageBubbleProps {
  id: number;
  sender: "AI" | "User";
  message: string;
  isEditing: boolean;
  onEditRequest: (id: number) => void;
  onBlur: () => void;
  onSave: (id: number, message: string) => void;
}

function MessageBubble({
  id,
  sender,
  message,
  isEditing,
  onEditRequest,
  onBlur,
  onSave,
}: MessageBubbleProps) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);
  }, [message]);

  async function handleBlur() {
    onBlur();
    onSave(id, currentMessage);
  }

  async function handleSave() {
    onSave(id, currentMessage);
    onBlur();
  }

  return (
    <div className="flex gap-3 my-4 text-gray-600 text-sm">
      <span className="relative flex shrink-0 overflow-hidden rounded-full w-8 h-8">
        <div className="border border-gray-300 bg-gray-100 p-1 rounded-full">
          {sender === "AI" ? <AiIconSecondary /> : <UserIcon />}
        </div>
      </span>
      <p className="leading-relaxed">
        <span className="block font-bold text-gray-700">{sender}</span>
        {isEditing
          ? (
            <div className="flex items-center">
              <input
                autoFocus
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
                value={currentMessage}
                onChange={function handleInputChange(e) {
                  setCurrentMessage(e.target.value);
                }}
                onBlur={handleBlur}
              />
              <button
                onClick={handleSave}
                className="ml-2 rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save
              </button>
            </div>
          )
          : (
            <span
              onClick={function handleClick() {
                sender === "User" && onEditRequest(id);
              }}
              className="cursor-pointer"
            >
              {currentMessage}
            </span>
          )}
      </p>
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkAccessTokenAndFetchMessages() {
      if (!getAccessToken()) {
        router.push("/login");
        return;
      }

      async function fetchMessages() {
        const data = await fetchAuthenticated({
          url: "api/messages",
          method: "GET",
        });
        setMessages(data);
      }

      await fetchMessages();
      const intervalId = setInterval(fetchMessages, 500);
      return () => clearInterval(intervalId);
    }

    checkAccessTokenAndFetchMessages();
  }, [router]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (inputValue.trim()) {
      await fetchAuthenticated({
        url: "api/messages",
        method: "POST",
        body: { message: inputValue },
      });
      setInputValue("");
    }
  }

  async function handleMessageUpdate(id: number, newMessage: string) {
    if (id !== null && newMessage.trim()) {
      try {
        await fetchAuthenticated({
          url: `api/messages/${id}`,
          method: "PUT",
          body: {
            message: newMessage,
          },
        });
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === id ? { ...msg, message: newMessage } : msg
          )
        );
      } catch (error) {
        console.error("Failed to update message:", error);
      }
    }
  }

  function requestMessageEdit(id: number) {
    setEditingMessageId(id);
  }

  function handleCloseEdit() {
    setEditingMessageId(null);
  }

  return (
    <>
      <button
        className="fixed bottom-4 right-4 flex h-16 w-16 items-center justify-center rounded-full border border-gray-300 bg-black p-0 text-sm font-medium hover:bg-gray-600 cursor-pointer"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isChatOpen}
        onClick={function toggleChat() {
          setIsChatOpen(!isChatOpen);
        }}
      >
        <AiIcon />
      </button>
      {isChatOpen && (
        <div className="fixed bottom-[calc(4rem+1.5rem)] right-4 h-[634px] w-[440px] rounded-lg border border-gray-300 bg-white p-6 shadow-md">
          <div className="flex flex-col space-y-1.5 pb-6">
            <h2 className="text-lg font-semibold tracking-tight">Chatbot</h2>
            <p className="text-sm text-gray-500 leading-3">
              Please connect with the AI chatbot.
            </p>
          </div>
          <div className="h-[474px] overflow-auto pr-4">
            <div>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  id={msg.id}
                  sender={msg.sender}
                  message={msg.message}
                  isEditing={msg.id === editingMessageId}
                  onEditRequest={requestMessageEdit}
                  onBlur={handleCloseEdit}
                  onSave={handleMessageUpdate}
                />
              ))}
              <div ref={messagesEndRef} />{" "}
              {/* This is the anchor for scrolling */}
            </div>
          </div>
          <div className="flex items-center pt-4">
            <form
              className="flex w-full items-center space-x-2"
              onSubmit={handleSubmit}
            >
              <input
                className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="Type your message"
                value={inputValue}
                onChange={function handleInputChange(e) {
                  setInputValue(e.target.value);
                }}
              />
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
