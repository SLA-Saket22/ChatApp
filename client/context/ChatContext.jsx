import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessage, setUnseenMessage] = useState({});

  const { socket, axios } = useContext(AuthContext);

  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/message/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessage(data.unseenMessage);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/message/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(
        `/api/message/send/${selectedUser._id}`,
        messageData,
      );
      if (data.success) {
        // Add with 'sending' status — will be updated via socket
        setMessages((prev) => [
          ...prev,
          { ...data.newMessage, status: "sent" },
        ]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    // New incoming message
    socket.on("newMessage", (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prev) => [...prev, newMessage]);
        axios.put(`/api/message/mark/${newMessage._id}`);
      } else {
        setUnseenMessage((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    });

    socket.on("newReminder", (reminder) => {
      // Show a toast or update reminders — import toast
      toast(`⏰ Reminder: ${reminder.text}`, {
        duration: 5000,
        style: {
          background: "#1a1628",
          color: "#c4b5fd",
          border: "1px solid #7c3aed33",
        },
      });
    });

    // Delivered: receiver is online, message reached their device
    socket.on("messageDelivered", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId && msg.status !== "seen"
            ? { ...msg, status: "delivered" }
            : msg,
        ),
      );
    });

    // Single message seen (via markMessageAsSeen)
    socket.on("messageSeen", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, status: "seen", seen: true } : msg,
        ),
      );
    });

    // Bulk seen (when receiver opens the chat)
    socket.on("messagesSeen", ({ by }) => {
      if (selectedUser && by === selectedUser._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId !== by ? { ...msg, status: "seen", seen: true } : msg,
          ),
        );
      }
    });

    return () => {
      socket.off("newMessage");
      socket.off("newReminder");
      socket.off("messageDelivered");
      socket.off("messageSeen");
      socket.off("messagesSeen");
    };
  }, [socket, selectedUser]);

  const value = {
    messages,
    users,
    selectedUser,
    setSelectedUser,
    getUsers,
    getMessages,
    setMessages,
    sendMessage,
    unseenMessage,
    setUnseenMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
