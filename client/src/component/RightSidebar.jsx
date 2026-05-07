import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";

const RightSidebar = () => {
  const { selectedUser, messages } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);
  const [msgImages, setMsgImages] = useState([]);

  useEffect(() => {
    setMsgImages(messages.filter((m) => m.image).map((m) => m.image));
  }, [messages]);

  if (!selectedUser) return null;

  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <div className="w-[220px] flex-shrink-0 border-l border-white/[0.06] flex flex-col items-center px-4 py-6 overflow-hidden text-white">

      {/* Profile info — fixed top section */}
      <div className="flex flex-col items-center w-full flex-shrink-0">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt=""
          className="w-16 h-16 rounded-full object-cover mb-3"
        />
        <div className="flex items-center gap-2 mb-1">
          {isOnline && <span className="w-2 h-2 bg-emerald-400 rounded-full" />}
          <h2 className="text-[13px] font-semibold">{selectedUser.fullName}</h2>
        </div>
        <p className="text-[11px] text-white/35 text-center leading-relaxed px-2">
          {selectedUser.bio || "No bio available"}
        </p>
      </div>

      <hr className="w-full border-white/[0.06] my-4 flex-shrink-0" />

      {/* Media — scrollable middle section */}
      <div className="flex flex-col w-full flex-1 min-h-0 overflow-hidden">
        <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2 flex-shrink-0">Media</p>
        <div className="overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-2 gap-2 w-full">
            {msgImages.length === 0 && (
              <p className="col-span-2 text-[11px] text-white/20 text-center py-4">No media yet</p>
            )}
            {msgImages.map((url, i) => (
              <div
                key={i}
                onClick={() => window.open(url)}
                className="aspect-square rounded-lg overflow-hidden cursor-pointer opacity-80 hover:opacity-100 transition-opacity bg-white/5"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logout — always pinned to bottom */}
      <div className="flex-shrink-0 w-full pt-4">
        <button
          onClick={logout}
          className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] hover:bg-red-500/20 transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default RightSidebar;