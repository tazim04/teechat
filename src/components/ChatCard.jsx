function ChatCard({ contacts, openChat }) {
  return (
    <div className="flex flex-col flex-1 text-base">
      {contacts.map((contact, index) => (
        // Display the list of users in the server (excluding the current user)
        <div
          className="flex rounded-md py-2 px-5 mx-auto items-center transition ease-in-out cursor-pointer hover:bg-purple-600"
          style={{ width: "95%" }}
          key={index}
          onClick={() => openChat(contact)}
        >
          <img
            src={`https://ui-avatars.com/api/?name=${contact.name}&background=random&color=fff`}
            alt="avatar"
            className="rounded-full w-10 h-10 me-3"
          />
          <div>
            <span className="flex w-2.5 h-2.5 bg-green-500 rounded-full me-1.5 flex-shrink-0"></span>
          </div>
          {contact.name}
        </div>
      ))}
    </div>
  );
}

export default ChatCard;
