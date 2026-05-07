import React, { useContext } from "react";
import Sidebar from "../component/Sidebar";
import ChatContainer from "../component/ChatContainer";
import RightSidebar from "../component/RightSidebar";
import { ChatContext } from "../../context/ChatContext";

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext);

  return (
    <div className="w-screen h-screen bg-[#0d0d14] flex items-center justify-center overflow-hidden">
      <div className="w-[92vw] h-[90vh] rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] flex flex-row overflow-hidden">
        <Sidebar />
        <ChatContainer />
        {selectedUser && <RightSidebar />}
      </div>
    </div>
  );
};

export default HomePage;