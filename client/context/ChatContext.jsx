import { Children, createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessage] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessage, setUnseenMessage] = useState([]);

  const { socket, axios } = useContext(AuthContext);

  //Function to get all users for sidebar
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/message/users");
      console.log("Users API response:", data);
      if (data.success) {
        setUsers(data.users);
        setUnseenMessage(data.unseenMessage);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  //function to get message for selected user
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/message/${userId}`);
      if (data.success) {
        setMessage(data.messages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Function to send message to selected user
  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(
        `/api/message/send/${selectedUser._id}`,
        messageData,
      );
      if (data.success) {
        setMessage((preMessage) => [...preMessage, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // function to subscribe to mesage for select user
  const subscribeToMessages = async ()=> {
    if(!socket) return;

    socket.on("newMessage",(newMessage)=>{
        if(selectedUser && newMessage.senderId === selectedUser._id){
            newMessage.seen = true;
            setMessage((preMessages)=>[...preMessages, newMessage]);
            axios.put(`/api/messages/mark/${newMessage._id}`);
        }else{
            setUnseenMessage((preUnseenMessages)=>({
                ...preUnseenMessages, [newMessage.senderId] : preUnseenMessages[newMessage.senderId] ? preUnseenMessages[newMessage.senderId] + 1 : 1 
            }))
        }
    })
  }

  // function to unsubscribe from messages
  const unsubscribeFromMessage = () => {
    if(socket) socket.off("newMessage");
  }

  useEffect(()=> {
    subscribeToMessages();
    return ()=> unsubscribeFromMessage();
  },[socket, selectedUser])

  const value = {
    messages, users, selectedUser, getUsers, getMessages,setMessage, sendMessage,setSelectedUser, unseenMessage, setUnseenMessage
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
