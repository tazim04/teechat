function ChatCard({ room, openChat }) {
  return (
    <div
      className="flex rounded-md py-2 px-5 mx-auto items-center transition ease-in-out cursor-pointer hover:bg-purple-600"
      style={{ width: "95%" }}
      key={index}
      onClick={() => openChat(room)}
    >
      <AvatarIcon username={room.name} />
      <div
        className=""
        style={{
          position: "relative",
          right: "1.3rem",
          top: "0.8rem",
        }}
      >
        {checkOnline(room) ? (
          <span className="flex w-2.5 h-2.5 bg-green-400 rounded-full me-1.5 flex-shrink-0"></span>
        ) : (
          <span className="flex w-2.5 h-2.5 bg-gray-400 rounded-full me-1.5 flex-shrink-0"></span>
        )}
      </div>
      {room.name}
    </div>
  );
}

export default ChatCard;
