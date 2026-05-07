import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";

const Sidebar = () => {
    const { getUsers, users, selectedUser, setSelectedUser, unseenMessage, setUnseenMessage } = useContext(ChatContext);
    const { logout, onlineUsers } = useContext(AuthContext);
    const [input, setInput] = useState("");
    const navigate = useNavigate();

    // Re-fetch users whenever online status changes
    useEffect(() => {
        getUsers();
    }, [onlineUsers]);

    const filteredUsers = input
        ? users.filter((u) => u.fullName.toLowerCase().includes(input.toLowerCase()))
        : users;

    return (
        <div className={`w-[260px] flex-shrink-0 bg-white/[0.03] border-r border-white/[0.06] h-full flex flex-col p-4 overflow-hidden text-white ${selectedUser ? "max-md:hidden" : ""}`}>

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-[13px] text-violet-400 tracking-[3px] uppercase">// Aura</span>
                <div className="relative group py-1">
                    <img src={assets.menu_icon} alt="Menu" className="w-4 cursor-pointer opacity-60 hover:opacity-100 transition-opacity" />
                    <div className="absolute top-full right-0 z-20 w-36 p-4 rounded-xl bg-[#1a1628] border border-white/10 text-gray-200 hidden group-hover:block shadow-xl">
                        <p onClick={() => navigate("/profile")} className="cursor-pointer text-xs py-1 hover:text-violet-400 transition-colors">Edit Profile</p>
                        <hr className="my-2 border-white/10" />
                        <p onClick={logout} className="cursor-pointer text-xs py-1 hover:text-red-400 transition-colors">Logout</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/[0.08] rounded-xl px-3 py-2 mb-4 focus-within:border-violet-500/40 transition-colors">
                <img src={assets.search_icon} alt="" className="w-3 opacity-40" />
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    type="text"
                    className="bg-transparent outline-none text-white text-[12px] placeholder-white/25 flex-1"
                    placeholder="Search users..."
                />
            </div>

            {/* User List */}
            <div className="flex flex-col gap-0.5 overflow-y-auto flex-1">
                {filteredUsers.map((user) => {
                    // Read from live onlineUsers array for real-time accuracy
                    const isOnline = onlineUsers.includes(user._id);
                    const isActive = selectedUser?._id === user._id;
                    const unseen = unseenMessage[user._id];

                    return (
                        <div
                            key={user._id}
                            onClick={() => {
                                setSelectedUser(user);
                                setUnseenMessage((prev) => ({ ...prev, [user._id]: 0 }));
                            }}
                            className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-150 ${isActive ? "bg-violet-500/15" : "hover:bg-white/[0.04]"}`}
                        >
                            <div className="relative flex-shrink-0">
                                <img
                                    src={user?.profilePic || assets.user_icon}
                                    alt=""
                                    className="w-9 h-9 rounded-full object-cover"
                                />
                                {/* Live green dot from socket onlineUsers */}
                                {isOnline && (
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0d0d14]" />
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[12.5px] font-medium truncate">{user.fullName}</span>
                                <span className={`text-[10.5px] ${isOnline ? "text-emerald-400" : "text-white/35"}`}>
                                    {isOnline ? "Online" : "Offline"}
                                </span>
                            </div>
                            {unseen > 0 && (
                                <span className="ml-auto text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full bg-violet-500 text-white flex-shrink-0">
                                    {unseen}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Sidebar;