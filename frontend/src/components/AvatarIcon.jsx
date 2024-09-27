function AvatarIcon({ name, showStatus, isOnline }) {
  return (
    <div className="relative">
      <img
        src={`https://ui-avatars.com/api/?name=${name}&background=random&color=fff`}
        alt="avatar"
        className="rounded-full"
      />
      <div className="absolute left-[2.3rem] bottom-[0.1rem]">
        {showStatus &&
          (isOnline ? (
            <span className="flex w-2.5 h-2.5 bg-green-400 rounded-full flex-shrink-0"></span>
          ) : (
            <span className="flex w-2.5 h-2.5 bg-gray-400 rounded-full flex-shrink-0"></span>
          ))}
      </div>
    </div>
  );
}

export default AvatarIcon;
